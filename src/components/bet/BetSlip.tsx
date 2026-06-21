"use client";

import { useBetSlip } from "./BetSlipProvider";
import {
  BetSourceBadge,
  ConfidenceBadge,
  MetricMini,
  RiskBadge,
  fmtAmerican,
  fmtPct,
  fmtSignedPct,
} from "./ui";

export function BetSlip({ compact = false }: { compact?: boolean }) {
  const { picks, summary, remove, clear, notice, dismissNotice } = useBetSlip();

  return (
    <div className="wc-card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-wc-text">Ticket</h3>
        <span className="text-xs text-wc-muted">{summary.pickCount} picks</span>
      </div>

      {notice ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 py-1.5 text-[11px] text-amber-100">
          <span>{notice}</span>
          <button type="button" onClick={dismissNotice} className="shrink-0 text-amber-300 hover:text-amber-100">✕</button>
        </div>
      ) : null}

      {picks.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-8 text-center text-sm text-wc-muted">
          Agrega picks desde Value Picks o captura una línea en Bet Builder para evaluar el ticket.
        </p>
      ) : (
        <>
          <ul className="space-y-1.5">
            {picks.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-wc-text">{p.selection}</div>
                  <div className="truncate text-[11px] text-wc-muted">{p.matchName}</div>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-wc-gold">{fmtAmerican(p.americanOdds)}</span>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label="Quitar pick"
                  className="shrink-0 rounded px-1.5 py-1 text-xs text-wc-red hover:bg-wc-red/10"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricMini label="Momio comb." value={fmtAmerican(summary.combinedAmericanOdds)} accent="text-wc-gold" />
            <MetricMini label="Prob. conjunta" value={fmtPct(summary.estimatedProbability, 1)} />
            <MetricMini label="EV estimado" value={fmtSignedPct(summary.estimatedEV)} accent={summary.estimatedEV >= 0 ? "text-wc-green" : "text-wc-red"} />
            <MetricMini label="Decimal" value={summary.combinedDecimalOdds.toFixed(2)} />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <ConfidenceBadge score={summary.confidenceScore} />
            <span className="text-[11px] text-wc-muted">Correlación:</span>
            <RiskBadge risk={summary.correlationRisk} />
            {summary.isSameGame ? <BetSourceBadge source="Model" /> : null}
          </div>

          {summary.warnings.length ? (
            <ul className="space-y-1 rounded-lg border border-amber-400/30 bg-amber-400/5 p-2 text-[11px] text-amber-100/90">
              {summary.warnings.map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          ) : null}

          <p className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-xs text-wc-muted">
            {summary.finalRecommendation}
          </p>

          {!compact ? (
            <button
              type="button"
              onClick={clear}
              className="min-h-[40px] rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-wc-muted hover:bg-white/5"
            >
              Vaciar ticket
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
