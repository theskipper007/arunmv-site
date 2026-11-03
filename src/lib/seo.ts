/** Single source of site-wide identity, links, and nav (spec §11). */
export const SITE = {
  url: "https://www.arun-mv.com",
  name: "Arun MV",
  tagline: "I build production LLM systems and study why they fail.",
  description:
    "Experiments, explainers and essays on retrieval, LLM evaluation and agent reliability, by AI engineer Arun MV.",
  author: "Arun MV",
  email: "arunmv.eh@gmail.com",
  github: "https://github.com/theskipper007",
  linkedin: "https://www.linkedin.com/in/mv-arun/",
  locale: "en",
} as const;

export const SOCIAL_LINKS = [
  { label: "GitHub", href: SITE.github, icon: "github" as const },
  { label: "LinkedIn", href: SITE.linkedin, icon: "linkedin" as const },
  { label: "Email", href: `mailto:${SITE.email}`, icon: "mail" as const },
];

export const NAV = [
  { label: "Writing", href: "/blog" },
  { label: "Experiments", href: "/experiments" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
];

/** Absolute URL helper. */
export const abs = (path: string) => new URL(path, SITE.url).href;

/** OG image path for a given content slug. */
export const ogImage = (slug: string) => abs(`/og/${slug}.png`);
