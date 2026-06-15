import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPublishedPosts, categoryLabel, categoryAudience } from "../lib/collections";
import { SITE } from "../lib/seo";

// Technical-only feed — never mixes in the personal audience (spec §1, §10).
export async function GET(context: APIContext) {
  const posts = (await getPublishedPosts()).filter(
    (p) => categoryAudience(p.data.category) === "technical",
  );
  return rss({
    title: `${SITE.name} — Technical`,
    description: "AI engineering and tech-opinions writing only.",
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: [categoryLabel(post.data.category), ...post.data.tags],
    })),
    customData: `<language>en-us</language>`,
  });
}
