"use client";

import { PlayerRankingTable, type Column } from "@/components/analytics/PlayerRankingTable";
import type { BetSelection } from "@/lib/bet/types";
import { useBetSlip } from "./BetSlipProvider";
import { BetSourceBadge, RatingBadge, RiskBadge, fmtAmerican, fmtPct } from "./ui";

export function PickTable({ rows }: { rows: BetSelection[] }) {
  const { add, has } = useBetSlip();

  const columns: Column<BetSelection>[] = [
    { key: "match", label: "Partido", render: (r) => <span className="text-wc-muted">{r.matchName}</span> },
    { key: "market", label: "Mercado", render: (r) => <span className="text-wc-muted">{r.label}</span> },
    { key: "pick", label: "Pick", render: (r) => <span className="font-medium">{r.selection}</span> },
    { key: "line", label: "Línea", align: "right", render: (r) => (r.line == null ? "—" : r.line) },
    { key: "odds", label: "Momio", align: "right", render: (r) => <span className="font-bold text-wc-gold">{fmtAmerican(r.americanOdds)}</span> },
    { key: "model", label: "Modelo", align: "right", render: (r) => fmtPct(r.modelProbability, 0) },
    { key: "implied", label: "Implícita", align: "right", render: (r) => <span className="text-wc-muted">{fmtPct(r.impliedProbability, 0)}</span> },
    { key: "edge", label: "Edge", align: "right", render: (r) => <span className={r.edge >= 0 ? "text-wc-green" : "text-wc-red"}>{r.edge >= 0 ? "+" : ""}{(r.edge * 100).toFixed(1)}</span> },
    { key: "ev", label: "EV", align: "right", render: (r) => <span className={r.expectedValue >= 0 ? "text-wc-green" : "text-wc-red"}>{r.expectedValue >= 0 ? "+" : ""}{(r.expectedValue * 100).toFixed(0)}%</span> },
    { key: "conf", label: "Conf.", align: "right", render: (r) => r.confidenceScore },
    { key: "risk", label: "Riesgo", render: (r) => <RiskBadge risk={r.riskLevel} /> },
    { key: "rating", label: "Rating", render: (r) => <RatingBadge rating={r.rating} /> },
    { key: "source", label: "Fuente", render: (r) => <BetSourceBadge source={r.source} /> },
    {
      key: "action",
      label: "",
      align: "right",
      render: (r) => (
        <button
          type="button"
          onClick={() => add(r)}
          disabled={has(r.id)}
          className={`rounded px-2 py-1 text-xs font-semibold ${
            has(r.id) ? "cursor-default text-wc-muted" : "bg-wc-gold/15 text-wc-gold hover:bg-wc-gold/25"
          }`}
        >
          {has(r.id) ? "✓" : "+ Ticket"}
        </button>
      ),
    },
  ];

  return (
    <PlayerRankingTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      highlightTop={3}
      emptyMessage="Sin picks para los filtros actuales."
    />
  );
}
