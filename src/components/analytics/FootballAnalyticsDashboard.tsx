"use client";

import { useState } from "react";
import { ANALYTICS_LAST_UPDATED, METRIC_AVAILABILITY } from "@/data/footballAnalyticsMock";
import { InfoBox, TabNav, type TabItem } from "./primitives";
import { MatchesPanel } from "./MatchesPanel";
import { EloModelTab } from "./tabs/EloModelTab";
import { PoissonPredictionTab } from "./tabs/PoissonPredictionTab";
import { MonteCarloSimulationTab } from "./tabs/MonteCarloSimulationTab";
import { XGDashboardTab } from "./tabs/XGDashboardTab";
import { ShotMapTab } from "./tabs/ShotMapTab";
import { MatchMomentumTab } from "./tabs/MatchMomentumTab";
import { VAEPPlayerValuationTab } from "./tabs/VAEPPlayerValuationTab";
import { PlayerXGTab } from "./tabs/PlayerXGTab";
import { ImpactRankingTab } from "./tabs/ImpactRankingTab";
import { ScoutingDashboardTab } from "./tabs/ScoutingDashboardTab";
import { AnalyticsComparisonTab } from "./tabs/AnalyticsComparisonTab";
import { TournamentFormTab } from "./tabs/TournamentFormTab";

const MAIN_TABS: TabItem[] = [
  { key: "predict", label: "Predicción de Equipos" },
  { key: "performance", label: "Rendimiento de Partido" },
  { key: "players", label: "Valoración de Jugadores" },
  { key: "scouting", label: "Scouting Estadístico" },
  { key: "compare", label: "Comparador" },
];

const SUBTABS: Record<string, TabItem[]> = {
  predict: [
    { key: "wcform", label: "Mundial (forma actual)" },
    { key: "elo", label: "Elo / SPI" },
    { key: "poisson", label: "Poisson / Dixon-Coles" },
    { key: "montecarlo", label: "Monte Carlo" },
  ],
  performance: [
    { key: "xg", label: "Expected Goals (xG)" },
    { key: "shotmap", label: "Shot Map" },
    { key: "momentum", label: "Match Momentum" },
  ],
  players: [
    { key: "vaep", label: "VAEP" },
    { key: "playerxg", label: "xG por jugador" },
    { key: "impact", label: "Ranking de impacto" },
  ],
};

export function FootballAnalyticsDashboard() {
  const [main, setMain] = useState("predict");
  const [sub, setSub] = useState<Record<string, string>>({
    predict: "wcform",
    performance: "xg",
    players: "vaep",
  });
  const [showSources, setShowSources] = useState(false);

  const subTabs = SUBTABS[main];
  const activeSub = sub[main];
  const setActiveSub = (key: string) => setSub((prev) => ({ ...prev, [main]: key }));

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <header className="wc-card wc-ring relative overflow-hidden p-5 sm:p-6">
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="wc-gold-text text-2xl font-bold sm:text-3xl">Football Analytics</h1>
            <span className="chip border border-wc-gold/30 bg-wc-gold/10 text-wc-gold">Modelos estadísticos</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-wc-muted">
            Este módulo utiliza modelos estadísticos aplicados al fútbol para medir fuerza de equipos, predecir
            partidos, analizar rendimiento y valorar jugadores. Combina Elo/SPI, Poisson/Dixon-Coles, xG,
            simulaciones Monte Carlo, VAEP y scouting estadístico para ofrecer una visión más profunda que las
            estadísticas tradicionales.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="chip border border-white/10 bg-white/5 text-wc-muted">
              Datos al {ANALYTICS_LAST_UPDATED}
            </span>
            <span className="chip border border-amber-400/30 bg-amber-400/10 text-amber-300">
              Demo data — listo para conectar fuentes reales
            </span>
            <button
              type="button"
              onClick={() => setShowSources((v) => !v)}
              className="chip border border-white/10 bg-white/5 text-wc-text hover:bg-white/10"
            >
              {showSources ? "Ocultar" : "Ver"} fuentes y disponibilidad
            </button>
          </div>
        </div>
      </header>

      {showSources ? (
        <div className="space-y-3">
          <InfoBox title="Prioridad de fuentes">
            Los datos se priorizan desde <strong className="text-wc-text">365Scores</strong>. Cuando una métrica
            no está disponible en 365Scores, el sistema permite utilizar fuentes secundarias confiables como
            StatsBomb Open Data, Understat, FBref/Opta o Football-Data.co.uk. Los datos demo se muestran
            únicamente como ejemplo visual.
          </InfoBox>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-wide text-wc-muted">
                  <th className="px-3 py-2 text-left">Métrica</th>
                  <th className="px-3 py-2 text-center">¿En 365Scores?</th>
                  <th className="px-3 py-2 text-left">Fallback</th>
                  <th className="px-3 py-2 text-left">Nota</th>
                </tr>
              </thead>
              <tbody>
                {METRIC_AVAILABILITY.map((m) => (
                  <tr key={m.metric} className="border-b border-white/[0.06] last:border-0">
                    <td className="px-3 py-2 font-medium text-wc-text">{m.metric}</td>
                    <td className="px-3 py-2 text-center">
                      {m.available365 ? (
                        <span className="chip bg-wc-green/15 text-wc-green">Sí</span>
                      ) : (
                        <span className="chip bg-wc-red/15 text-wc-red">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-wc-muted">{m.fallbackSource ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-wc-muted">{m.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Estado de partidos (hoy / próximos / finalizados, hora Monterrey) */}
      <MatchesPanel />

      {/* Tabs principales */}
      <TabNav tabs={MAIN_TABS} active={main} onChange={setMain} variant="primary" label="Secciones de Football Analytics" />

      {/* Subtabs (para tabs con submodelos) */}
      {subTabs ? (
        <TabNav tabs={subTabs} active={activeSub} onChange={setActiveSub} variant="sub" label="Modelos de la sección" />
      ) : null}

      {/* Contenido */}
      <div role="tabpanel" aria-label={MAIN_TABS.find((t) => t.key === main)?.label}>
        {main === "predict" && activeSub === "wcform" ? <TournamentFormTab /> : null}
        {main === "predict" && activeSub === "elo" ? <EloModelTab /> : null}
        {main === "predict" && activeSub === "poisson" ? <PoissonPredictionTab /> : null}
        {main === "predict" && activeSub === "montecarlo" ? <MonteCarloSimulationTab /> : null}

        {main === "performance" && activeSub === "xg" ? <XGDashboardTab /> : null}
        {main === "performance" && activeSub === "shotmap" ? <ShotMapTab /> : null}
        {main === "performance" && activeSub === "momentum" ? <MatchMomentumTab /> : null}

        {main === "players" && activeSub === "vaep" ? <VAEPPlayerValuationTab /> : null}
        {main === "players" && activeSub === "playerxg" ? <PlayerXGTab /> : null}
        {main === "players" && activeSub === "impact" ? <ImpactRankingTab /> : null}

        {main === "scouting" ? <ScoutingDashboardTab /> : null}
        {main === "compare" ? <AnalyticsComparisonTab /> : null}
      </div>
    </div>
  );
}
