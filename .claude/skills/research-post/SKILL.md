---
name: research-post
description: Scaffold a new post for arun-mv.com in one of the 13 research-in-public post types (experiment, ablation, benchmark, explainer, build log, derivation, bug autopsy, paper note, reproduction, trend test, field log, reflection, essay), with typed frontmatter, the type's section structure, a matching LinkedIn draft, and a newsletter dry run. Use when Arun asks to write, draft, start or scaffold a post, write up an experiment, or invokes /research-post.
---

# /research-post

Usage: `/research-post <type> "<working title>" [--results path/to/results.json] [--slug my-slug]`

Types: `experiment` `ablation` `benchmark` `explainer` `buildlog` `derivation` `bugautopsy` `papernote` `reproduction` `trendtest` `fieldlog` `reflection` `essay`. If the type is missing or unclear, ask, offering the two that fit best.

## Steps

1. **Pick the template.** Read `templates/<type>.mdx` in this skill folder. It holds the frontmatter and the section headings for that type.

2. **Trend tests only: run TRACE first.** Ask the five questions and stop unless all are yes:
   - **T**opic in lane: retrieval, graphs, evals, LLM judges, agents, prompt injection, small-model training, serving, LoRA/DPO?
   - **R**unnable in 4 hours or less on the existing harness?
   - **A**dds an original number (an eval result, a reproduced claim, a cost or latency figure)? A summary doesn't count.
   - **C**onnects to current work?
   - **E**vidence exists (paper, model card or weights, not a teaser)?

   Also check `src/content/blog/` for a `type: trendtest` post with a `pubDate` in the last 7 days. At most one trend test a week. If TRACE fails but the item still matters, suggest a short `papernote` instead.

3. **Fill the frontmatter.** It must validate against the `blog` schema in `src/content.config.ts`.
   - `title`: a statement, not a question, ideally containing the number or the artifact.
   - `description`: at most 160 characters, answer-first.
   - `pubDate`: today. `draft: true` always; Arun flips it.
   - `category`: `ai-engineering` unless told otherwise. `audience`: `technical` for ai-engineering and tech-opinions, `personal` for sports and random. Never mix.
   - `topic`: one of `retrieval | graphs | evals | agents | systems | opinions | sports | random`.
   - `type`: the type.
   - `tags`: 3–5 lowercase kebab-case tags. Reuse existing ones (`grep -h "^tags:" src/content/blog/*.mdx`).
   - `result` (experiment, ablation, benchmark, reproduction, trendtest): `claim`, `setup`, `headline`, optional `detail`, `resolution`, `verdict`, `verdictNote`.
   - `repro`: only fields that really exist (repo URL, rerun command).
   - `runDate`: for trend tests, the day the run happened.
   - `paper`: for paper notes and reproductions.

4. **Numbers come from data, never from memory.**
   - With `--results`, read the JSON and fill the result card and tables from it.
   - **Every number must carry n, seeds or an interval.** If the data has no n, seeds or CI, write `[TODO: n / CI]` next to the number rather than publishing it bare.
   - Never invent a number, a citation or a result. Leave `[TODO]` markers for anything not in the data or the conversation.

5. **Write the post** to `src/content/blog/<slug>.mdx`. The slug is kebab-case from the title, at most 6 words. Never overwrite an existing file; if the slug is taken, ask.
   - Keep the template's headings. Add body text only from what Arun has given you; otherwise leave the heading with its HTML guidance comment.
   - Available MDX components: `<Tldr>`, `<Callout type="note|tip|do|dont|warning|danger|reference|output">`, `<Sidenote n={1}>`, `<Check q="...">`, `<Figure>`, `<Diagram>`.
   - Math: `$...$` inline and `$$...$$` block, rendered as MathML.
   - Interactive figures are React islands in `src/components/figures/`, imported with `client:visible` (see `HopGeometry.tsx`).

6. **Draft the LinkedIn post** to `drafts/linkedin/<slug>.md` (gitignored), using the structure for this type in `linkedin.md`.
   - **Opener:** a statement with a number or an artifact. Never a question.
   - **Numbers:** each one carries n, seeds or an interval.
   - **Last line:** names the website page in words. No URL in the body; Arun adds the link in an edit after 60–90 minutes.
   - **Banned:** "game-changer", "unlock", "dive deep", "in today's fast-paced world", "here's the thing", emoji bullets, hashtag walls.

7. **Validate.** Run `npm run build:fast`. It must pass the content schema. Fix any errors.

8. **Report** in 5 lines or fewer:
   - the file paths
   - what is still `[TODO]`
   - how to publish: flip `draft`, then `npm run newsletter -- <slug> --dry-run`, then `npm run newsletter -- <slug> --test <your email>`, then `npm run newsletter -- <slug>`
   - after posting on LinkedIn or X, add the URLs under `discussion:` in the frontmatter

## Writing rules for every post

- Write the way you'd explain it to a colleague: short, direct sentences.
- Avoid em-dash asides, "not X, but Y" framing and colon-then-reveal sentences.
- No company or employer names unless the post is about that company's public work. Never mention past or current employers.
- Never show planned or unfinished work as if it exists. Only completed or ongoing work goes on the site.
- Null and negative results are findings: use `verdict: null` or `not-supported` and say what it rules out.
- Every reach post (explainer, derivation, benchmark) links to at least one depth post (experiment, ablation, reproduction) when one exists.
