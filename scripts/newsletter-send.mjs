#!/usr/bin/env node
/**
 * Email a published post to subscribers as a Resend broadcast.
 *
 *   npm run newsletter -- <slug> --dry-run          print the email, send nothing
 *   npm run newsletter -- <slug> --test you@x.com   send one copy to yourself
 *   npm run newsletter -- <slug>                    send to the segment
 *
 * Technical posts go to the "Technical posts" topic; sports/random posts go to
 * "Personal posts", mirroring the RSS split. Sent slugs are logged in
 * src/data/newsletter-sent.json, which also feeds the /newsletter archive and
 * blocks accidental double sends (override with --force).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import yaml from "js-yaml";

const SITE = "https://www.arun-mv.com";
const LOG = new URL("../src/data/newsletter-sent.json", import.meta.url);
const PERSONAL = new Set(["sports", "random"]);

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--test");
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const testTo = args.includes("--test") ? args[args.indexOf("--test") + 1] : null;

if (!slug) {
  console.error("Usage: npm run newsletter -- <slug> [--dry-run | --test you@example.com] [--force]");
  process.exit(1);
}

const file = new URL(`../src/content/blog/${slug}.mdx`, import.meta.url);
if (!existsSync(file)) {
  console.error(`No post at src/content/blog/${slug}.mdx`);
  process.exit(1);
}
const fm = yaml.load(readFileSync(file, "utf8").split(/^---\s*$/m)[1]);
if (fm.draft) {
  console.error(`${slug} is still a draft. Publish it first.`);
  process.exit(1);
}

const sent = JSON.parse(readFileSync(LOG, "utf8"));
if (!dryRun && !testTo && !force && sent.some((s) => s.slug === slug)) {
  console.error(`${slug} was already sent on ${sent.find((s) => s.slug === slug).date}. Use --force to resend.`);
  process.exit(1);
}

const url = `${SITE}/blog/${slug}`;
const headline = fm.result?.headline;
const subject = headline ? `${fm.title}: ${headline}` : fm.title;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const html = `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.6;color:#1A1A18;max-width:560px">
<p style="font-family:ui-monospace,monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#8A8980">New on arun-mv.com</p>
<h1 style="font-family:Georgia,serif;font-size:26px;line-height:1.2;margin:8px 0 12px">${esc(fm.title)}</h1>
${headline ? `<p style="border-left:2px solid #C25A3C;padding-left:10px;font-family:ui-monospace,monospace;font-size:14px">${esc(headline)}${fm.result.detail ? ` · ${esc(fm.result.detail)}` : ""}</p>` : ""}
<p style="color:#5C5B55">${esc(fm.description)}</p>
<p><a href="${url}" style="display:inline-block;background:#1A1A18;color:#FBFAF8;padding:12px 22px;border-radius:999px;text-decoration:none">Read the post</a></p>
<p style="color:#8A8980;font-size:13px;margin-top:32px">You're getting this because you subscribed at arun-mv.com. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#8A8980">Unsubscribe or change topics</a>.</p>
</div>`;
const text = `${fm.title}\n${headline ? `${headline}\n` : ""}\n${fm.description}\n\nRead it: ${url}\n\nUnsubscribe or change topics: {{{RESEND_UNSUBSCRIBE_URL}}}`;

const env = (name) => {
  const v = process.env[name];
  if (!v) {
    console.error(`${name} is not set. Run \`vercel env pull .env.local\` (and \`npm run newsletter:setup\`).`);
    process.exit(1);
  }
  return v;
};
const topicName = PERSONAL.has(fm.category) ? "RESEND_TOPIC_PERSONAL" : "RESEND_TOPIC_TECHNICAL";

async function call(path, body) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`POST ${path} → ${res.status} ${JSON.stringify(data)}`);
  return data;
}

// No process.exit() after a fetch: on Windows it can trip a libuv assertion
// while sockets are closing. Let the event loop drain instead.
const from = process.env.NEWSLETTER_FROM ?? "Arun MV <newsletter@arun-mv.com>";
if (dryRun) {
  console.log(`Subject: ${subject}\nTopic:   ${topicName}\n\n${text}`);
} else if (testTo) {
  const r = await call("/emails", {
    from,
    to: [testTo],
    subject: `[test] ${subject}`,
    html: html.replace("{{{RESEND_UNSUBSCRIBE_URL}}}", "#"),
    text: text.replace("{{{RESEND_UNSUBSCRIBE_URL}}}", "#"),
  });
  console.log(`Test email sent to ${testTo} (${r.id}).`);
} else {
  const r = await call("/broadcasts", {
    name: slug,
    segment_id: env("RESEND_SEGMENT_ID"),
    topic_id: env(topicName),
    from,
    subject,
    html,
    text,
    send: true,
  });
  sent.push({ slug, title: fm.title, date: new Date().toISOString().slice(0, 10), broadcastId: r.id });
  writeFileSync(LOG, JSON.stringify(sent, null, 2) + "\n");
  console.log(`Broadcast ${r.id} sent for ${slug}. Logged in src/data/newsletter-sent.json — commit it.`);
}
