import { useState } from "react";

/**
 * Why one vector can't hold two hops: documents on a half circle, a query
 * direction, and top-k by cosine. Joint recall only reaches 1 once k is large
 * enough that the retrieved set is mostly distractors.
 */
const DOCS = [
  { a: 20, hop: "hop-1 doc" },
  { a: 140, hop: "hop-2 doc" },
  { a: 50 },
  { a: 65 },
  { a: 80 },
  { a: 95 },
  { a: 110 },
];
const CX = 260;
const CY = 270;
const R = 220;
const pt = (deg: number) => {
  const r = (-deg * Math.PI) / 180;
  return [CX + Math.cos(r) * R, CY + Math.sin(r) * R] as const;
};

export default function HopGeometry() {
  const [angle, setAngle] = useState(80);
  const [k, setK] = useState(3);

  const ranked = [...DOCS].sort(
    (x, y) => Math.cos(((y.a - angle) * Math.PI) / 180) - Math.cos(((x.a - angle) * Math.PI) / 180),
  );
  const top = new Set(ranked.slice(0, k).map((d) => d.a));
  const hop1 = top.has(20);
  const hop2 = top.has(140);
  const [qx, qy] = pt(angle);

  return (
    <figure className="not-prose my-8 rounded-[var(--radius-lg)] border border-border bg-surface p-4 font-sans">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <label className="flex items-center gap-2">
          Query direction <b className="font-mono text-ink">{angle}°</b>
          <input
            type="range"
            min={0}
            max={180}
            value={angle}
            onChange={(e) => setAngle(+e.target.value)}
            className="w-40 accent-[var(--color-accent)]"
          />
        </label>
        <label className="flex items-center gap-2">
          top-k <b className="font-mono text-ink">{k}</b>
          <input
            type="range"
            min={1}
            max={7}
            value={k}
            onChange={(e) => setK(+e.target.value)}
            className="w-28 accent-[var(--color-accent)]"
          />
        </label>
      </div>
      <svg
        viewBox="0 0 520 300"
        role="img"
        aria-label={`Query at ${angle} degrees, top ${k}: hop 1 ${hop1 ? "retrieved" : "missed"}, hop 2 ${hop2 ? "retrieved" : "missed"}`}
        className="mt-2 block h-auto max-w-full"
      >
        <path
          d={`M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={1.5}
        />
        <line x1={CX - R - 10} x2={CX + R + 10} y1={CY} y2={CY} stroke="var(--color-border)" />
        <line x1={CX} y1={CY} x2={qx} y2={qy} stroke="var(--color-ink)" strokeWidth={2.5} strokeLinecap="round" />
        <text x={qx} y={qy - 10} textAnchor="middle" fontSize={12} fontFamily="var(--font-mono)" fill="var(--color-ink)">
          query
        </text>
        {DOCS.map((d) => {
          const [x, y] = pt(d.a);
          const hit = top.has(d.a);
          const isHop = Boolean(d.hop);
          return (
            <g key={d.a}>
              <circle
                cx={x}
                cy={y}
                r={isHop ? 9 : 6}
                strokeWidth={2}
                stroke={isHop ? "#2E8B57" : "var(--color-faint)"}
                fill={hit ? (isHop ? "#2E8B57" : "var(--color-accent)") : "var(--color-surface)"}
              />
              {isHop && (
                <text x={x} y={y - 16} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--color-ink)">
                  {d.hop}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-sm text-muted">
        Top-{k}: hop 1 {hop1 ? "✓" : "✗"} · hop 2 {hop2 ? "✓" : "✗"} · joint recall{" "}
        <b className="text-ink">{hop1 && hop2 ? 1 : 0}</b>.{" "}
        {hop1 && hop2
          ? "Both hops only arrive once the retrieved set is mostly noise."
          : "Point the query anywhere: with a small k, one vector never lands near both hops."}
      </figcaption>
    </figure>
  );
}
