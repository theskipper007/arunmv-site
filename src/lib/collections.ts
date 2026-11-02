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

/**
 * Per-topic colour palette (spec §7 extension). Each category gets a distinct
 * three-stop gradient used by animated cover art, plus a single `tint` used for
 * category pills and accents. Keeps topics visually distinguishable at a glance.
 */
export const CATEGORY_THEME: Record<
  Category,
  { c1: string; c2: string; c3: string; tint: string }
> = {
  "ai-engineering": { c1: "#6366F1", c2: "#22D3EE", c3: "#8B5CF6", tint: "#6D63F1" },
  "tech-opinions": { c1: "#C25A3C", c2: "#E0A458", c3: "#D97706", tint: "#C25A3C" },
  sports: { c1: "#10B981", c2: "#84CC16", c3: "#0EA5E9", tint: "#0E9E6E" },
  random: { c1: "#EC4899", c2: "#F472B6", c3: "#A855F7", tint: "#D6438C" },
};

export const categoryTheme = (c: Category) => CATEGORY_THEME[c];

export type PostType = Post["data"]["type"];
export type Topic = NonNullable<Post["data"]["topic"]>;

/**
 * Post types from the research-in-public format list. `research` types get the
 * result card, cite block and ScholarlyArticle schema; essays render unchanged.
 */
export const POST_TYPES: Record<PostType, { label: string; color: string; research: boolean }> = {
  essay: { label: "Essay", color: "var(--color-faint)", research: false },
  experiment: { label: "Experiment", color: "#C25A3C", research: true },
  ablation: { label: "Ablation", color: "#B23A2B", research: true },
  benchmark: { label: "Benchmark", color: "#C9821B", research: true },
  explainer: { label: "Explainer", color: "#3B6EA5", research: false },
  buildlog: { label: "Build log", color: "#2E8B57", research: false },
  derivation: { label: "Derivation", color: "#7A4FC4", research: false },
  bugautopsy: { label: "Bug autopsy", color: "#8A5A44", research: false },
  papernote: { label: "Paper note", color: "#0F8A7A", research: false },
  reproduction: { label: "Reproduction", color: "#A33B6B", research: true },
  trendtest: { label: "Trend test", color: "#B07A10", research: true },
  fieldlog: { label: "Field log", color: "var(--color-muted)", research: false },
  reflection: { label: "Reflection", color: "var(--color-muted)", research: false },
};
export const typeLabel = (t: PostType) => POST_TYPES[t].label;
export const isResearchType = (t: PostType) => POST_TYPES[t].research;

/** Topic sub-sections for the Writing page, grouped under their category. */
export const TOPICS: Record<Topic, { label: string; category: Category }> = {
  retrieval: { label: "Retrieval & RAG", category: "ai-engineering" },
  graphs: { label: "Knowledge graphs & memory", category: "ai-engineering" },
  evals: { label: "Evals & hallucination", category: "ai-engineering" },
  agents: { label: "Agents & workflows", category: "ai-engineering" },
  systems: { label: "Cost, architecture & governance", category: "ai-engineering" },
  opinions: { label: "Opinions", category: "tech-opinions" },
  sports: { label: "Sports", category: "sports" },
  random: { label: "Random", category: "random" },
};
export const TOPIC_ORDER = Object.keys(TOPICS) as Topic[];
export const topicLabel = (t: Topic) => TOPICS[t].label;

/** Topic falls back to the category's own bucket for posts without one. */
export function postTopic(p: Post): Topic {
  if (p.data.topic) return p.data.topic;
  const fallback: Record<Category, Topic> = {
    "ai-engineering": "systems",
    "tech-opinions": "opinions",
    sports: "sports",
    random: "random",
  };
  return fallback[p.data.category];
}

export function postsByTopic(posts: Post[], topic: Topic) {
  return posts.filter((p) => postTopic(p) === topic);
}

export function postsByType(posts: Post[], type: PostType) {
  return posts.filter((p) => p.data.type === type);
}

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
    if (postTopic(p) === postTopic(post)) score += 3;
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
