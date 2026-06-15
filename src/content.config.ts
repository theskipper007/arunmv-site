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
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
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
