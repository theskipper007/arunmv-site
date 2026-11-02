import type { APIContext } from "astro";
import { getPublishedPosts, getProjects, categoryLabel, typeLabel } from "../lib/collections";
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
    "Research on retrieval, LLM evaluation and agent reliability, from an engineer who ships production LLM systems.",
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
        `- [${p.data.title}](${SITE.url}/blog/${p.id}): ${p.data.description} (${categoryLabel(p.data.category)} · ${typeLabel(p.data.type)})`,
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
