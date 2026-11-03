#!/usr/bin/env node
/**
 * Send a published post to the matching Resend topic.
 *
 *   npm run newsletter -- <slug> --dry-run
 *   npm run newsletter -- <slug> --test you@example.com
 *   npm run newsletter -- <slug>
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const SITE = "https://www.arun-mv.com";
const CONTENT_DIR = new URL("../src/content/blog/", import.meta.url);
const LOG_PATH = new URL("../src/data/newsletter-sent.json", import.meta.url);
const PERSONAL = new Set(["sports", "random"]);
const argv = process.argv.slice(2);
const slug = argv[0];
const dryRun = argv.includes("--dry-run");
const force = argv.includes("--force");
const testIndex = argv.indexOf("--test");
const testTo = testIndex >= 0 ? argv[testIndex + 1] : null;

if (!slug || slug.startsWith("--")) {
  console.error("Usage: npm run newsletter -- <slug> [--dry-run | --test you@example.com] [--force]");
  process.exit(1);
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
if (!slugPattern.test(slug)) {
  console.error(`Invalid post slug: ${slug}`);
  process.exit(1);
}

const fileUrl = new URL(`${slug}.mdx`, CONTENT_DIR);
if (!existsSync(fileUrl)) {
  console.error(`No post at src/content/blog/${slug}.mdx`);
  process.exit(1);
}

const source = readFileSync(fileUrl, "utf8");
const fmMatch = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
if (!fmMatch) throw new Error(`${slug} is missing YAML frontmatter`);
const fm = yaml.load(fmMatch[1]);
const body = source.slice(fmMatch[0].length);
if (fm.draft) {
  console.error(`${slug} is still a draft. Publish it first.`);
  process.exit(1);
}

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));
const sent = JSON.parse(readFileSync(LOG_PATH, "utf8"));
if (!dryRun && !testTo && !force && sent.some((item) => item.slug === slug)) {
  console.error(`${slug} was already sent on ${sent.find((item) => item.slug === slug).date}. Use --force to resend.`);
  process.exit(1);
}

const postUrl = `${SITE}/blog/${slug}`;
const result = fm.result ?? {};
const headline = result.headline ?? "";
const subject = headline ? `${fm.title} · ${headline}` : fm.title;
const readingMinutes = Math.max(1, Math.ceil(body.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length / 220));

const posts = readdirSync(CONTENT_DIR)
  .filter((name) => name.endsWith(".mdx") && name !== `${slug}.mdx`)
  .map((name) => {
    const otherSource = readFileSync(new URL(name, CONTENT_DIR), "utf8");
    const match = otherSource.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return null;
    const data = yaml.load(match[1]);
    if (data.draft) return null;
    return { slug: name.slice(0, -4), ...data };
  })
  .filter(Boolean)
  .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
const related = posts.find((post) => fm.topic && post.topic === fm.topic)
  ?? posts.find((post) => post.category === fm.category);

// Covers are rasterised to PNG at build time (copy-newsletter-covers.mjs): email clients drop SVG.
const heroExt = fm.heroImage ? path.extname(fm.heroImage).toLowerCase() : "";
const imageUrl = fm.heroImage && [".svg", ".png", ".jpg", ".jpeg", ".webp"].includes(heroExt)
  ? `${SITE}/newsletter-covers/${slug}${[".svg", ".webp"].includes(heroExt) ? ".png" : heroExt}`
  : `${SITE}/og/${slug}.png`;
const TYPE_NOUN = {
  experiment: "the experiment", ablation: "the ablation", benchmark: "the benchmark",
  reproduction: "the reproduction", trendtest: "the test", explainer: "the explainer",
  buildlog: "the build", derivation: "the derivation", bugautopsy: "the bug hunt",
  papernote: "the paper", fieldlog: "the log", reflection: "the reflection",
};
const typeNoun = TYPE_NOUN[fm.type] ?? "the post";
const category = String(fm.category ?? "Writing").replace(/-/g, " ");
const outcome = result.claim || fm.description;
const detail = [result.setup, result.resolution].filter(Boolean).join(" · ");

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light"><title>${esc(fm.title)}</title></head>
<body style="margin:0;padding:0;background:#f1efeb;color:#1a1a18;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1efeb;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#fbfaf8;border:1px solid #e7e4df;border-radius:16px;overflow:hidden;">
<tr><td style="padding:25px 42px 21px;border-bottom:1px solid #e7e4df;">
<table role="presentation" width="100%"><tr><td><div style="font-family:Georgia,serif;font-size:21px;font-weight:bold;letter-spacing:-.04em;">Arun <span style="color:#c25a3c;">MV</span></div><div style="margin-top:4px;color:#77766f;font-size:11px;">Production AI, tested in the real world.</div></td><td align="right" style="color:#77766f;font:10px 'Courier New',monospace;letter-spacing:.1em;">NEW FIELD NOTE</td></tr></table>
</td></tr>
<tr><td style="padding:32px 42px 14px;">
<span style="display:inline-block;padding:7px 10px;border:1px solid #ead4cb;border-radius:99px;background:#fff7f3;color:#a84a2f;font:10px 'Courier New',monospace;letter-spacing:.07em;text-transform:uppercase;">${esc(category)}</span>
<div style="margin-top:18px;color:#77766f;font:10px 'Courier New',monospace;letter-spacing:.1em;text-transform:uppercase;">A new post is live</div>
<h1 style="margin:9px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.08;font-weight:500;letter-spacing:-.04em;color:#1a1a18;">${esc(fm.title)}</h1>
<p style="margin:15px 0 0;color:#5c5b55;font-size:15px;line-height:1.7;">${esc(fm.description)}</p>
</td></tr>
<tr><td style="padding:12px 42px 0;"><img src="${imageUrl}" width="596" alt="Cover image for ${esc(fm.title)}" style="display:block;width:100%;height:auto;border:1px solid #e7e4df;border-radius:11px;background:#0a0d12;"></td></tr>
<tr><td style="padding:22px 42px 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3eee8;border:1px solid #e7e2dc;border-radius:12px;"><tr><td style="padding:20px 22px;">
<div style="color:#77766f;font:10px 'Courier New',monospace;letter-spacing:.1em;text-transform:uppercase;">The insight</div>
${headline ? `<div style="margin-top:8px;color:#c25a3c;font-family:Georgia,serif;font-size:39px;line-height:1.05;letter-spacing:-.04em;">${esc(headline)}</div>` : ""}
<div style="margin-top:8px;color:#1a1a18;font-family:Georgia,serif;font-size:17px;line-height:1.45;">${esc(outcome)}</div>
${detail ? `<div style="margin-top:9px;color:#77766f;font-size:12px;line-height:1.6;">${esc(detail)}</div>` : ""}
</td></tr></table></td></tr>
<tr><td style="padding:22px 42px 0;"><div style="color:#1a1a18;font-family:Georgia,serif;font-size:20px;letter-spacing:-.02em;">Why it’s worth a read</div>
<p style="margin:8px 0 17px;color:#5c5b55;font-size:14px;line-height:1.75;">${esc(result.verdictNote || `The full write-up of ${typeNoun}: what I found, how I approached it, and what you can take into your own work.`)}</p>
<table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:7px;background:#c25a3c;"><a href="${postUrl}" style="display:inline-block;padding:14px 19px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">Read the post&nbsp; →</a></td></tr></table>
<div style="margin-top:9px;color:#8a8980;font-size:11px;">About ${readingMinutes} min · Full post, sources, and working details</div>
</td></tr>
<tr><td style="padding:24px 42px 25px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff;border:1px solid #e7e4df;border-radius:11px;"><tr><td style="padding:16px 18px;">
<div style="color:#77766f;font:10px 'Courier New',monospace;letter-spacing:.1em;text-transform:uppercase;">Keep exploring</div>
${related ? `<a href="${SITE}/blog/${encodeURIComponent(related.slug)}" style="display:block;margin-top:9px;color:#1a1a18;text-decoration:none;font-family:Georgia,serif;font-size:16px;">${esc(related.title)} <span style="color:#c25a3c;">→</span></a><div style="margin-top:4px;color:#77766f;font-size:12px;line-height:1.55;">${esc(related.description)}</div>` : `<a href="${SITE}/blog" style="display:block;margin-top:9px;color:#1a1a18;text-decoration:none;font-family:Georgia,serif;font-size:16px;">Explore all writing <span style="color:#c25a3c;">→</span></a>`}
</td></tr></table>
<div style="margin-top:14px;color:#5c5b55;font-size:12px;line-height:1.8;">More from me: <a href="${SITE}/blog" style="color:#a84a2f;text-decoration:none;">all writing</a> &nbsp;·&nbsp; <a href="${SITE}/projects" style="color:#a84a2f;text-decoration:none;">projects</a> &nbsp;·&nbsp; <a href="${SITE}/about" style="color:#a84a2f;text-decoration:none;">about</a></div>
</td></tr>
<tr><td align="center" style="padding:20px 42px 26px;border-top:1px solid #e7e4df;color:#77766f;font-size:11px;line-height:1.7;">You’re receiving this because you subscribed to new writing from Arun MV.<br><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#77766f;text-decoration:underline;">Unsubscribe or change topics</a> &nbsp;·&nbsp; <a href="${SITE}" style="color:#77766f;text-decoration:underline;">arun-mv.com</a><div style="margin-top:10px;color:#aaa9a2;font:9px 'Courier New',monospace;letter-spacing:.08em;">SENT WHEN THERE’S SOMETHING WORTH SHARING</div></td></tr>
</table></td></tr></table></body></html>`;

const text = `${fm.title}\n\n${fm.description}\n\n${headline ? `${headline}\n${outcome}\n` : `${outcome}\n`}\nRead the post: ${postUrl}\n${related ? `\nMore to read: ${SITE}/blog/${related.slug}` : ""}\n\nMore writing: ${SITE}/blog\nProjects: ${SITE}/projects\nAbout: ${SITE}/about\n\nUnsubscribe or change topics: {{{RESEND_UNSUBSCRIBE_URL}}}`;
const topicName = PERSONAL.has(fm.category) ? "RESEND_TOPIC_PERSONAL" : "RESEND_TOPIC_TECHNICAL";
const from = process.env.NEWSLETTER_FROM ?? "Arun MV <newsletter@arun-mv.com>";
const env = (name) => {
  if (!process.env[name]) throw new Error(`${name} is not set. Add it to .env.local or the GitHub Actions secrets.`);
  return process.env[name];
};

if (dryRun) {
  console.log(`Subject: ${subject}\nTopic:   ${topicName}\nImage:   ${imageUrl}\n\n${text}`);
} else {
  const apiKey = env("RESEND_API_KEY");
  const request = async (endpoint, method, body) => {
    const response = await fetch(`https://api.resend.com${endpoint}`, {
      method,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${method} ${endpoint} → ${response.status} ${JSON.stringify(data)}`);
    return data;
  };

  if (testTo) {
    const response = await request("/emails", "POST", {
      from, to: [testTo], subject: `[test] ${subject}`,
      html: html.replace("{{{RESEND_UNSUBSCRIBE_URL}}}", "#"),
      text: text.replace("{{{RESEND_UNSUBSCRIBE_URL}}}", "#"),
    });
    console.log(`Test email sent to ${testTo} (${response.id}).`);
  } else {
    if (!force) {
      const page = await request("/broadcasts?limit=100", "GET");
      const existing = (page.data ?? []).find((broadcast) => broadcast.name === slug && ["sent", "queued", "scheduled"].includes(broadcast.status));
      if (existing) {
        if (!sent.some((item) => item.slug === slug)) {
          sent.push({ slug, title: fm.title, date: (existing.updated_at ?? existing.created_at ?? new Date().toISOString()).slice(0, 10), broadcastId: existing.id });
          writeFileSync(LOG_PATH, `${JSON.stringify(sent, null, 2)}\n`);
        }
        console.log(`${slug} already has a ${existing.status} Resend broadcast (${existing.id}); archive updated without resending.`);
      } else {
        const response = await request("/broadcasts", "POST", {
          name: slug,
          segment_id: env("RESEND_SEGMENT_ID"),
          topic_id: env(topicName),
          from,
          subject,
          html,
          text,
          send: true,
        });
        sent.push({ slug, title: fm.title, date: new Date().toISOString().slice(0, 10), broadcastId: response.id });
        writeFileSync(LOG_PATH, `${JSON.stringify(sent, null, 2)}\n`);
        console.log(`Broadcast ${response.id} sent for ${slug}. Logged in src/data/newsletter-sent.json.`);
      }
    }
    else {
      const response = await request("/broadcasts", "POST", {
        name: slug,
        segment_id: env("RESEND_SEGMENT_ID"),
        topic_id: env(topicName),
        from,
        subject,
        html,
        text,
        send: true,
      });
      sent.push({ slug, title: fm.title, date: new Date().toISOString().slice(0, 10), broadcastId: response.id });
      writeFileSync(LOG_PATH, `${JSON.stringify(sent, null, 2)}\n`);
      console.log(`Broadcast ${response.id} sent for ${slug}. Logged in src/data/newsletter-sent.json.`);
    }
  }
}
