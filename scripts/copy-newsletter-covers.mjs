#!/usr/bin/env node
/**
 * Copy post cover images to stable, public URLs for email clients.
 *
 * Gmail and Outlook don't render SVG (and Outlook skips WebP), so those are
 * rasterised to PNG; PNG and JPEG are copied as-is. newsletter-send.mjs builds
 * the cover URL with the same mapping.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import sharp from "sharp";

const emailCoverExt = (ext) => ([".svg", ".webp"].includes(ext) ? ".png" : ext);

const root = fileURLToPath(new URL("..", import.meta.url));
const postsDir = path.join(root, "src", "content", "blog");
const coversDir = path.join(root, "public", "newsletter-covers");
mkdirSync(coversDir, { recursive: true });

let count = 0;
for (const name of readdirSync(postsDir).filter((entry) => entry.endsWith(".mdx"))) {
  const sourceFile = path.join(postsDir, name);
  const source = readFileSync(sourceFile, "utf8");
  const frontmatter = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) continue;
  const data = yaml.load(frontmatter[1]);
  if (!data.heroImage || /^https?:\/\//i.test(data.heroImage)) continue;
  const imagePath = path.resolve(postsDir, data.heroImage);
  if (!existsSync(imagePath)) continue;
  const ext = path.extname(imagePath).toLowerCase();
  if (![".svg", ".png", ".jpg", ".jpeg", ".webp"].includes(ext)) continue;
  const slug = name.slice(0, -4);
  const out = path.join(coversDir, `${slug}${emailCoverExt(ext)}`);
  if (emailCoverExt(ext) === ext) {
    copyFileSync(imagePath, out);
  } else {
    // 1200px wide covers a 596px slot at 2x for retina screens.
    await sharp(imagePath, { density: 200 }).resize({ width: 1200 }).png({ compressionLevel: 9 }).toFile(out);
  }
  count++;
}
console.log(`Prepared ${count} newsletter covers in public/newsletter-covers`);
