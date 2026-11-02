import { useEffect, useState } from "react";

export interface IndexItem {
  id: string;
  label: string;
  depth: number; // 2 = group, 3 = topic
}

/**
 * Section index for the Writing page. `side` renders the sticky "On this page"
 * list (same look as TableOfContents); `chips` renders a sticky scrolling row
 * for phones. Both follow scroll position and the page's type filter.
 */
export default function WritingIndex({
  items,
  variant,
}: {
  items: IndexItem[];
  variant: "side" | "chips";
}) {
  const [active, setActive] = useState("");
  const [visible, setVisible] = useState<Set<string> | null>(null);

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-90px 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));

    const initial = (window as unknown as { __writingVisible?: string[] }).__writingVisible;
    if (initial) setVisible(new Set(initial));

    const onFilter = (e: Event) =>
      setVisible(new Set((e as CustomEvent<{ visible: string[] }>).detail.visible));
    document.addEventListener("writing:filter", onFilter);
    return () => {
      observer.disconnect();
      document.removeEventListener("writing:filter", onFilter);
    };
  }, [items]);

  const shown = items.filter((i) => !visible || visible.has(i.id));
  if (shown.length === 0) return null;

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(history.state, "", `#${id}`);
  };

  if (variant === "chips") {
    // On phones, a group with topic sub-headings is represented by its topics.
    const chips = shown.filter((i) => i.depth === 3 || !hasTopics(items, i));
    return (
      <nav
        aria-label="Sections"
        className="sticky top-16 z-10 -mx-1 mb-6 flex gap-1.5 overflow-x-auto bg-paper/90 px-1 py-2 backdrop-blur lg:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {chips.map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            onClick={(e) => go(e, i.id)}
            className={
              "flex-none rounded-[var(--radius-pill)] border px-2.5 py-1 font-mono text-[0.74rem] no-underline " +
              (active === i.id
                ? "border-ink bg-ink text-paper"
                : "border-border bg-surface text-muted hover:text-ink")
            }
          >
            {i.label}
          </a>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="Writing sections" className="text-sm">
      <p className="font-mono text-[0.7rem] uppercase tracking-widest text-faint">On this page</p>
      <ul className="mt-3 space-y-1 border-l border-border">
        {shown.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              onClick={(e) => go(e, i.id)}
              style={{ paddingLeft: i.depth === 3 ? "1.5rem" : "0.75rem" }}
              className={
                "-ml-px block border-l-2 py-1 pr-1 no-underline transition-colors " +
                (i.depth === 2 ? "font-semibold " : "") +
                (active === i.id
                  ? "border-accent text-accent"
                  : i.depth === 2
                    ? "border-transparent text-ink hover:text-accent"
                    : "border-transparent text-muted hover:text-ink")
              }
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** True when a group heading is directly followed by its topic sub-headings. */
function hasTopics(items: IndexItem[], item: IndexItem): boolean {
  return item.depth === 2 && items[items.indexOf(item) + 1]?.depth === 3;
}
