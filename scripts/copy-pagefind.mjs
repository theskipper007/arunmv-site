// The Vercel adapter copies static files to .vercel/output/static during
// `astro build`, before Pagefind runs. Copy the search index over so production
// search works; skipped when there's no Vercel output (e.g. a local build without the adapter).
import { cpSync, existsSync } from "node:fs";

const from = "dist/client/pagefind";
const to = ".vercel/output/static/pagefind";
if (existsSync(".vercel/output/static") && existsSync(from)) {
  cpSync(from, to, { recursive: true });
  console.log(`Copied ${from} → ${to}`);
}
