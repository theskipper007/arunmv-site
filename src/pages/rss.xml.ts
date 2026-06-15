import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPublishedPosts, categoryLabel } from "../lib/collections";
import { SITE } from "../lib/seo";

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: `${SITE.name} — All writing`,
    description: SITE.description,
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
