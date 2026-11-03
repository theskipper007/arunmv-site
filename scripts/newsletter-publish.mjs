#!/usr/bin/env node
/** Send only posts newly added or changed from draft to published in a deployment. */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import yaml from "js-yaml";

const head = process.argv[2];
const requestedBase = process.argv[3];
if (!head) {
  console.error("Usage: node scripts/newsletter-publish.mjs <deployed-commit-sha> [previous-deployed-sha]");
  process.exit(1);
}

function git(...args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  return result.stdout.trim();
}

function parseFrontmatter(text) {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  return match ? yaml.load(match[1]) : null;
}

// Diff from the previous successful production deploy when it's an ancestor of this one
// (so multi-commit pushes are covered); otherwise fall back to the parent commit.
function isAncestor(a, b) {
  return spawnSync("git", ["merge-base", "--is-ancestor", a, b]).status === 0;
}
const base = requestedBase && isAncestor(requestedBase, head) ? requestedBase : git("rev-parse", `${head}^`);
console.log(`Comparing ${base.slice(0, 7)}..${head.slice(0, 7)}`);
const changed = git("diff", "--diff-filter=AM", "--name-only", base, head, "--", "src/content/blog")
  .split(/\r?\n/)
  .filter((file) => file.endsWith(".mdx"));
if (!changed.length) {
  console.log("No blog posts changed in this deployment.");
  process.exit(0);
}

const logPath = "src/data/newsletter-sent.json";
const sent = JSON.parse(readFileSync(logPath, "utf8"));
const candidates = [];
for (const file of changed) {
  const slug = file.slice("src/content/blog/".length, -4);
  const current = parseFrontmatter(git("show", `${head}:${file}`));
  if (!current || current.draft) continue;

  let previous = null;
  try {
    previous = parseFrontmatter(git("show", `${base}:${file}`));
  } catch {
    // A newly added post has no version in the base commit.
  }
  const existedBefore = previous !== null;
  const newlyPublished = !existedBefore || previous?.draft === true;
  if (!newlyPublished || sent.some((entry) => entry.slug === slug)) continue;
  candidates.push(slug);
}

if (!candidates.length) {
  console.log("No newly published posts need a newsletter.");
  process.exit(0);
}

for (const slug of candidates) {
  console.log(`Sending newsletter for ${slug}`);
  const result = spawnSync(process.execPath, ["scripts/newsletter-send.mjs", slug], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
