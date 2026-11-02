import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Blog — type-safe frontmatter with hard audience separation (spec §10).
const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().max(160), // also used for meta + OG
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      category: z.enum(["ai-engineering", "tech-opinions", "sports", "random"]),
      audience: z.enum(["technical", "personal"]), // hard separation
      tags: z.array(z.string()).default([]),
      series: z.object({ name: z.string(), order: z.number() }).optional(),
      heroImage: image().optional(),
      // Path to a looping cover video in /public (e.g. "/covers/foo.mp4" or .webm).
      // When set, the cover renders as a muted autoplay loop. Falls back to
      // heroImage, then to an animated per-topic gradient.
      heroVideo: z.string().optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),

      // Research layer — every field optional so plain essays need none of it.
      type: z
        .enum([
          "essay",
          "experiment",
          "ablation",
          "benchmark",
          "explainer",
          "buildlog",
          "derivation",
          "bugautopsy",
          "papernote",
          "reproduction",
          "trendtest",
          "fieldlog",
          "reflection",
        ])
        .default("essay"),
      topic: z
        .enum(["retrieval", "graphs", "evals", "agents", "systems", "opinions", "sports", "random"])
        .optional(),
      // Headline result for experiment-like posts. Every number should carry n, seeds or a CI.
      result: z
        .object({
          claim: z.string(),
          setup: z.string(),
          headline: z.string(), // big number shown on the card + OG image
          detail: z.string().optional(),
          resolution: z.string().optional(), // n, σ, MDE / CI
          verdict: z.enum(["supported", "not-supported", "inconclusive", "null"]).optional(),
          verdictNote: z.string().optional(),
        })
        .optional(),
      repro: z
        .object({
          code: z.string().optional(), // URL
          data: z.string().optional(), // URL or "private"
          seeds: z.string().optional(),
          config: z.string().optional(),
          rerun: z.string().optional(), // one-command rerun
        })
        .optional(),
      discussion: z
        .object({ linkedin: z.string().url().optional(), x: z.string().url().optional() })
        .optional(),
      changelog: z.array(z.object({ date: z.coerce.date(), note: z.string() })).default([]),
      paper: z
        .object({
          title: z.string(),
          authors: z.string(),
          year: z.number(),
          venue: z.string().optional(),
          arxiv: z.string().optional(),
          bibtex: z.string().optional(),
        })
        .optional(),
      runDate: z.coerce.date().optional(), // trend tests: drives the age-of-result banner
    }),
});

// Projects — structured case studies (problem/approach/stack/result/learnings).
const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    problem: z.string(),
    approach: z.string(),
    stack: z.array(z.string()),
    result: z.string(),
    learnings: z.string(),
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    order: z.number().default(0),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog, projects };
