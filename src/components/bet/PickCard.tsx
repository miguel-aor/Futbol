"use client";

import Link from "next/link";
import type { BetSelection } from "@/lib/bet/types";
import { useBetSlip } from "./BetSlipProvider";
import {
  BetSourceBadge,
  ConfidenceBadge,
  EdgeBadge,
  EVBadge,
  MetricMini,
  RatingBadge,
  RiskBadge,
  ValueMeter,
  fmtAmerican,
  fmtPct,
} from "./ui";

export function PickCard({ pick, matchHref }: { pick: BetSelection; matchHref?: string }) {
  const { add, has } = useBetSlip();
  const added = has(pick.id);

  return (
    <div className="wc-card wc-card-hover flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-wc-muted">{pick.label}</div>
          <div className="truncate text-base font-semibold text-wc-text">{pick.selection}</div>
          <div className="truncate text-xs text-wc-muted">{pick.matchName}</div>
        </div>
        <div className="shrink-0 rounded-lg bg-white/5 px-3 py-1.5 text-right">
          <div className="text-lg font-bold tabular-nums text-wc-gold">{fmtAmerican(pick.americanOdds)}</div>
          <div className="text-[10px] text-wc-muted">{pick.decimalOdds.toFixed(2)} dec</div>
        </div>
      </div>

      <ValueMeter modelProbability={pick.modelProbability} impliedProbability={pick.impliedProbability} />

      <div className="grid grid-cols-4 gap-2">
        <MetricMini label="Modelo" value={fmtPct(pick.modelProbability, 0)} accent="text-wc-text" />
        <MetricMini label="Implícita" value={fmtPct(pick.impliedProbability, 0)} accent="text-wc-muted" />
        <MetricMini label="Edge" value={`${pick.edge >= 0 ? "+" : ""}${(pick.edge * 100).toFixed(1)}`} accent={pick.edge >= 0 ? "text-wc-green" : "text-wc-red"} />
        <MetricMini label="EV" value={`${pick.expectedValue >= 0 ? "+" : ""}${(pick.expectedValue * 100).toFixed(0)}%`} accent={pick.expectedValue >= 0 ? "text-wc-green" : "text-wc-red"} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <RatingBadge rating={pick.rating} />
        <ConfidenceBadge score={pick.confidenceScore} />
        <RiskBadge risk={pick.riskLevel} />
        <BetSourceBadge source={pick.source} reliability={pick.reliability} />
      </div>

      <div className="text-[11px] text-wc-muted">Motor: {pick.models.join(" · ")}</div>

      <div className="mt-1 flex items-center justify-between gap-2">
        {matchHref ? (
          <Link href={matchHref} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-wc-text hover:bg-white/5">
            Ver partido
          </Link>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => add(pick)}
          disabled={added}
          className={`min-h-[40px] rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            added ? "cursor-default bg-white/5 text-wc-muted" : "bg-wc-gold/15 text-wc-gold hover:bg-wc-gold/25"
          }`}
        >
          {added ? "En ticket ✓" : "+ Agregar al ticket"}
        </button>
      </div>
    </div>
  );
}
