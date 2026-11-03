# arunmv-site

Personal website & blog for Arun MV — a calm, typography-led site that doubles as a
long-term, SEO- and AI-crawler-optimized blogging platform.

**Stack:** Astro 6 · MDX content collections · React islands · Tailwind v4 (CSS-first
tokens) · Pagefind search · Shiki highlighting · deployed to Vercel/Cloudflare.

**Domain:** https://www.arun-mv.com

## Status

Phases 0–7 complete and runnable locally. The full design spec lives in
[`docs/arun-personal-site-spec.md`](docs/arun-personal-site-spec.md).

| Phase | Scope |
|---|---|
| 0 ✅ | Toolchain, Astro scaffold, design tokens, base layout, content collections, repo |
| 1 ✅ | Foundation: tokens wired, ThemeToggle (dark mode), self-hosted variable fonts |
| 2 ✅ | Content engine: Article/Page layouts, MDX components, reading time, dual-theme Shiki |
| 3 ✅ | Blog system: paginated index, category/tag/series routes, TOC, reading progress, related |
| 4 ✅ | Search + nav: Pagefind, ⌘K command palette, sticky header, mobile nav, footer |
| 5 ✅ | Projects grid + 5-part case studies, About, seed content |
| 6 ✅ | SEO + AI: SEOHead, JSON-LD, sitemap, RSS ×2, dynamic OG images, llms.txt/llms-full.txt |
| 7 ✅ | Polish: View Transitions, scroll reveal, 404, a11y, Lighthouse CI config |
| 8 | Launch: deploy + submit sitemap + first posts (external infra) |

### Features
- Light/dark theme with no-flash pre-paint script + persisted toggle
- Hard `technical` / `personal` audience separation in feeds and related posts
- Static, zero-backend full-text search (Pagefind), lazy-loaded
- Per-page dynamic Open Graph images
- Type-safe MDX content collections (Zod)

## Deploy (Phase 8)

Static output in `dist/` — deploy to any static host:

```sh
npm run build           # → dist/ (Astro + Pagefind index)
# Vercel:      vercel --prod          (framework preset: Astro)
# Cloudflare:  wrangler pages deploy dist
```

Then submit `https://www.arun-mv.com/sitemap-index.xml` to Google Search Console & Bing.

## Develop

```sh
npm install      # install dependencies
npm run dev      # start dev server at localhost:4321
npm run build    # production build to ./dist
npm run preview  # preview the production build
```

Requires Node ≥ 22 (see `.nvmrc`).

## New post newsletter

When a Vercel production deployment succeeds from `main`, the GitHub Action sends a Resend
broadcast for each blog post added in that deployment or changed from `draft: true` to
`draft: false`. Edits to an already published post do not send another issue. Successful
broadcasts are recorded in `src/data/newsletter-sent.json`, which powers the newsletter archive.

Add these repository Actions secrets in GitHub under **Settings → Secrets and variables → Actions**:

- `RESEND_API_KEY`
- `RESEND_SEGMENT_ID`
- `RESEND_TOPIC_TECHNICAL`
- `RESEND_TOPIC_PERSONAL`
- `NEWSLETTER_FROM` (optional; defaults to `Arun MV <newsletter@arun-mv.com>`)

The Vercel GitHub integration must send its `deployment_status` events for the workflow to run.
The site build copies post cover art to stable public URLs under `/newsletter-covers/` for email
clients. To preview or send a newsletter manually:

```sh
npm run newsletter -- <post-slug> --dry-run
npm run newsletter -- <post-slug> --test you@example.com
```
