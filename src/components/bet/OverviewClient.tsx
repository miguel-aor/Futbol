"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildValuePicks } from "@/lib/bet/buildPicks";
import { rankBestValuePicks } from "@/lib/betBuilderModels";
import { dedupeSelections } from "@/lib/bet/dedupe";
import { DEMO_LAST_UPDATED, DEMO_MATCH } from "@/data/betBuilderMock";
import type { BetSelection } from "@/lib/bet/types";
import { PickCard } from "./PickCard";
import { BetSlip } from "./BetSlip";
import { BetSourceBadge, DisclaimerBar, MetricMini, fmtSignedPct } from "./ui";

type Filter = "all" | "goals" | "corners" | "cards" | "players" | "team" | "high_conf" | "edge" | "low_risk";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "goals", label: "Goles" },
  { key: "corners", label: "Corners" },
  { key: "cards", label: "Tarjetas" },
  { key: "players", label: "Jugadores" },
  { key: "team", label: "Team props" },
  { key: "high_conf", label: "Alta confianza" },
  { key: "edge", label: "Edge positivo" },
  { key: "low_risk", label: "Bajo riesgo" },
];

function applyFilter(picks: BetSelection[], f: Filter): BetSelection[] {
  switch (f) {
    case "goals":
      return picks.filter((p) => ["total_goals", "team_total_goals", "both_teams_score", "anytime_goalscorer"].includes(p.marketType));
    case "corners":
      return picks.filter((p) => p.marketType === "corners" || p.marketType === "team_total_corners");
    case "cards":
      return picks.filter((p) => p.marketType === "cards" || p.marketType === "player_cards");
    case "players":
      return picks.filter((p) => p.category === "player");
    case "team":
      return picks.filter((p) => p.category === "team");
    case "high_conf":
      return picks.filter((p) => p.confidenceScore >= 60);
    case "edge":
      return picks.filter((p) => p.edge > 0);
    case "low_risk":
      return picks.filter((p) => p.riskLevel === "low");
    default:
      return picks;
  }
}

export function OverviewClient() {
  const demoUsa = useMemo(() => buildValuePicks(), []);
  const [upcoming, setUpcoming] = useState<BetSelection[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/value-picks?limit=8")
      .then((r) => r.json())
      .then((j) => active && j?.ok && setUpcoming(j.data as BetSelection[]))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const allPicks = useMemo(
    () => rankBestValuePicks(dedupeSelections([...upcoming, ...demoUsa])),
    [upcoming, demoUsa],
  );
  const [filter, setFilter] = useState<Filter>("all");

  const withEdge = allPicks.filter((p) => p.edge > 0);
  const best = allPicks[0];
  const avgConf = Math.round(allPicks.reduce((s, p) => s + p.confidenceScore, 0) / (allPicks.length || 1));
  const lowRisk = allPicks.filter((p) => p.riskLevel === "low").length;

  const shown = applyFilter(allPicks, filter).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Hero compacto */}
      <header className="wc-card wc-ring relative overflow-hidden p-5 sm:p-6">
        <h1 className="wc-gold-text text-2xl font-bold sm:text-3xl">Picks con valor, no corazonadas.</h1>
        <p className="mt-2 max-w-2xl text-sm text-wc-muted">
          Analiza partidos, líneas y momios para detectar <strong className="text-wc-text">edge</strong>, EV
          positivo, confianza y riesgo. Las predicciones son estimaciones estadísticas y no garantizan resultados.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/picks" className="min-h-[40px] rounded-lg bg-wc-gold/15 px-4 py-2 text-sm font-semibold text-wc-gold hover:bg-wc-gold/25">
            Ver mejores picks
          </Link>
          <Link href="/partidos" className="min-h-[40px] rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-wc-text hover:bg-white/5">
            Analizar partido
          </Link>
          <Link href="/bet-builder" className="min-h-[40px] rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-wc-text hover:bg-white/5">
            Abrir Bet Builder
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="chip border border-white/10 bg-white/5 text-wc-muted">Datos al {DEMO_LAST_UPDATED.slice(0, 10)}</span>
          <BetSourceBadge source="Demo" reliability="demo" />
        </div>
      </header>

      <DisclaimerBar />

      {/* Cards principales */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricMini label="Picks analizadas" value={allPicks.length} accent="text-wc-text" />
        <MetricMini label="Edge positivo" value={withEdge.length} accent="text-wc-green" />
        <MetricMini label="Mejor EV" value={best ? fmtSignedPct(best.expectedValue, 0) : "—"} accent="text-wc-gold" />
        <MetricMini label="Confianza prom." value={avgConf} accent="text-wc-text" />
        <MetricMini label="Bajo riesgo" value={lowRisk} accent="text-wc-green" />
      </div>

      {/* Top value picks */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-wc-text">Top Value Picks</h2>
            <Link href="/picks" className="text-xs font-semibold text-wc-gold hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.key ? "bg-wc-gold/15 text-wc-gold" : "border border-white/10 text-wc-muted hover:bg-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-12 text-center text-sm text-wc-muted">
              Agrega líneas y momios en Bet Builder para detectar picks con valor estadístico.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {shown.map((p) => (
                <PickCard key={p.id} pick={p} matchHref="/partidos" />
              ))}
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <BetSlip compact />
          <p className="mt-2 text-center text-[11px] text-wc-muted">
            Partido demo: {DEMO_MATCH.name}
          </p>
        </aside>
      </div>
    </div>
  );
}
