import type { APIContext } from "astro";
import { getPublishedPosts, getProjects, categoryLabel } from "../lib/collections";
import { SITE } from "../lib/seo";

// AI-crawler index following the llms.txt convention (spec §11).
export async function GET(_context: APIContext) {
  const posts = await getPublishedPosts();
  const projects = await getProjects();

  const lines: string[] = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    "Practical, reliable, cost-aware AI engineering. Backend/platform engineer turned applied AI.",
    "",
    "## Key pages",
    `- [Home](${SITE.url}/)`,
    `- [Blog](${SITE.url}/blog)`,
    `- [Projects](${SITE.url}/projects)`,
    `- [About](${SITE.url}/about)`,
    "",
    "## Blog posts",
    ...posts.map(
      (p) =>
        `- [${p.data.title}](${SITE.url}/blog/${p.id}): ${p.data.description} (${categoryLabel(p.data.category)})`,
    ),
    "",
    "## Projects",
    ...(projects.length
      ? projects.map(
          (p) => `- [${p.data.title}](${SITE.url}/projects/${p.id}): ${p.data.summary}`,
        )
      : ["Coming soon."]),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
