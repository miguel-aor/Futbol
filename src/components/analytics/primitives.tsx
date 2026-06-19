"use client";

import { useRef, type ReactNode } from "react";
import type {
  MetricSource,
  Reliability,
  RiskLevel,
} from "@/lib/analytics/types";

// --------------------------------------------------------------------- //
// Formato
// --------------------------------------------------------------------- //
export function pct(n: number, digits = 0): string {
  return `${(n * 100).toFixed(digits)}%`;
}
export function num(n: number, digits = 2): string {
  return n.toFixed(digits);
}

// --------------------------------------------------------------------- //
// Badges de fuente y confiabilidad
// --------------------------------------------------------------------- //
const SOURCE_STYLE: Record<MetricSource, { dot: string; label: string }> = {
  "365Scores": { dot: "bg-fuchsia-400", label: "365Scores" },
  StatsBomb: { dot: "bg-sky-400", label: "StatsBomb" },
  Understat: { dot: "bg-sky-400", label: "Understat" },
  FBref: { dot: "bg-sky-400", label: "FBref" },
  "Football-Data": { dot: "bg-sky-400", label: "Football-Data" },
  Opta: { dot: "bg-sky-400", label: "Opta" },
  StatsPerform: { dot: "bg-sky-400", label: "Stats Perform" },
  Wyscout: { dot: "bg-sky-400", label: "Wyscout" },
  Sportradar: { dot: "bg-sky-400", label: "Sportradar" },
  openfootball: { dot: "bg-emerald-400", label: "openfootball" },
  "PlayerStats.Football": { dot: "bg-sky-400", label: "PlayerStats.Football" },
  Snapshot: { dot: "bg-emerald-400", label: "Snapshot público" },
  Fallback: { dot: "bg-blue-400", label: "Fallback" },
  Demo: { dot: "bg-amber-400", label: "Demo data" },
};

export function SourceBadge({
  source,
  title,
}: {
  source: MetricSource;
  title?: string;
}) {
  const s = SOURCE_STYLE[source];
  const prefix = source === "Demo" ? "" : "Source: ";
  return (
    <span
      className="chip border border-white/10 bg-white/5 text-wc-muted"
      title={title ?? `Procedencia del dato: ${s.label}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {prefix}
      {s.label}
    </span>
  );
}

const RELIABILITY_STYLE: Record<Reliability, { cls: string; label: string }> = {
  high: { cls: "bg-wc-green/15 text-wc-green", label: "Confiabilidad alta" },
  medium: { cls: "bg-amber-400/15 text-amber-300", label: "Confiabilidad media" },
  low: { cls: "bg-wc-red/15 text-wc-red", label: "Confiabilidad baja" },
  demo: { cls: "bg-white/5 text-wc-muted", label: "Demo data" },
};

export function ReliabilityBadge({ reliability }: { reliability: Reliability }) {
  const r = RELIABILITY_STYLE[reliability];
  return (
    <span className={`chip ${r.cls}`} title="Confiabilidad/completitud del dato">
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {r.label}
    </span>
  );
}

const RISK_STYLE: Record<RiskLevel, { cls: string; label: string }> = {
  low: { cls: "bg-wc-green/15 text-wc-green", label: "Riesgo bajo" },
  medium: { cls: "bg-amber-400/15 text-amber-300", label: "Riesgo medio" },
  high: { cls: "bg-wc-red/15 text-wc-red", label: "Riesgo alto" },
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const r = RISK_STYLE[risk];
  return <span className={`chip ${r.cls}`}>{r.label}</span>;
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="chip border border-white/10 bg-white/5 text-[11px] text-wc-muted">
      {children}
    </span>
  );
}

// --------------------------------------------------------------------- //
// MetricCard
// --------------------------------------------------------------------- //
export function MetricCard({
  label,
  value,
  hint,
  accent = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "default" | "gold" | "green" | "red" | "blue";
  icon?: ReactNode;
}) {
  const accentCls = {
    default: "text-wc-text",
    gold: "text-wc-gold",
    green: "text-wc-green",
    red: "text-wc-red",
    blue: "text-wc-blue",
  }[accent];
  return (
    <div className="wc-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium uppercase tracking-wide text-wc-muted">
          {label}
        </div>
        {icon}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${accentCls}`}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-wc-muted">{hint}</div> : null}
    </div>
  );
}

// --------------------------------------------------------------------- //
// InfoBox — texto explicativo del modelo
// --------------------------------------------------------------------- //
export function InfoBox({
  title,
  children,
  tone = "info",
}: {
  title?: string;
  children: ReactNode;
  tone?: "info" | "warn";
}) {
  const cls =
    tone === "warn"
      ? "border-amber-400/30 bg-amber-400/5 text-amber-100/90"
      : "border-white/10 bg-white/[0.03] text-wc-muted";
  return (
    <div className={`rounded-xl border p-3 text-sm ${cls}`}>
      {title ? (
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-wc-gold">
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h3 className="text-base font-semibold text-wc-text">{title}</h3>
        {subtitle ? <p className="text-xs text-wc-muted">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

// --------------------------------------------------------------------- //
// Navegación: tabs y subtabs
// --------------------------------------------------------------------- //
export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

export function TabNav({
  tabs,
  active,
  onChange,
  variant = "primary",
  label,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  variant?: "primary" | "sub";
  /** aria-label del grupo de tabs (para lectores de pantalla). */
  label?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  // Navegación con teclado (patrón ARIA tabs): flechas + Home/End.
  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const last = tabs.length - 1;
    const next =
      e.key === "ArrowRight"
        ? (idx + 1) % tabs.length
        : e.key === "ArrowLeft"
          ? (idx - 1 + tabs.length) % tabs.length
          : e.key === "Home"
            ? 0
            : last;
    onChange(tabs[next].key);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={
        variant === "primary"
          ? "flex flex-wrap gap-1.5 rounded-2xl border border-white/10 bg-wc-card/60 p-1.5"
          : "flex flex-wrap gap-1 border-b border-white/10"
      }
    >
      {tabs.map((t, i) => {
        const on = t.key === active;
        const common = {
          ref: (el: HTMLButtonElement | null) => {
            refs.current[i] = el;
          },
          role: "tab",
          type: "button" as const,
          "aria-selected": on,
          // Roving tabindex: solo el tab activo es tabulable.
          tabIndex: on ? 0 : -1,
          onClick: () => onChange(t.key),
          onKeyDown: (e: React.KeyboardEvent) => onKeyDown(e, i),
        };
        if (variant === "primary") {
          return (
            <button
              key={t.key}
              {...common}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                on
                  ? "bg-wc-gold/15 text-wc-gold shadow-wc-gold"
                  : "text-wc-muted hover:bg-white/5 hover:text-wc-text"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          );
        }
        return (
          <button
            key={t.key}
            {...common}
            className={`-mb-px min-h-[40px] border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              on
                ? "border-wc-gold text-wc-gold"
                : "border-transparent text-wc-muted hover:text-wc-text"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// --------------------------------------------------------------------- //
// Barras
// --------------------------------------------------------------------- //
export interface BarSegment {
  label: string;
  value: number; // proporción (0-1) o se normaliza con el total
  color: string; // clase bg-*
}

/** Barra apilada de probabilidades (p. ej. local/empate/visita). */
export function ProbabilityBar({ segments }: { segments: BarSegment[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div>
      <div className="flex h-7 w-full overflow-hidden rounded-lg border border-white/10">
        {segments.map((s) => (
          <div
            key={s.label}
            className={`flex items-center justify-center text-[11px] font-semibold text-black/80 ${s.color}`}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${pct(s.value / total)}`}
          >
            {s.value / total > 0.12 ? pct(s.value / total) : ""}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-wc-muted">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-sm ${s.color}`} />
            {s.label} {pct(s.value / total)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Barra horizontal simple con valor; width relativo a max. */
export function StatBar({
  label,
  value,
  max,
  display,
  color = "bg-wc-gold/70",
}: {
  label: ReactNode;
  value: number;
  max: number;
  display?: string;
  color?: string;
}) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0 truncate text-sm text-wc-text">{label}</div>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full ${color}`} style={{ width: `${w}%` }} />
      </div>
      <div className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-wc-text">
        {display ?? value}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------- //
// Gauge radial (score 0-100)
// --------------------------------------------------------------------- //
export function RadialScore({
  value,
  label,
  size = 92,
  max = 100,
  color = "#D6B15E",
}: {
  value: number;
  label?: string;
  size?: number;
  max?: number;
  color?: string;
}) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, value / max));
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-wc-text"
          style={{ fontSize: size * 0.26, fontWeight: 700 }}
        >
          {Math.round(value)}
        </text>
      </svg>
      {label ? <div className="text-xs text-wc-muted">{label}</div> : null}
    </div>
  );
}

// --------------------------------------------------------------------- //
// Sparkline (línea SVG para evolución de rating)
// --------------------------------------------------------------------- //
export function Sparkline({
  values,
  width = 240,
  height = 64,
  color = "#D6B15E",
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 6;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - 2 * pad);
    const y = height - pad - ((v - min) / span) * (height - 2 * pad);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${d} L${pts[pts.length - 1][0].toFixed(1)},${height - pad} L${pts[0][0].toFixed(1)},${height - pad} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="max-w-full">
      <path d={area} fill={color} opacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3} fill={color} />
    </svg>
  );
}

// --------------------------------------------------------------------- //
// Forma reciente (W/D/L)
// --------------------------------------------------------------------- //
export function FormDots({ form }: { form: Array<"W" | "D" | "L"> }) {
  const map = { W: "bg-wc-green", D: "bg-amber-400", L: "bg-wc-red" };
  return (
    <div className="flex gap-1">
      {form.map((f, i) => (
        <span
          key={i}
          className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-black/80 ${map[f]}`}
          title={f === "W" ? "Victoria" : f === "D" ? "Empate" : "Derrota"}
        >
          {f}
        </span>
      ))}
    </div>
  );
}

// --------------------------------------------------------------------- //
// Inputs (formularios de Poisson / filtros)
// --------------------------------------------------------------------- //
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-wc-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-wc-muted/70">{hint}</span> : null}
    </label>
  );
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-wc-card px-3 py-2 text-sm text-wc-text focus:border-wc-gold focus:outline-none focus:ring-1 focus:ring-wc-gold/40"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-wc-card text-wc-text">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function RangeInput({
  value,
  onChange,
  min,
  max,
  step,
  display,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  display?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-wc-gold"
      />
      <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-wc-text">
        {display ?? value}
      </span>
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-lg border border-white/10 bg-wc-card px-3 py-2 text-sm text-wc-text focus:border-wc-gold focus:outline-none focus:ring-1 focus:ring-wc-gold/40"
    />
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-wc-card px-3 py-2 text-sm text-wc-text placeholder:text-wc-muted/60 focus:border-wc-gold focus:outline-none focus:ring-1 focus:ring-wc-gold/40"
    />
  );
}
