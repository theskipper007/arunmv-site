// @ts-check
import { defineConfig, envField } from 'astro/config';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

import rehypeSlug from 'rehype-slug';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { remarkReadingTime } from './src/lib/reading-time.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.arun-mv.com',
  integrations: [mdx(), react(), sitemap()],
  // Pages stay prerendered; only routes with `prerender = false` (the newsletter API) run as functions.
  adapter: vercel(),

  // Newsletter secrets, read at request time. Optional so the static build never needs them.
  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      NEWSLETTER_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      NEWSLETTER_FROM: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_SEGMENT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_TOPIC_TECHNICAL: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_TOPIC_PERSONAL: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },

  markdown: {
    remarkPlugins: [remarkReadingTime, remarkMath],
    rehypePlugins: [
      // MathML output renders natively in browsers, so no KaTeX stylesheet or fonts ship.
      [rehypeKatex, { output: 'mathml' }],
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'wrap',
          properties: { className: ['heading-anchor'] },
        },
      ],
    ],
    shikiConfig: {
      // Dual themes: CSS swaps to the dark vars under [data-theme="dark"].
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
