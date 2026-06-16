import { useEffect, useRef, useState } from "react";
import { Menu, X, Mail } from "lucide-react";

const NAV = [
  { label: "Blog", href: "/blog" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
];

const GithubIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const LinkedinIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
  </svg>
);

const SOCIAL = [
  { label: "GitHub", href: "https://github.com/theskipper007", Icon: GithubIcon },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/mv-arun/", Icon: LinkedinIcon },
  { label: "Email", href: "mailto:arunmv.eh@gmail.com", Icon: Mail },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] text-muted hover:text-ink"
      >
        <Menu size={20} strokeWidth={1.5} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div
            ref={panelRef}
            className="absolute inset-x-0 top-0 rounded-b-[var(--radius-lg)] border-b border-border bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-ink">menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] text-muted hover:text-ink"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <nav aria-label="Mobile" className="mt-4 flex flex-col">
              {NAV.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  className="border-b border-border py-3 text-lg text-ink no-underline"
                >
                  {n.label}
                </a>
              ))}
            </nav>
            <div className="mt-6 flex gap-4">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-muted hover:text-ink"
                  target={href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener"
                >
                  <Icon size={20} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
