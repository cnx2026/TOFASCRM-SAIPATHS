import { useId, useMemo, useRef, useState } from "react";

/* Hafif, bağımlılıksız SVG grafikler — asıl panelden taşınmıştır
   (kaynak: cnx2026/TOFASCRM, tasarim-v2, src/components/ui/Charts.tsx). */

export interface Series { key: string; label: string; color: string; values: number[] }

const W = 800, H = 340, PL = 44, PR = 14, PT = 14, PB = 28;

function smooth(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
};
const nf = (n: number) => n.toLocaleString("tr-TR");

export function AreaChart({ labels, series, short }: { labels: string[]; series: Series[]; short: (i: number) => string }) {
  const uid = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [off, setOff] = useState<Record<string, boolean>>({});
  const live = series.filter((s) => !off[s.key]);
  const n = labels.length;

  const { x, y, paths } = useMemo(() => {
    const max = niceMax(Math.max(1, ...live.flatMap((s) => s.values)));
    const x = (i: number) => PL + (n <= 1 ? (W - PL - PR) / 2 : (i * (W - PL - PR)) / (n - 1));
    const y = (v: number) => PT + (1 - v / max) * (H - PT - PB);
    const paths = series.map((s) => {
      const pts = s.values.map((v, i) => [x(i), y(v)] as [number, number]);
      const line = smooth(pts);
      return { key: s.key, line, area: pts.length > 1 ? `${line} L${pts[pts.length - 1][0]},${H - PB} L${pts[0][0]},${H - PB} Z` : "" };
    });
    return { max, x, y, paths };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, off, n]);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0, bd = Infinity;
    for (let i = 0; i < n; i++) { const d = Math.abs(x(i) - px); if (d < bd) { bd = d; best = i; } }
    setHover(best);
  }

  const max = niceMax(Math.max(1, ...live.flatMap((s) => s.values)));
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const every = Math.max(1, Math.ceil(n / 9));
  const tip = hover != null ? { left: (x(hover) / W) * 100, flip: x(hover) > W * 0.62 } : null;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {series.map((s) => (
          <button
            key={s.key}
            onClick={() => setOff((o) => ({ ...o, [s.key]: !o[s.key] }))}
            aria-pressed={!off[s.key]}
            className={`tcrm-pressable flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold border ${
              off[s.key] ? "border-[var(--tcrm-border)] tcrm-text-muted opacity-60" : "border-[var(--tcrm-border-hi)] bg-white/5"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label="Günlük trend grafiği">
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.38" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((t) => {
            const yy = PT + (1 - t) * (H - PT - PB);
            return (
              <g key={t}>
                <line x1={PL} x2={W - PR} y1={yy} y2={yy} stroke="var(--tcrm-border)" strokeDasharray={t === 0 ? undefined : "3 5"} />
                <text x={PL - 8} y={yy + 3.5} textAnchor="end" fontSize="10.5" fill="var(--tcrm-muted)" fontWeight="600">{nf(Math.round(max * t))}</text>
              </g>
            );
          })}
          {labels.map((_, i) => (i % every === 0 || i === n - 1 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fill="var(--tcrm-muted)" fontWeight="600">{short(i)}</text>
          ) : null))}
          {series.map((s, si) => (off[s.key] ? null : (
            <g key={s.key}>
              {paths[si].area && <path d={paths[si].area} fill={`url(#${uid}-${s.key})`} />}
              <path
                d={paths[si].line}
                fill="none"
                stroke={s.color}
                strokeWidth="2.4"
                strokeLinecap="round"
                pathLength={1}
                style={{ strokeDasharray: 1, strokeDashoffset: 0, animation: "tcrmDrawLine .7s var(--tcrm-ease) both" }}
              />
            </g>
          )))}
          {hover != null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} stroke="var(--tcrm-border-hi)" strokeDasharray="3 4" />
              {live.map((s) => <circle key={s.key} cx={x(hover)} cy={y(s.values[hover])} r="4.5" fill={s.color} stroke="var(--tcrm-bg)" strokeWidth="2" />)}
            </g>
          )}
        </svg>
        {tip && hover != null && (
          <div
            className="pointer-events-none absolute top-2 tcrm-glass-hi rounded-xl px-3 py-2 text-[11px] min-w-[150px] z-10"
            style={{ left: `${tip.left}%`, transform: `translateX(${tip.flip ? "calc(-100% - 12px)" : "12px"})` }}
          >
            <p className="font-extrabold mb-1">{labels[hover]}</p>
            {live.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-4 font-semibold">
                <span className="flex items-center gap-1.5 tcrm-text-muted"><span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
                <span className="tabular-nums">{nf(s.values[hover])}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Halka gösterge: oran (0–1) */
export function Ring({ ratio, label, color, size = 132, sub }: { ratio: number; label: string; color: string; size?: number; sub?: string }) {
  const r = 52, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, ratio || 0));
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 128 128" role="img" aria-label={`${label} ${Math.round(v * 1000) / 10}%`}>
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--tcrm-border)" strokeWidth="11" />
        <circle
          cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform="rotate(-90 64 64)"
          style={{ ["--ring-from" as string]: c, animation: "tcrmRingIn .9s var(--tcrm-ease) both", filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
        <text x="64" y="62" textAnchor="middle" fontSize="23" fontWeight="800" fill="var(--tcrm-text)" className="tabular-nums">
          {v ? `%${(v * 100).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` : "–"}
        </text>
        <text x="64" y="80" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--tcrm-muted)" letterSpacing="0.8">{sub ?? ""}</text>
      </svg>
      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-widest tcrm-text-muted text-center">{label}</p>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`tcrm-skeleton ${className}`} />;
}
