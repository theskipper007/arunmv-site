import type { APIRoute } from "astro";
import { EMAIL_RE, LISTS, sendConfirmEmail, type List } from "../../lib/newsletter";

export const prerender = false;

/**
 * POST email + list → send a confirm link. Works as a JSON API for the
 * enhanced form and as a plain form post (303 redirect) without JS.
 * Bots that fill the honeypot get the same success response and no email.
 */
export const POST: APIRoute = async ({ request, url, redirect }) => {
  const wantsJson = (request.headers.get("accept") ?? "").includes("application/json");
  const reply = (status: number, body: { ok: boolean; message: string }, to: string) =>
    wantsJson
      ? new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
      : redirect(to, 303);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(400, { ok: false, message: "Send the form as form data." }, "/newsletter?error=form");
  }

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const list = (LISTS.includes(form.get("list") as List) ? form.get("list") : "technical") as List;
  const honeypot = String(form.get("company") ?? "");

  if (honeypot) return reply(200, { ok: true, message: "Check your inbox." }, "/newsletter/check-email");
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return reply(
      400,
      { ok: false, message: "That doesn't look like an email address. Check it and try again." },
      "/newsletter?error=email",
    );
  }

  try {
    await sendConfirmEmail(email, list, url.origin);
  } catch (err) {
    console.error("[newsletter] subscribe failed:", err);
    return reply(
      502,
      { ok: false, message: "Couldn't send the confirmation email. Try again in a minute." },
      "/newsletter?error=send",
    );
  }
  return reply(
    200,
    { ok: true, message: `Check ${email} for a confirmation link. It works for 48 hours.` },
    "/newsletter/check-email",
  );
};
