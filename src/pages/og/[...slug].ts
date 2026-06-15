import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";
import { categoryLabel } from "../../lib/collections";
import { SITE } from "../../lib/seo";

const posts = await getCollection("blog");
const projects = await getCollection("projects");

// Keys map to /og/<key>.png — astro-og-canvas appends the .png extension.
const pages: Record<string, { title: string; description: string }> = {
  default: { title: SITE.name, description: SITE.tagline },
};
for (const p of posts) {
  pages[p.id] = {
    title: p.data.title,
    description: `${categoryLabel(p.data.category)} · ${SITE.name}`,
  };
}
for (const p of projects) {
  pages[p.id] = { title: p.data.title, description: `Project · ${SITE.name}` };
}

export const { getStaticPaths, GET } = await OGImageRoute({
  param: "slug",
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [
      [251, 250, 248],
      [244, 240, 235],
    ],
    border: { color: [194, 90, 60], width: 24, side: "inline-start" },
    padding: 80,
    font: {
      title: { color: [26, 26, 24], size: 64, weight: "Bold", lineHeight: 1.1 },
      description: { color: [92, 91, 85], size: 30, weight: "Normal" },
    },
  }),
});
