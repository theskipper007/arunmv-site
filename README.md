# arunmv-site

Personal website & blog for Arun MV — a calm, typography-led site that doubles as a
long-term, SEO- and AI-crawler-optimized blogging platform.

**Stack:** Astro 6 · MDX content collections · React islands · Tailwind v4 (CSS-first
tokens) · Pagefind search · Shiki highlighting · deployed to Vercel/Cloudflare.

**Domain:** https://arun-mv.com

## Status

Phase 0 (scaffold + repo wiring) complete. The full phased build plan lives in
[`docs/arun-personal-site-spec.md`](docs/arun-personal-site-spec.md).

| Phase | Scope |
|---|---|
| 0 ✅ | Toolchain, Astro scaffold, design tokens, base layout, content collections, repo |
| 1 | Foundation: tokens wired, ThemeToggle, self-hosted fonts |
| 2 | Content engine: ArticleLayout, MDX components, reading time, Shiki |
| 3 | Blog system: index, taxonomy/series routes, TOC, related posts |
| 4 | Search + nav: Pagefind, ⌘K palette, header/footer |
| 5 | Projects + About |
| 6 | SEO + AI: JSON-LD, sitemap, RSS ×2, OG images, llms.txt |
| 7 | Polish: View Transitions, a11y audit, Lighthouse CI |
| 8 | Launch |

## Develop

```sh
npm install      # install dependencies
npm run dev      # start dev server at localhost:4321
npm run build    # production build to ./dist
npm run preview  # preview the production build
```

Requires Node ≥ 22 (see `.nvmrc`).
