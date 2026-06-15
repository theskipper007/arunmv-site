import { useEffect, useRef, useState, useCallback } from "react";
import { Search, FileText, ArrowRight } from "lucide-react";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
];

type Result = { url: string; title: string; excerpt: string };

// Lazy Pagefind loader. The index only exists in a real build (dist/pagefind);
// in `astro dev` the import fails and we degrade to nav-only gracefully.
let pagefind: any;
async function loadPagefind() {
  if (pagefind) return pagefind;
  try {
    pagefind = await import(/* @vite-ignore */ `${window.location.origin}/pagefind/pagefind.js`);
    await pagefind.options?.({ excerptLength: 18 });
  } catch {
    pagefind = { search: async () => ({ results: [] }), unavailable: true };
  }
  return pagefind;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
  }, []);

  // Global open triggers: Cmd/Ctrl-K and the header search button.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onClick(e: MouseEvent) {
      const t = (e.target as HTMLElement)?.closest("[data-open-command-palette]");
      if (t) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, []);

  // Focus the input + trap Escape while open.
  useEffect(() => {
    if (!open) return;
    loadPagefind().then((pf) => setUnavailable(Boolean(pf.unavailable)));
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    let active = true;
    const id = setTimeout(async () => {
      const pf = await loadPagefind();
      const search = await pf.search(q);
      const data: Result[] = await Promise.all(
        (search.results ?? []).slice(0, 8).map(async (r: any) => {
          const d = await r.data();
          return { url: d.url, title: d.meta?.title ?? d.url, excerpt: d.excerpt ?? "" };
        }),
      );
      if (active) setResults(data);
    }, 160);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [query, open]);

  if (!open) return null;

  const navMatches = NAV.filter((n) => n.label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search and navigation"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search size={18} strokeWidth={1.5} className="text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts or jump to a page…"
            className="h-12 w-full bg-transparent text-ink outline-none placeholder:text-faint"
            aria-label="Search query"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[0.7rem] text-faint">
            Esc
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {navMatches.length > 0 && (
            <section aria-label="Pages">
              <p className="px-3 pb-1 pt-2 font-mono text-[0.7rem] uppercase tracking-widest text-faint">
                Pages
              </p>
              {navMatches.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-ink no-underline hover:bg-paper"
                >
                  <ArrowRight size={15} strokeWidth={1.5} className="text-faint" />
                  {n.label}
                </a>
              ))}
            </section>
          )}

          {query.trim() && (
            <section aria-label="Results">
              <p className="px-3 pb-1 pt-2 font-mono text-[0.7rem] uppercase tracking-widest text-faint">
                Posts
              </p>
              {results.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  className="flex items-start gap-3 rounded-[var(--radius-md)] px-3 py-2 no-underline hover:bg-paper"
                >
                  <FileText size={15} strokeWidth={1.5} className="mt-1 shrink-0 text-faint" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ink">{r.title}</span>
                    <span
                      className="line-clamp-2 text-xs text-muted"
                      dangerouslySetInnerHTML={{ __html: r.excerpt }}
                    />
                  </span>
                </a>
              ))}
              {results.length === 0 && (
                <p className="px-3 py-3 text-sm text-faint">
                  {unavailable
                    ? "Search index builds with the site — run a production build to enable full-text search."
                    : "No matches."}
                </p>
              )}
            </section>
          )}

          {!query.trim() && (
            <p className="px-3 py-3 text-sm text-faint">Type to search, or pick a page above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
