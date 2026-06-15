import type { APIContext } from "astro";
import { getPublishedPosts, categoryLabel, formatDate } from "../lib/collections";
import { SITE } from "../lib/seo";

// Full-text variant: inlines post bodies for models that ingest them (spec §11).
export async function GET(_context: APIContext) {
  const posts = await getPublishedPosts();

  const blocks = posts.map((p) =>
    [
      `# ${p.data.title}`,
      `URL: ${SITE.url}/blog/${p.id}`,
      `Category: ${categoryLabel(p.data.category)} | Published: ${formatDate(p.data.pubDate)}`,
      "",
      p.data.description,
      "",
      (p.body ?? "").trim(),
      "",
      "---",
      "",
    ].join("\n"),
  );

  const out = [`# ${SITE.name} — Full content`, "", `> ${SITE.description}`, "", ...blocks].join(
    "\n",
  );

  return new Response(out, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
