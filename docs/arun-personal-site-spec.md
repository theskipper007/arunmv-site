# Arun MV — Personal Website & Blog
### Implementation-ready design + architecture spec

> **One-line brief.** A calm, typography-led personal site that doubles as a long-term, SEO-and-AI-crawler-optimized blogging platform — built to showcase practical AI engineering and to grow to hundreds of posts without re-architecting.

**Working domain placeholder:** `arunmv.dev` (swap for your final domain). 
**Design language:** *Quiet engineering* — editorial, restrained, one warm accent, monospace craft details. 
**Recommended stack (TL;DR):** Astro 5 + MDX content collections + React islands + Tailwind v4 tokens + Pagefind search + Shiki highlighting + Keystatic (optional CMS UI) + Vercel/Cloudflare hosting.

---

## 0. Design decisions at a glance (the "why")

| Decision | Choice | Why it's right for *you* |
|---|---|---|
| Framework | **Astro 5** | Content-first, zero-JS by default, islands for interactivity. Best Core Web Vitals for a blog-heavy site. You keep React where it matters. |
| Content model | **MDX in Git + Content Collections** | Type-safe frontmatter (Zod), version-controlled, diffable, AI-engineer-native. No vendor lock-in. |
| Editing UI | **Keystatic** (optional) | Git-based admin panel over the same MDX. Add later without migration. |
| Styling | **Tailwind v4 (CSS-first) + CSS custom-property tokens** | Tokens map 1:1 to CSS variables; theme switching is trivial; no runtime cost. |
| Search | **Pagefind** | Static, index-at-build, zero backend, scales to thousands of pages. |
| Highlighting | **Shiki** (build-time) | Real editor-grade highlighting, zero client JS. |
| Motion | **CSS + View Transitions API** | Native page transitions, GPU-cheap, respects reduced-motion. |
| Hosting | **Vercel** or **Cloudflare Pages** | Edge CDN, free tier, instant static delivery, easy OG-image functions. |

**Why not Next.js?** Next is excellent, and is the fallback if you ever want a heavily app-like site (dashboards, auth, server actions). But for *content + SEO + speed*, Astro ships less JavaScript and wins on bundle size and LCP with no extra effort. You are optimizing for readers and crawlers, not for an SPA.

---

## 1. Information architecture

```
Home (/)                      → identity statement + latest writing + selected work
├── Blog (/blog)              → CORE. featured + list + category filter + search
│   ├── /blog/[slug]          → article (rich reading layout)
│   ├── /blog/category/[cat]  → AI/Eng · Tech opinions · Sports · Random
│   ├── /blog/tag/[tag]       → cross-cutting tags
│   └── /blog/series/[series] → multi-part series index
├── Projects (/projects)      → grid of case studies
│   └── /projects/[slug]      → Problem · Approach · Stack · Result · Learnings
├── About (/about)            → journey · interests · philosophy · links
└── (optional) Now (/now)     → what you're working on, refreshed periodically

Generated / utility:
/rss.xml  /sitemap-index.xml  /robots.txt  /llms.txt  /llms-full.txt  /404  /og/[slug].png
```

**Audience separation (key requirement).** Categories carry a hard `audience` flag:
- `technical` → AI & Engineering, Tech opinions
- `personal` → Sports, Random explorations

Feeds, related-posts, and the newsletter never mix audiences unless explicitly requested. You can offer **two RSS feeds** (`/rss.xml` and `/rss-technical.xml`) so a recruiter or a fellow engineer can subscribe to only the technical stream.

---

## 2. Sitemap (route → page type → render)

| Route | Type | Rendering | Notes |
|---|---|---|---|
| `/` | Landing | Static (SSG) | Pulls latest 3 posts + 3 projects from collections |
| `/blog` | Index | SSG | Featured hero + paginated list + category tabs + Pagefind search |
| `/blog/[slug]` | Article | SSG | TOC, reading progress, series nav, related, newsletter CTA |
| `/blog/category/[category]` | Taxonomy | SSG (`getStaticPaths`) | One page per category |
| `/blog/tag/[tag]` | Taxonomy | SSG | One page per tag |
| `/blog/series/[series]` | Series index | SSG | Ordered parts |
| `/projects` | Index | SSG | Grid of case-study cards |
| `/projects/[slug]` | Case study | SSG | Structured: problem/approach/stack/result/learnings |
| `/about` | Page | SSG | Long-form, serif body |
| `/og/[...slug].png` | Image | On-demand/edge | Dynamic Open Graph images |
| `/rss.xml` | Feed | Build | Full + technical-only variant |
| `/sitemap-index.xml` | XML | Build | via `@astrojs/sitemap` |
| `/llms.txt` | Text | Build | AI-crawler index (see §10) |

---

## 3. Wireframes

Four reference wireframes were rendered inline in the conversation:
1. **Information architecture / sitemap tree**
2. **Design-system foundations** (color, type, motion tokens)
3. **Homepage** (mobile + desktop)
4. **Blog article reading layout**

Page-by-page intent below; treat the inline visuals as the canonical low-fi reference.

**Home** — One screen, one idea. `Hi, I'm Arun 👋` micro-line → bold identity statement (*"I build practical AI systems"*) → one-sentence sub. Below the fold: latest 2–3 posts and 2–3 selected projects, pulled live from collections (the homepage is never hand-edited). Generous whitespace; the only motion is a 12px fade-rise on scroll-in.

**Blog index** — Featured article hero (large), then category tabs (`All · AI/Eng · Tech opinions · Sports · Random`), then a clean list of cards (title, dek, category pill, date, reading time). Search field opens Pagefind. Pagination or "load more" at 12 per page.

**Article** — Focused reading column (max 68ch), sticky table-of-contents on desktop (hidden on mobile), top reading-progress bar, breadcrumb, category pill, serif title, mono metadata row, optional series banner, MDX body (Shiki code blocks with copy button, callouts, images with captions), tag row, then the conversion endcap: newsletter CTA + related/next-in-series cards.

**Projects** — Responsive card grid (1 col mobile → 2–3 desktop). Each card: title, one-line outcome, stack chips, links (repo/demo). Click → full case study.

**Case study** — Cover → summary → the five-part structure (Problem, Approach, Stack, Result, Learnings) with quantified impact pulled from your real work (see §12 seed content).

**About** — Serif long-form. Journey → current interests → building philosophy → links. Calm and personal, not a résumé dump.

---

## 4. Component inventory

| Component | Type | Interactive? | Island? |
|---|---|---|---|
| `SiteHeader` / `Nav` | Layout | menu toggle (mobile) | small island |
| `Footer` | Layout | no | static |
| `ThemeToggle` | UI | yes | island |
| `CommandPalette` (⌘K) | UI | yes | island (lazy) |
| `Search` (Pagefind UI) | UI | yes | island (lazy) |
| `Prose` (MDX wrapper) | Content | no | static |
| `ArticleHeader` | Content | no | static |
| `TableOfContents` | Content | scroll-spy | island |
| `ReadingProgress` | Content | scroll | island (tiny) |
| `Callout` / `Admonition` | MDX | no | static |
| `CodeBlock` + copy button | MDX | copy | tiny island |
| `Figure` (image + caption) | MDX | no | static |
| `Tag` / `CategoryPill` | UI | link | static |
| `CategoryNav` (tabs) | UI | filter | static links |
| `PostCard` | Card | hover | static |
| `FeaturedHero` | Card | no | static |
| `RelatedPosts` | Content | no | static |
| `SeriesNav` (part x of n) | Content | no | static |
| `NewsletterCTA` | Form | submit | island |
| `ProjectCard` | Card | hover | static |
| `Pagination` | UI | link | static |
| `Breadcrumb` | UI | link | static |
| `SocialLinks` | UI | link | static |
| `SEOHead` / `JsonLd` | Head | no | static |
| `OgImage` (Satori template) | Build | no | server |

**Rule:** default to **static**. Only the toggle, palette, search, TOC, reading-progress, copy-button, and newsletter form hydrate — and the palette/search hydrate lazily on first interaction.

---

## 5. Responsive layout system

Mobile-first. Breakpoints (Tailwind defaults, kept):

| Token | Min width | Layout shift |
|---|---|---|
| base | 0 | single column, stacked, TOC hidden |
| `sm` | 640px | wider gutters |
| `md` | 768px | projects → 2 columns |
| `lg` | 1024px | article TOC sidebar appears, nav expands, ⌘K visible |
| `xl` | 1280px | max container reached |

**Containers:** reading prose = `min(68ch, 100% - 2rem)`; general content = `max-width: 1100px`. 
**Fluid type:** headings use `clamp()` so they scale smoothly between mobile and desktop with no breakpoint jumps. 
**Grid:** projects use `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`. 
**Touch targets:** ≥44×44px. **No horizontal scroll** at any width.

---

## 6. Design system

### Visual direction
Editorial and quiet. Whitespace is the primary design element. One warm terracotta accent used *sparingly* (links, active state, one hero accent). Monospace for metadata, dates, tags, and code — the "engineer's fingerprint." Clean separation: **serif for reading, sans for UI**.

### Typography
- **UI / nav / headings:** Inter (variable). 
- **Long-form article body:** Newsreader (variable serif, optical sizing, real italics). 
- **Code / labels / meta:** JetBrains Mono.

Scale (fluid via `clamp`):

| Token | Size | Use |
|---|---|---|
| `display` | 2.5–3.75rem | home hero |
| `h1` | 1.875–2.25rem | article title |
| `h2` | 1.5rem | section |
| `h3` | 1.25rem | subsection |
| `body` | 1rem / 1.6 | UI text |
| `prose` | 1.18rem / 1.75 | **article body (serif)** |
| `small` | 0.875rem | secondary |
| `meta` | 0.8rem (mono) | dates, reading time, tags |

### Color (see swatch widget for hex)
- **Light:** Paper `#FBFAF8`, Surface `#FFFFFF`, Ink `#1A1A18`, Muted `#5C5B55`, Faint `#8A8980`, Border `rgba(0,0,0,0.08)`, **Accent `#C25A3C`**.
- **Dark:** Base `#111110`, Surface `#1A1A18`, Text `#ECEBE6`, Muted `#A3A29B`, Border `rgba(255,255,255,0.10)`, **Accent `#E0734F`** (lightened for contrast).

All pairings meet WCAG AA (≥4.5:1 body, ≥3:1 large/UI).

### Spacing — 4px base
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128`

### Radius
`sm 6px · md 10px · lg 16px · pill 999px`. Gentle, never pillowy.

### Elevation
No drop shadows in the resting UI. Use hairline borders for structure; reserve a single soft shadow for overlays (command palette, mobile menu) only.

### Icons
**Lucide**, 1.5px stroke, `currentColor`, sizes 16/20/24. Tree-shaken (import only what you use).

### Animation principles
- Durations: **150ms** micro · **250ms** standard · **400ms** page/large.
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` for confident enters; `ease-out` for hovers.
- **View Transitions API** for page navigation (Astro native).
- On-scroll: fade + 12–16px rise, once, via `IntersectionObserver` (or CSS `animation-timeline` where supported).
- **Animate only `transform` and `opacity`.** Never animate layout properties.
- Wrap everything in `@media (prefers-reduced-motion: no-preference)`.
- No parallax, no auto-playing carousels, no attention-grabbing loops.

---

## 7. Design tokens

CSS custom properties (single source of truth), consumed by Tailwind v4's `@theme`.

```css
/* src/styles/tokens.css */
:root {
  /* color — light */
  --color-paper:    #FBFAF8;
  --color-surface:  #FFFFFF;
  --color-ink:      #1A1A18;
  --color-muted:    #5C5B55;
  --color-faint:    #8A8980;
  --color-border:   rgb(0 0 0 / 0.08);
  --color-accent:   #C25A3C;
  --color-accent-hover: #A84A2F;

  /* type */
  --font-sans:  "Inter", system-ui, sans-serif;
  --font-serif: "Newsreader", Georgia, serif;
  --font-mono:  "JetBrains Mono", ui-monospace, monospace;

  /* spacing (4px base) */
  --space-1: 0.25rem; --space-2: 0.5rem;  --space-3: 0.75rem;
  --space-4: 1rem;    --space-6: 1.5rem;  --space-8: 2rem;
  --space-12: 3rem;   --space-16: 4rem;   --space-24: 6rem;

  /* radius */
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px; --radius-pill: 999px;

  /* motion */
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --dur-micro: 150ms; --dur-base: 250ms; --dur-page: 400ms;

  /* layout */
  --prose-width: 68ch;
  --content-max: 1100px;
}

:root[data-theme="dark"] {
  --color-paper:   #111110;
  --color-surface: #1A1A18;
  --color-ink:     #ECEBE6;
  --color-muted:   #A3A29B;
  --color-faint:   #6E6D66;
  --color-border:  rgb(255 255 255 / 0.10);
  --color-accent:  #E0734F;
  --color-accent-hover: #EC8A6A;
}
```

```css
/* src/styles/global.css — Tailwind v4 maps tokens into utilities */
@import "tailwindcss";
@theme {
  --color-paper:   var(--color-paper);
  --color-ink:     var(--color-ink);
  --color-accent:  var(--color-accent);
  --font-sans:     var(--font-sans);
  --font-serif:    var(--font-serif);
  --font-mono:     var(--font-mono);
}
```

Theme is set pre-paint by a tiny inline script reading `localStorage` + `prefers-color-scheme` to avoid a flash.

---

## 8. Frontend architecture

```
Astro static build
 ├─ Content layer: Content Collections (blog, projects) with Zod schemas
 ├─ Pages: file-based routing + getStaticPaths for taxonomy/series
 ├─ Layouts: BaseLayout → ArticleLayout / PageLayout compose <SEOHead>
 ├─ MDX pipeline: remark/rehype (reading time, slugged headings, GFM) → Shiki
 ├─ Islands (React, client:* directives):
 │     ThemeToggle (client:load)
 │     CommandPalette + Search (client:idle / client:visible, lazy)
 │     TableOfContents + ReadingProgress (client:visible)
 │     NewsletterCTA (client:visible)
 ├─ Tokens: CSS custom properties → Tailwind @theme
 ├─ OG images: Satori/@vercel/og template at /og/[slug].png
 └─ Post-build: Pagefind indexes /dist → static search index
```

Principles: **islands over hydration**, **build-time over runtime**, **content as typed data**, **tokens as the single styling source**.

---

## 9. Folder structure

```
arunmv-site/
├── astro.config.mjs
├── package.json
├── tailwind.config.* (or CSS-first @theme)
├── keystatic.config.ts          # optional CMS UI
├── public/
│   ├── fonts/                    # self-hosted, subset
│   ├── robots.txt
│   └── favicon.svg
├── src/
│   ├── content/
│   │   ├── config.ts             # collection schemas (Zod)
│   │   ├── blog/
│   │   │   ├── building-graphrag-kb.mdx
│   │   │   └── graphiti-vs-vector-rag.mdx
│   │   └── projects/
│   │       ├── graph-knowledge-base.mdx
│   │       └── node12-to-18-migration.mdx
│   ├── components/
│   │   ├── layout/   (Header, Footer, Nav)
│   │   ├── ui/       (ThemeToggle, CommandPalette, Tag, Pagination)
│   │   ├── content/  (PostCard, ProjectCard, TOC, ReadingProgress, SeriesNav, RelatedPosts)
│   │   ├── mdx/      (Callout, CodeBlock, Figure)  # mapped via MDX components
│   │   └── seo/      (SEOHead, JsonLd)
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── ArticleLayout.astro
│   │   └── PageLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── blog/
│   │   │   ├── index.astro
│   │   │   ├── [...slug].astro
│   │   │   ├── category/[category].astro
│   │   │   ├── tag/[tag].astro
│   │   │   └── series/[series].astro
│   │   ├── projects/
│   │   │   ├── index.astro
│   │   │   └── [...slug].astro
│   │   ├── og/[...slug].png.ts
│   │   ├── rss.xml.ts
│   │   └── llms.txt.ts
│   ├── lib/
│   │   ├── reading-time.ts
│   │   ├── collections.ts        # sorting, filtering, related-post logic
│   │   └── seo.ts
│   └── styles/
│       ├── tokens.css
│       └── global.css
└── ...
```

---

## 10. CMS / blog content architecture

### Content collections + schema (type-safe frontmatter)

```ts
// src/content/config.ts
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().max(160),      // also used for meta + OG
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    category: z.enum([
      "ai-engineering", "tech-opinions", "sports", "random",
    ]),
    audience: z.enum(["technical", "personal"]),  // hard separation
    tags: z.array(z.string()).default([]),
    series: z.object({ name: z.string(), order: z.number() }).optional(),
    heroImage: image().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  type: "content",
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
```

### Conventions
- **Reading time** computed at build via a remark plugin (`remark-reading-time`) → injected into frontmatter; never hand-typed.
- **Slugged headings** (`rehype-slug` + `rehype-autolink-headings`) power the TOC and deep links.
- **Drafts** (`draft: true`) excluded from production builds, feeds, sitemap.
- **Series** = a `series.name` + `series.order`; the series index sorts by order and the article shows "Part N of M."
- **Related posts** = same category, then shared-tag overlap, ranked; never cross the `audience` boundary.
- **Two RSS feeds**: full + `audience === "technical"` only.

### Editing workflow
1. **Phase 1 (now):** write MDX directly in the repo. Fastest, version-controlled, AI-native.
2. **Phase 2 (when you want a UI):** drop in **Keystatic** — a Git-based admin at `/keystatic` that reads/writes the *same* MDX with the *same* schema. Zero migration.
3. **Phase 3 (only if you ever collaborate / need scheduling):** migrate to a headless CMS (Sanity/Contentful). The collection abstraction means pages don't change — only the data source.

---

## 11. SEO + AI-search implementation

### Semantic HTML
Proper landmarks (`header`, `nav`, `main`, `article`, `aside`, `footer`), one `h1` per page, ordered heading hierarchy, `<time datetime>`, `figure`/`figcaption`, descriptive link text.

### Metadata (per page, from frontmatter)
Title template `%s — Arun MV`, `meta description`, canonical URL, `theme-color`, language, robots directives.

### Open Graph + Twitter
Full OG tags + `summary_large_image`. **Dynamic per-post OG images** generated with Satori/`@vercel/og` at `/og/[slug].png` (title + category + your name on the brand template) — this is what makes shared links look intentional.

### Structured data (JSON-LD)
Emit the right type per page:
- Site-wide: `WebSite` (+ `SearchAction`), `Person` (you, with `sameAs` → LinkedIn/GitHub).
- Articles: `BlogPosting` / `Article` (headline, datePublished, dateModified, author, image, articleSection, keywords, wordCount).
- Projects: `SoftwareSourceCode` / `CreativeWork`.
- Navigation: `BreadcrumbList`.
- About/FAQ blocks: `FAQPage` where natural.

```ts
// example BlogPosting JSON-LD (rendered in <SEOHead>)
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": post.title,
  "description": post.description,
  "datePublished": post.pubDate.toISOString(),
  "dateModified": (post.updatedDate ?? post.pubDate).toISOString(),
  "author": { "@type": "Person", "name": "Arun MV",
              "url": "https://arunmv.dev/about" },
  "articleSection": post.category,
  "keywords": post.tags.join(", "),
  "image": `https://arunmv.dev/og/${post.slug}.png`
}
```

### Sitemap + RSS
`@astrojs/sitemap` (auto, with `lastmod`) and `@astrojs/rss`. Submit the sitemap in Google Search Console + Bing Webmaster Tools.

### AI-search / crawler optimization (the differentiator)
- **`/llms.txt`** — a clean Markdown index of your site (purpose + links to key pages) following the emerging llms.txt convention; **`/llms-full.txt`** can inline full post text for models that ingest it. Generate both at build from collections.
- **`robots.txt`** — explicitly *allow* the crawlers you want discoverability from:

```
User-agent: *
Allow: /
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
Sitemap: https://arunmv.dev/sitemap-index.xml
```
  *(Allowing AI crawlers is a personal call — for a discoverability goal you generally want them in. Disallow any you'd rather exclude.)*
- **Answer-first writing**: lead each post with a 2–3 sentence TL;DR / summary block. LLMs extract these cleanly and you get cited more often.
- **Stable, descriptive slugs**, alt text on every image, fast TTFB (static), and clear `dateModified` so freshness is legible to both Google and AI systems.

---

## 12. Accessibility checklist

- [ ] Semantic landmarks + logical heading order (one `h1`/page)
- [ ] **Skip-to-content** link as first focusable element
- [ ] Visible `:focus-visible` ring on every interactive element
- [ ] Color contrast AA: ≥4.5:1 body, ≥3:1 large text & UI (verified for both themes)
- [ ] Full keyboard operability — menu, ⌘K palette, search, theme toggle, all trappable/escapable
- [ ] `aria-label`/`aria-current` on nav; `aria-expanded` on toggles
- [ ] Command palette + mobile menu: focus trap + `Esc` to close + return focus
- [ ] All images have meaningful `alt` (empty `alt=""` for decorative)
- [ ] Form fields (newsletter) have associated `<label>`; errors announced
- [ ] `prefers-reduced-motion` respected everywhere; no motion-only meaning
- [ ] `prefers-color-scheme` honored; manual toggle persists
- [ ] Touch targets ≥44×44px; no hover-only interactions
- [ ] Reading column ≤68ch; line-height ≥1.7 for prose
- [ ] Lang attribute set; valid HTML; tested with VoiceOver/NVDA + axe DevTools

---

## 13. Performance strategy

**Budgets (Core Web Vitals):** LCP < 2.5s · INP < 200ms · CLS < 0.1 · initial JS < 50KB on content pages.

Techniques:
- **Static generation** for every page; serve from edge CDN.
- **Islands**: ship JS only for toggle/search/TOC/progress/newsletter; search & palette hydrate lazily.
- **Fonts self-hosted + subset**, `font-display: swap`, preload the two critical faces; variable fonts to cut weight.
- **Images** via Astro `<Image>`/`<Picture>` → AVIF/WebP, explicit width/height (zero CLS), lazy below the fold, responsive `srcset`.
- **Shiki at build** (no client highlighter); **Pagefind** index loaded only on search open.
- **`<link rel="preconnect">`** for any third-party (analytics, newsletter).
- **View Transitions** for instant-feeling nav without an SPA payload.
- **No layout shift**: reserve space for hero/OG, avoid late-injected banners.
- Privacy-friendly analytics (Plausible/Umami/Vercel) — tiny script, no cookie banner needed.
- CI: run **Lighthouse CI** on PRs to hold the budget.

---

## 14. Future scalability plan

| Stage | Add | Cost |
|---|---|---|
| Authoring UX | Keystatic admin UI over same MDX | none / free |
| Engagement | Comments via **Giscus** (GitHub Discussions); webmentions | free |
| Reach | Newsletter archive page; second technical-only RSS | low |
| Content depth | `/uses`, `/talks`, `/bookmarks`, `/now` collections | low |
| Discovery | Per-series landing pages; topic hubs; "best of" curation | low |
| Scale | Pagefind handles thousands of posts; paginate taxonomy | none |
| Internationalization | Astro i18n routing if you ever write in Tamil | medium |
| Migration path | Swap content source to headless CMS without touching pages | medium |

The collection-abstraction + token system means growth is *additive* — you add content types and components, never re-platform.

---

## 15. Suggested build order (phased roadmap)

1. **Foundation (week 1):** Astro + Tailwind v4 tokens + BaseLayout + theme toggle + fonts + global styles.
2. **Content engine (week 1–2):** blog + projects collections, schemas, ArticleLayout, MDX components (Callout, CodeBlock, Figure), reading time, Shiki.
3. **Blog system (week 2):** index + featured + category/tag/series routes + TOC + reading progress + related posts + pagination.
4. **Search + nav (week 2–3):** Pagefind integration + ⌘K command palette.
5. **Projects + About (week 3):** project grid + case-study template (seed with your real work) + About narrative.
6. **SEO + AI (week 3–4):** SEOHead, JSON-LD, sitemap, RSS (×2), dynamic OG images, `llms.txt`, robots.txt.
7. **Polish (week 4):** View Transitions, scroll animations, accessibility audit, Lighthouse CI, newsletter CTA.
8. **Launch:** deploy to Vercel/Cloudflare, submit sitemap, wire analytics, write the first 3 posts.

---

## Appendix — seed content from your actual work

Real material to launch with (don't start empty — these are strong, specific, and recruiter-legible):

**Project case studies**
- **Graph Knowledge Base (GraphRAG + Neo4j + Graphiti + LangGraph)** — *Problem:* vector-only RAG gives flat, context-poor answers. *Approach:* entity/relationship extraction → Neo4j graph + episodic time-aware memory + hybrid semantic+structural retrieval, orchestrated with LangGraph multi-agent pipelines. *Result:* graph-grounded contextual AI across the product. *Learnings:* where graph traversal beats embeddings, and how to keep it cost-aware.
- **Node 12 (Hapi) → Node 18 (Express) migration** — *Result:* ~30% lower cold-starts; *Learnings:* de-risking a legacy framework swap on a live survey platform.
- **AI-Powered Review Intelligence** — LLM classify/summarize/auto-draft pipelines with RAG grounded in brand policy; prompt + model-selection tuning for cost/accuracy. Tie to the **2× Reputation module revenue** and **$5,000+/yr cloud savings**.
- **Semantic Search & Insights Engine** — OpenSearch + vector hybrid retrieval at scale.

**Blog series ideas**
- *"Knowledge graphs for LLMs"* (4-part technical series): vector-only limits → modeling entities in Neo4j → episodic memory with Graphiti → hybrid retrieval & cost.
- *"Making AI production-ready"* (tech opinions): reliability, retries (your ~25% error reduction), observability, cost.
- Plus your **Sports** and **Random explorations** streams kept cleanly separate via the `audience` flag.

**About hook:** backend/platform engineer who moved into applied AI — modernizing legacy systems *and* shipping graph-grounded LLM features in production. The throughline is your tagline-worthy stance: *practical, reliable, cost-aware AI.*
