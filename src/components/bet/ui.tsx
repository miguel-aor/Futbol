"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type {
  BetSource,
  PickRating,
  Reliability,
  RiskLevel,
} from "@/lib/bet/types";

// --------------------------------------------------------------------- //
// Formato
// --------------------------------------------------------------------- //
export function fmtPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}
export function fmtSignedPct(n: number, digits = 1): string {
  return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(digits)}%`;
}
export function fmtAmerican(n: number): string {
  return `${n > 0 ? "+" : ""}${n}`;
}
export function fmtDecimal(n: number): string {
  return n.toFixed(2);
}

// --------------------------------------------------------------------- //
// Badges
// --------------------------------------------------------------------- //
const RATING_STYLE: Record<PickRating, { cls: string; label: string }> = {
  strong_value: { cls: "bg-wc-green/15 text-wc-green", label: "Strong value" },
  positive_value: { cls: "bg-wc-gold/15 text-wc-gold", label: "Positive value" },
  fair_line: { cls: "bg-white/5 text-wc-muted", label: "Fair line" },
  risky: { cls: "bg-amber-400/15 text-amber-300", label: "Risky" },
  avoid: { cls: "bg-wc-red/15 text-wc-red", label: "Avoid" },
};

export function RatingBadge({ rating }: { rating: PickRating }) {
  const r = RATING_STYLE[rating];
  return <span className={`chip font-semibold ${r.cls}`}>{r.label}</span>;
}

export function EdgeBadge({ edge }: { edge: number }) {
  const cls = edge >= 0.05 ? "bg-wc-green/15 text-wc-green" : edge >= 0 ? "bg-wc-gold/15 text-wc-gold" : "bg-wc-red/15 text-wc-red";
  return (
    <span className={`chip font-semibold tabular-nums ${cls}`} title="Edge = prob. modelo − prob. implícita">
      {fmtSignedPct(edge)}
    </span>
  );
}

export function EVBadge({ ev }: { ev: number }) {
  const cls = ev >= 0.05 ? "bg-wc-green/15 text-wc-green" : ev >= 0 ? "bg-wc-gold/15 text-wc-gold" : "bg-wc-red/15 text-wc-red";
  return (
    <span className={`chip font-semibold tabular-nums ${cls}`} title="EV estimado por unidad apostada">
      EV {fmtSignedPct(ev)}
    </span>
  );
}

export function ConfidenceBadge({ score }: { score: number }) {
  const cls = score >= 66 ? "bg-wc-green/15 text-wc-green" : score >= 45 ? "bg-wc-gold/15 text-wc-gold" : "bg-white/5 text-wc-muted";
  return <span className={`chip tabular-nums ${cls}`} title="Confianza estimada del modelo">Conf. {score}</span>;
}

const RISK_STYLE: Record<RiskLevel, { cls: string; label: string }> = {
  low: { cls: "bg-wc-green/15 text-wc-green", label: "Riesgo bajo" },
  medium: { cls: "bg-amber-400/15 text-amber-300", label: "Riesgo medio" },
  high: { cls: "bg-wc-red/15 text-wc-red", label: "Riesgo alto" },
};

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <span className={`chip ${RISK_STYLE[risk].cls}`}>{RISK_STYLE[risk].label}</span>;
}

const SOURCE_DOT: Record<BetSource, string> = {
  Demo: "bg-amber-400",
  "Manual input": "bg-sky-400",
  "Manual screenshot": "bg-cyan-400",
  "Imported CSV": "bg-teal-400",
  "Imported JSON": "bg-teal-400",
  "365Scores": "bg-fuchsia-400",
  Model: "bg-emerald-400",
  Fallback: "bg-blue-400",
};

export function BetSourceBadge({
  source,
  reliability,
}: {
  source: BetSource;
  reliability?: Reliability;
}) {
  const label = source === "Demo" ? "Demo data" : source === "Manual input" ? "Manual input" : `Source: ${source}`;
  return (
    <span className="chip border border-white/10 bg-white/5 text-wc-muted" title={reliability ? `Confiabilidad: ${reliability}` : undefined}>
      <span className={`h-1.5 w-1.5 rounded-full ${SOURCE_DOT[source]}`} />
      {label}
    </span>
  );
}

// --------------------------------------------------------------------- //
// Value meter (barra prob. modelo vs implícita)
// --------------------------------------------------------------------- //
export function ValueMeter({
  modelProbability,
  impliedProbability,
}: {
  modelProbability: number;
  impliedProbability: number;
}) {
  const m = Math.round(modelProbability * 100);
  const i = Math.round(impliedProbability * 100);
  return (
    <div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="absolute inset-y-0 left-0 bg-wc-gold/70" style={{ width: `${m}%` }} />
        <div className="absolute inset-y-0 w-0.5 bg-white/80" style={{ left: `${i}%` }} title={`Implícita ${i}%`} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-wc-muted">
        <span>Modelo {m}%</span>
        <span>Implícita {i}%</span>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------- //
// Disclaimer responsable (visible)
// --------------------------------------------------------------------- //
export function DisclaimerBar({ compact = false }: { compact?: boolean }) {
  return (
    <p
      className={`rounded-lg border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-amber-100/90 ${
        compact ? "text-[11px]" : "text-xs"
      }`}
    >
      Las predicciones son <strong>estimaciones estadísticas</strong>, no garantizan resultados y no constituyen
      consejo financiero. Sin enlaces a casas de apuestas.
    </p>
  );
}

/**
 * Input de momio AMERICANO. Usa type="text" (no "number") para permitir el
 * signo "+" (los inputs numéricos del navegador no dejan escribir "+200").
 * Acepta "+200", "-150" o "200"; al perder foco normaliza el signo.
 */
export function AmericanOddsInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  const [text, setText] = useState(fmt(value));
  const lastEmitted = useRef<number>(value);

  // Refleja cambios EXTERNOS del valor (p. ej. autollenado) sin pisar lo que
  // el usuario está escribiendo (solo si el valor difiere del último emitido).
  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setText(fmt(value));
    }
  }, [value]);

  const handle = (raw: string) => {
    if (!/^[+-]?\d*$/.test(raw)) return; // solo signo opcional + dígitos
    setText(raw);
    if (/^[+-]?\d+$/.test(raw)) {
      lastEmitted.current = Number(raw);
      onChange(Number(raw));
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => handle(e.target.value)}
      onBlur={() => {
        if (!/^[+-]?\d+$/.test(text) || text === "+" || text === "-") setText(fmt(value));
        else setText(fmt(Number(text)));
      }}
      placeholder="+150 / -120"
      className="w-full rounded-lg border border-white/10 bg-wc-card px-3 py-2 text-sm tabular-nums text-wc-text placeholder:text-wc-muted/60 focus:border-wc-gold focus:outline-none focus:ring-1 focus:ring-wc-gold/40"
    />
  );
}

export function MetricMini({ label, value, accent }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-2 py-1.5 text-center">
      <div className={`text-sm font-bold tabular-nums ${accent ?? "text-wc-text"}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-wc-muted">{label}</div>
    </div>
  );
}
