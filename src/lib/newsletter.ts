/**
 * Newsletter backend (server only): double opt-in over Resend.
 *
 * Subscribe sends a signed confirm link; nothing is stored until the link is
 * clicked, so no database is needed. Confirmed contacts join one segment, and
 * two topics carry the audience split the RSS feeds already use:
 *   technical → Technical opt-in, Personal opt-out
 *   all       → both opt-in
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSecret } from "astro:env/server";
import { SITE } from "./seo";

export type List = "technical" | "all";
export const LISTS: List[] = ["technical", "all"];

const RESEND = "https://api.resend.com";
const TOKEN_TTL_MS = 48 * 60 * 60 * 1000;
export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

function config() {
  const cfg = {
    apiKey: getSecret("RESEND_API_KEY"),
    secret: getSecret("NEWSLETTER_SECRET"),
    from: getSecret("NEWSLETTER_FROM") ?? `Arun MV <newsletter@arun-mv.com>`,
    segment: getSecret("RESEND_SEGMENT_ID"),
    topicTechnical: getSecret("RESEND_TOPIC_TECHNICAL"),
    topicPersonal: getSecret("RESEND_TOPIC_PERSONAL"),
  };
  const missing = Object.entries(cfg)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) throw new Error(`Newsletter not configured: missing ${missing.join(", ")}`);
  return cfg as { [K in keyof typeof cfg]: string };
}

/* ── Signed confirm tokens ─────────────────────────────────────────────── */

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url");

export function makeToken(email: string, list: List, now = Date.now()): string {
  const payload = b64(JSON.stringify({ e: email, l: list, x: now + TOKEN_TTL_MS }));
  return `${payload}.${sign(payload, config().secret)}`;
}

export function readToken(
  token: string,
  now = Date.now(),
): { email: string; list: List } | { error: "invalid" | "expired" } {
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return { error: "invalid" };
  const expected = Buffer.from(sign(payload, config().secret));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { error: "invalid" };
  try {
    const { e, l, x } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof e !== "string" || !LISTS.includes(l)) return { error: "invalid" };
    if (typeof x !== "number" || x < now) return { error: "expired" };
    return { email: e, list: l };
  } catch {
    return { error: "invalid" };
  }
}

/* ── Resend calls ──────────────────────────────────────────────────────── */

async function resend(path: string, init: { method: string; body?: unknown }) {
  const res = await fetch(`${RESEND}${path}`, {
    method: init.method,
    headers: { Authorization: `Bearer ${config().apiKey}`, "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data: data as Record<string, unknown> };
}

function topicsFor(list: List) {
  const { topicTechnical, topicPersonal } = config();
  return [
    { id: topicTechnical, subscription: "opt_in" },
    { id: topicPersonal, subscription: list === "all" ? "opt_in" : "opt_out" },
  ];
}

export async function sendConfirmEmail(email: string, list: List, origin: string) {
  const link = `${origin}/api/confirm?token=${encodeURIComponent(makeToken(email, list))}`;
  const what = list === "all" ? "every new post, including the personal ones" : "new technical posts";
  const html = `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.6;color:#1A1A18;max-width:520px">
<p>Hi,</p>
<p>Confirm your email to get ${what} from ${SITE.name}.</p>
<p><a href="${link}" style="display:inline-block;background:#1A1A18;color:#FBFAF8;padding:12px 22px;border-radius:999px;text-decoration:none">Confirm subscription</a></p>
<p style="color:#5C5B55;font-size:14px">The link works for 48 hours. If you didn't ask for this, ignore this email and nothing happens.</p>
<p style="color:#8A8980;font-size:13px">${SITE.url.replace("https://", "")}</p>
</div>`;
  const text = `Confirm your email to get ${what} from ${SITE.name}:\n\n${link}\n\nThe link works for 48 hours. If you didn't ask for this, ignore this email.`;
  const r = await resend("/emails", {
    method: "POST",
    body: { from: config().from, to: [email], subject: `Confirm your subscription to ${SITE.name}`, html, text },
  });
  if (!r.ok) throw new Error(`Resend /emails ${r.status}: ${JSON.stringify(r.data)}`);
}

/** Create the contact, or re-subscribe and update an existing one. */
export async function confirmSubscriber(email: string, list: List) {
  const { segment } = config();
  const created = await resend("/contacts", {
    method: "POST",
    body: { email, unsubscribed: false, segments: [{ id: segment }], topics: topicsFor(list) },
  });
  if (created.ok) return;

  // Already a contact (e.g. re-subscribing or switching lists): update in place.
  const id = encodeURIComponent(email);
  const steps = [
    await resend(`/contacts/${id}`, { method: "PATCH", body: { unsubscribed: false } }),
    await resend(`/contacts/${id}/segments/${segment}`, { method: "POST" }),
    await resend(`/contacts/${id}/topics`, { method: "PATCH", body: topicsFor(list) }),
  ];
  // Adding to a segment the contact is already in may answer 4xx; only the PATCHes must succeed.
  const failed = [steps[0], steps[2]].find((s) => !s.ok);
  if (failed) {
    throw new Error(
      `Resend contact upsert failed (create ${created.status}: ${JSON.stringify(created.data)}; update ${failed.status}: ${JSON.stringify(failed.data)})`,
    );
  }
}
