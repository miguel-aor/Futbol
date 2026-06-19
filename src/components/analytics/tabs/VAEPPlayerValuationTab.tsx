"use client";

import { useState } from "react";
import { MOCK_VAEP_ACTIONS, MOCK_VAEP_SUMMARIES } from "@/data/footballAnalyticsMock";
import { rankPlayersByVAEP } from "@/lib/footballModels";
import type { VAEPPlayerSummary } from "@/lib/analytics/types";
import {
  InfoBox,
  MetricCard,
  RadialScore,
  ReliabilityBadge,
  SectionHeading,
  SourceBadge,
  StatBar,
  num,
} from "../primitives";
import { PlayerRankingTable, type Column } from "../PlayerRankingTable";
import { VAEPActionTimeline } from "../VAEPActionTimeline";

export function VAEPPlayerValuationTab() {
  const ranked = rankPlayersByVAEP(MOCK_VAEP_SUMMARIES);
  const [selectedId, setSelectedId] = useState(ranked[0]?.playerId);
  const selected = ranked.find((p) => p.playerId === selectedId) ?? ranked[0];

  const maxVaep = Math.max(...ranked.map((p) => p.vaepTotal), 0.01);
  const maxPer90 = Math.max(...ranked.map((p) => p.vaepPer90), 0.01);

  const columns: Column<VAEPPlayerSummary>[] = [
    { key: "rank", label: "#", render: (_p, i) => <span className="text-wc-muted">{i + 1}</span> },
    { key: "name", label: "Jugador", render: (p) => (
      <button type="button" onClick={() => setSelectedId(p.playerId)} className="text-left font-medium text-wc-text hover:text-wc-gold">
        {p.name}
      </button>
    ) },
    { key: "team", label: "Equipo", render: (p) => <span className="text-wc-muted">{p.team}</span> },
    { key: "total", label: "VAEP", align: "right", render: (p) => <span className="font-bold text-wc-gold">{num(p.vaepTotal)}</span> },
    { key: "off", label: "Ofensivo", align: "right", render: (p) => num(p.vaepOffensive) },
    { key: "def", label: "Defensivo", align: "right", render: (p) => num(p.vaepDefensive) },
    { key: "p90", label: "VAEP/90", align: "right", render: (p) => num(p.vaepPer90) },
    { key: "pos", label: "+/− acc.", align: "right", render: (p) => <span className="text-wc-muted">{p.positiveActions}/{p.negativeActions}</span> },
  ];

  return (
    <div className="space-y-5">
      <InfoBox title="VAEP — Valuing Actions by Estimating Probabilities">
        VAEP mide el valor de cada acción durante el partido. Una acción es positiva si aumenta la probabilidad
        de que el equipo anote o reduce la probabilidad de recibir gol. Es útil para valorar jugadores que aportan
        mucho aunque no hagan goles ni asistencias. <span className="text-wc-text">VAEP = ΔP(anotar) − ΔP(conceder)</span>.
      </InfoBox>

      <InfoBox tone="warn">
        VAEP requiere eventos jugada por jugada. Si no hay datos de eventos disponibles desde 365Scores, este
        módulo queda preparado para recibir datos de StatsBomb Open Data u otra fuente especializada. Los valores
        mostrados son <strong>Demo data</strong>.
      </InfoBox>

      {/* Jugador destacado */}
      {selected ? (
        <div className="grid gap-5 lg:grid-cols-[5fr_7fr]">
          <div className="wc-card flex flex-col items-center gap-3 p-4 text-center">
            <RadialScore value={selected.vaepTotal} max={maxVaep} label="VAEP total" color="#D6B15E" />
            <div>
              <div className="text-lg font-semibold text-wc-text">{selected.name}</div>
              <div className="text-xs text-wc-muted">{selected.team} · {selected.minutes} min</div>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              <SourceBadge source={selected.source} />
              <ReliabilityBadge reliability={selected.reliability} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="VAEP ofensivo" value={num(selected.vaepOffensive)} accent="gold" />
              <MetricCard label="VAEP defensivo" value={num(selected.vaepDefensive)} accent="blue" />
              <MetricCard label="VAEP / 90" value={num(selected.vaepPer90)} accent="green" />
              <MetricCard label="Pases progresivos" value={`${selected.progressivePasses}`} />
              <MetricCard label="Recuperaciones" value={`${selected.recoveries}`} />
              <MetricCard label="Pérdidas peligrosas" value={`${selected.dangerousLosses}`} accent="red" />
            </div>
            <div className="wc-card p-4">
              <SectionHeading title="VAEP ofensivo vs defensivo" />
              <div className="space-y-2">
                <StatBar label="Ofensivo" value={selected.vaepOffensive} max={maxVaep} display={num(selected.vaepOffensive)} color="bg-wc-gold/70" />
                <StatBar label="Defensivo" value={selected.vaepDefensive} max={maxVaep} display={num(selected.vaepDefensive)} color="bg-wc-blue/70" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Timeline de acciones */}
      <div className="wc-card p-4">
        <SectionHeading title="Timeline de acciones con valor" subtitle="Acción por acción (jugador demo: A. Mac Allister)." right={<SourceBadge source="Demo" />} />
        <VAEPActionTimeline actions={MOCK_VAEP_ACTIONS} />
      </div>

      {/* Ranking */}
      <div>
        <SectionHeading title="Ranking de jugadores por VAEP" subtitle="Click en un nombre para ver su detalle." />
        <PlayerRankingTable columns={columns} rows={ranked} rowKey={(p) => p.playerId} highlightTop={3} />
      </div>

      {/* Comparación VAEP/90 */}
      <div className="wc-card p-4">
        <SectionHeading title="Comparación VAEP por 90 minutos" />
        <div className="space-y-2">
          {ranked.map((p) => (
            <StatBar key={p.playerId} label={p.name} value={p.vaepPer90} max={maxPer90} display={num(p.vaepPer90)} color="bg-wc-green/70" />
          ))}
        </div>
      </div>
    </div>
  );
}
