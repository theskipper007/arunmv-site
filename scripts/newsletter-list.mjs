#!/usr/bin/env node
/**
 * List newsletter subscribers: confirmed contacts in the Resend segment and
 * which topics each one gets.
 *
 *   npm run newsletter:list
 */
const key = process.env.RESEND_API_KEY;
const segment = process.env.RESEND_SEGMENT_ID;
if (!key || !segment) {
  console.error("RESEND_API_KEY / RESEND_SEGMENT_ID not set. Run `vercel env pull .env.local` first.");
  process.exitCode = 1;
} else {
  const get = async (path) => {
    const res = await fetch(`https://api.resend.com${path}`, { headers: { Authorization: `Bearer ${key}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${JSON.stringify(data)}`);
    return data;
  };

  const contacts = [];
  let after;
  do {
    const page = await get(`/segments/${segment}/contacts?limit=100${after ? `&after=${after}` : ""}`);
    contacts.push(...(page.data ?? []));
    after = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (after);

  const rows = [];
  for (const c of contacts) {
    const topics = await get(`/contacts/${c.id}/topics`);
    const on = (topics.data ?? []).filter((t) => t.subscription === "opt_in").map((t) => t.name.replace(" posts", ""));
    rows.push({ email: c.email, status: c.unsubscribed ? "unsubscribed" : "subscribed", topics: on.join(" + ") || "none", since: c.created_at?.slice(0, 10) ?? "" });
  }

  const active = rows.filter((r) => r.status === "subscribed");
  console.log(`${active.length} subscribed · ${rows.length - active.length} unsubscribed\n`);
  if (rows.length) console.table(rows);
}
