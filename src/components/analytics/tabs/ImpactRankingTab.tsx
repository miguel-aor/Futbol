"use client";

import { useMemo } from "react";
import { MOCK_VAEP_SUMMARIES } from "@/data/footballAnalyticsMock";
import type { VAEPPlayerSummary } from "@/lib/analytics/types";
import { InfoBox, MetricCard, RadialScore, SectionHeading, SourceBadge, num } from "../primitives";
import { PlayerRankingTable, type Column } from "../PlayerRankingTable";

interface ImpactRow extends VAEPPlayerSummary {
  impactScore: number;
  actionEfficiency: number;
}

export function ImpactRankingTab() {
  const rows = useMemo<ImpactRow[]>(() => {
    const maxPer90 = Math.max(...MOCK_VAEP_SUMMARIES.map((p) => p.vaepPer90), 0.01);
    return MOCK_VAEP_SUMMARIES.map((p) => {
      const efficiency = p.positiveActions / (p.positiveActions + p.negativeActions);
      // Impacto = 70% VAEP/90 normalizado + 30% eficiencia de acciones.
      const impactScore = Math.round((0.7 * (p.vaepPer90 / maxPer90) + 0.3 * efficiency) * 100);
      return { ...p, impactScore, actionEfficiency: efficiency };
    }).sort((a, b) => b.impactScore - a.impactScore);
  }, []);

  const top3 = rows.slice(0, 3);

  const columns: Column<ImpactRow>[] = [
    { key: "rank", label: "#", render: (_p, i) => <span className="text-wc-muted">{i + 1}</span> },
    { key: "name", label: "Jugador", render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "team", label: "Equipo", render: (p) => <span className="text-wc-muted">{p.team}</span> },
    { key: "pos", label: "Pos.", render: (p) => p.position },
    { key: "impact", label: "Impacto", align: "right", render: (p) => <span className="font-bold text-wc-gold">{p.impactScore}</span> },
    { key: "vaep90", label: "VAEP/90", align: "right", render: (p) => num(p.vaepPer90) },
    { key: "eff", label: "Efic. acc.", align: "right", render: (p) => `${Math.round(p.actionEfficiency * 100)}%` },
  ];

  return (
    <div className="space-y-5">
      <InfoBox title="Ranking de impacto">
        Combina el VAEP por 90 minutos con la eficiencia de acciones (positivas vs negativas) para estimar el
        impacto global de cada jugador en el juego, más allá de goles y asistencias.
      </InfoBox>

      <div className="grid gap-4 sm:grid-cols-3">
        {top3.map((p, i) => (
          <div key={p.playerId} className="wc-card flex items-center gap-4 p-4">
            <RadialScore value={p.impactScore} label={`#${i + 1}`} size={76} />
            <div className="min-w-0">
              <div className="truncate font-semibold text-wc-text">{p.name}</div>
              <div className="text-xs text-wc-muted">{p.team} · {p.position}</div>
              <div className="mt-1 text-xs text-wc-gold">VAEP/90 {num(p.vaepPer90)}</div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <SectionHeading title="Ranking de impacto global" right={<SourceBadge source="Demo" />} />
        <PlayerRankingTable columns={columns} rows={rows} rowKey={(p) => p.playerId} highlightTop={3} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Mayor impacto" value={rows[0]?.name ?? "—"} accent="gold" hint={`Score ${rows[0]?.impactScore}`} />
        <MetricCard label="Más eficiente" value={[...rows].sort((a, b) => b.actionEfficiency - a.actionEfficiency)[0]?.name ?? "—"} accent="green" />
        <MetricCard label="Jugadores evaluados" value={`${rows.length}`} />
      </div>
    </div>
  );
}
