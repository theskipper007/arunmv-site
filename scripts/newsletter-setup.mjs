#!/usr/bin/env node
/**
 * One-time newsletter setup in Resend: a "Newsletter" segment plus two topics
 * that mirror the site's audience split. Safe to rerun; existing ones are reused.
 *
 *   npm run newsletter:setup
 *
 * Prints the IDs to add as env vars (RESEND_SEGMENT_ID, RESEND_TOPIC_*).
 */
const API = "https://api.resend.com";
const key = process.env.RESEND_API_KEY;
if (!key) {
  console.error("RESEND_API_KEY is not set. Run `vercel env pull .env.local` first.");
  process.exit(1);
}

async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function findOrCreate(kind, name, body) {
  const list = await call("GET", `/${kind}`);
  const found = (list.data ?? []).find((x) => x.name === name);
  if (found) return { id: found.id, created: false };
  const made = await call("POST", `/${kind}`, { name, ...body });
  return { id: made.id, created: true };
}

const segment = await findOrCreate("segments", "Newsletter", {});
const technical = await findOrCreate("topics", "Technical posts", {
  default_subscription: "opt_in",
  description: "Experiments, explainers, build logs and essays on AI engineering.",
  visibility: "public",
});
const personal = await findOrCreate("topics", "Personal posts", {
  default_subscription: "opt_out",
  description: "Sports, life and the occasional tangent.",
  visibility: "public",
});

for (const [label, r] of [["segment", segment], ["technical topic", technical], ["personal topic", personal]]) {
  console.log(`${r.created ? "created" : "reused "} ${label}: ${r.id}`);
}
console.log(`\nRESEND_SEGMENT_ID=${segment.id}\nRESEND_TOPIC_TECHNICAL=${technical.id}\nRESEND_TOPIC_PERSONAL=${personal.id}`);
