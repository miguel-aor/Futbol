"use client";

import { useState } from "react";
import { MOCK_SIMULATIONS, MOCK_TEAMS } from "@/data/footballAnalyticsMock";
import { runMonteCarloSimulation } from "@/lib/footballModels";
import type { SimulationResult } from "@/lib/analytics/types";
import {
  InfoBox,
  MetricCard,
  SectionHeading,
  SourceBadge,
  StatBar,
  pct,
} from "../primitives";
import { PlayerRankingTable, type Column } from "../PlayerRankingTable";

export function MonteCarloSimulationTab() {
  const [sims, setSims] = useState<SimulationResult[]>(MOCK_SIMULATIONS);
  const [iterations, setIterations] = useState(5000);
  const [running, setRunning] = useState(false);
  const [runs, setRuns] = useState(0);

  const run = (iters: number) => {
    setRunning(true);
    // Semilla determinista que varía por corrida (sin Math.random → SSR-safe).
    const seed = 20260618 + runs * 7919;
    // setTimeout para permitir el repintado del estado "calculando".
    setTimeout(() => {
      const res = runMonteCarloSimulation(MOCK_TEAMS, { iterations: iters, seed });
      setSims(res);
      setIterations(iters);
      setRuns((r) => r + 1);
      setRunning(false);
    }, 20);
  };

  const champ = sims[0];

  const columns: Column<SimulationResult>[] = [
    { key: "rank", label: "#", render: (_s, i) => <span className="text-wc-muted">{i + 1}</span> },
    { key: "name", label: "Selección", render: (s) => <span className="font-medium">{s.teamName}</span> },
    { key: "qualify", label: "Clasifica", align: "right", render: (s) => pct(s.qualify) },
    { key: "first", label: "1° de grupo", align: "right", render: (s) => pct(s.firstPlace) },
    { key: "semi", label: "Semifinal", align: "right", render: (s) => pct(s.semifinal) },
    { key: "final", label: "Final", align: "right", render: (s) => pct(s.final) },
    { key: "champ", label: "Campeón", align: "right", render: (s) => <span className="font-bold text-wc-gold">{pct(s.champion)}</span> },
    { key: "pts", label: "Pts esp.", align: "right", render: (s) => s.expectedPoints.toFixed(1) },
  ];

  return (
    <div className="space-y-5">
      <InfoBox title="Monte Carlo">
        Monte Carlo permite simular miles de escenarios usando probabilidades base para estimar resultados
        futuros, clasificación y campeonatos. No predice un resultado único, sino una distribución de posibles
        escenarios.
      </InfoBox>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[1000, 5000, 10000].map((n) => (
            <button
              key={n}
              type="button"
              disabled={running}
              onClick={() => run(n)}
              className="rounded-lg bg-wc-gold/15 px-3 py-2 text-sm font-semibold text-wc-gold transition-colors hover:bg-wc-gold/25 disabled:opacity-50"
            >
              Simular {n.toLocaleString("es")} ×
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-wc-muted">
          {running ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-wc-gold" /> : null}
          <span>{running ? "Calculando…" : `Última corrida: ${iterations.toLocaleString("es")} simulaciones`}</span>
          <SourceBadge source="Demo" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Favorito al título" value={champ?.teamName ?? "—"} accent="gold" hint={champ ? `${pct(champ.champion)} de campeón` : undefined} />
        <MetricCard label="Prob. de campeón" value={champ ? pct(champ.champion) : "—"} accent="gold" />
        <MetricCard label="Base de probabilidades" value="Elo + Poisson" hint="Ratings de los equipos" />
      </div>

      <div>
        <SectionHeading title="Probabilidades por selección" subtitle="Fase de grupos (round-robin) + llave de eliminación directa." />
        <PlayerRankingTable columns={columns} rows={sims} rowKey={(s) => s.teamId} highlightTop={2} />
      </div>

      <div className="wc-card p-4">
        <SectionHeading title="Probabilidad de clasificar" subtitle="Top 2 del grupo." />
        <div className="space-y-2">
          {sims.map((s) => (
            <StatBar key={s.teamId} label={s.teamName} value={s.qualify} max={1} display={pct(s.qualify)} color="bg-wc-green/70" />
          ))}
        </div>
      </div>

      <div className="wc-card p-4">
        <SectionHeading title="Distribución de posiciones (campeón del grupo)" subtitle="Probabilidad de terminar en cada posición." />
        <div className="space-y-3">
          {sims.map((s) => (
            <div key={s.teamId}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-wc-text">{s.teamName}</span>
                <span className="text-wc-muted">{pct(s.firstPlace)} 1°</span>
              </div>
              <div className="flex h-4 overflow-hidden rounded">
                {s.positionDistribution.map((p, pos) => (
                  <div
                    key={pos}
                    className="h-full"
                    style={{
                      width: `${p * 100}%`,
                      backgroundColor: `rgba(214,177,94,${(0.85 - pos * 0.1).toFixed(2)})`,
                    }}
                    title={`${pos + 1}° lugar: ${pct(p)}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[11px] text-wc-muted">Más dorado/claro a la izquierda = mejores posiciones (1°, 2°…).</div>
      </div>
    </div>
  );
}
