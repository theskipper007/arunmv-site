import getReadingTime from "reading-time";
import { toString } from "mdast-util-to-string";
import type { RemarkPlugin } from "@astrojs/markdown-remark";

/**
 * Remark plugin: compute reading time at build and inject it into frontmatter
 * as `data.astro.frontmatter.readingTime` (minutes, rounded). Never hand-typed.
 */
export const remarkReadingTime: RemarkPlugin = () => {
  return (tree, file) => {
    const text = toString(tree);
    const { minutes } = getReadingTime(text);
    const fm = (file.data.astro as { frontmatter: Record<string, unknown> }).frontmatter;
    fm.readingTime = Math.max(1, Math.round(minutes));
  };
};
