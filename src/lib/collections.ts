import { getCollection, type CollectionEntry } from "astro:content";
import readingTime from "reading-time";

export type Post = CollectionEntry<"blog">;
export type Project = CollectionEntry<"projects">;
export type Category = Post["data"]["category"];
export type Audience = Post["data"]["audience"];

/** Category metadata — label + audience for the hard technical/personal split. */
export const CATEGORIES: Record<Category, { label: string; audience: Audience }> = {
  "ai-engineering": { label: "AI & Engineering", audience: "technical" },
  "tech-opinions": { label: "Tech Opinions", audience: "technical" },
  sports: { label: "Sports", audience: "personal" },
  random: { label: "Random", audience: "personal" },
};

export const CATEGORY_ORDER: Category[] = [
  "ai-engineering",
  "tech-opinions",
  "sports",
  "random",
];

/** Drafts are excluded from production builds (spec §10). */
const isVisible = (p: Post) => import.meta.env.DEV || !p.data.draft;

/** All published posts, newest first. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection("blog", isVisible);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** All projects, by explicit order then title. */
export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection("projects");
  return projects.sort(
    (a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title),
  );
}

/** Build-time reading time in minutes from the raw body. */
export function readingMinutes(entry: Post): number {
  return Math.max(1, Math.round(readingTime(entry.body ?? "").minutes));
}

export const categoryLabel = (c: Category) => CATEGORIES[c].label;
export const categoryAudience = (c: Category) => CATEGORIES[c].audience;

export function postsByCategory(posts: Post[], category: Category) {
  return posts.filter((p) => p.data.category === category);
}

/** Unique tags across posts with counts, sorted by frequency. */
export function allTags(posts: Post[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function postsByTag(posts: Post[], tag: string) {
  return posts.filter((p) => p.data.tags.includes(tag));
}

/** Series name → ordered parts. */
export function seriesParts(posts: Post[], name: string) {
  return posts
    .filter((p) => p.data.series?.name === name)
    .sort((a, b) => (a.data.series?.order ?? 0) - (b.data.series?.order ?? 0));
}

export function allSeries(posts: Post[]): string[] {
  return [...new Set(posts.map((p) => p.data.series?.name).filter(Boolean) as string[])];
}

/**
 * Related posts: same category first, then shared-tag overlap, ranked.
 * Never crosses the audience boundary (spec §10).
 */
export function relatedPosts(post: Post, all: Post[], limit = 3): Post[] {
  const audience = categoryAudience(post.data.category);
  const candidates = all.filter(
    (p) => p.id !== post.id && categoryAudience(p.data.category) === audience,
  );
  const scored = candidates.map((p) => {
    let score = 0;
    if (p.data.category === post.data.category) score += 5;
    score += p.data.tags.filter((t) => post.data.tags.includes(t)).length * 2;
    return { p, score };
  });
  return scored
    .sort((a, b) => b.score - a.score || b.p.data.pubDate.valueOf() - a.p.data.pubDate.valueOf())
    .slice(0, limit)
    .map((s) => s.p);
}

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});
export const formatDate = (d: Date) => DATE_FMT.format(d);
