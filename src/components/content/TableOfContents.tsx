import { useEffect, useState } from "react";

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;
    const observed = items
      .map((h) => document.getElementById(h.slug))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "0px 0px -75% 0px", threshold: 0 },
    );
    observed.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="font-mono text-[0.7rem] uppercase tracking-widest text-faint">On this page</p>
      <ul className="mt-3 space-y-2 border-l border-border">
        {items.map((h) => (
          <li key={h.slug} style={{ paddingLeft: h.depth === 3 ? "1.5rem" : "0.75rem" }}>
            <a
              href={`#${h.slug}`}
              className={
                "block border-l-2 -ml-px pl-3 no-underline transition-colors " +
                (active === h.slug
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-ink")
              }
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
