"use client";

import { useMemo } from "react";
import { MOCK_PLAYERS } from "@/data/footballAnalyticsMock";
import { normalizePer90 } from "@/lib/scoutingModels";
import type { Player } from "@/lib/analytics/types";
import { InfoBox, MetricCard, SectionHeading, SourceBadge, StatBar, num } from "../primitives";
import { PlayerRankingTable, type Column } from "../PlayerRankingTable";

export function PlayerXGTab() {
  const players = useMemo(
    () => [...MOCK_PLAYERS].sort((a, b) => b.xG - a.xG),
    [],
  );
  const maxXg = Math.max(...players.map((p) => p.xG), 0.01);

  const topOver = [...players].sort((a, b) => b.goals - b.xG - (a.goals - a.xG))[0];
  const topUnder = [...players].sort((a, b) => a.goals - a.xG - (b.goals - b.xG))[0];

  const columns: Column<Player>[] = [
    { key: "rank", label: "#", render: (_p, i) => <span className="text-wc-muted">{i + 1}</span> },
    { key: "name", label: "Jugador", render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "team", label: "Equipo", render: (p) => <span className="text-wc-muted">{p.team}</span> },
    { key: "min", label: "Min", align: "right", render: (p) => p.minutes },
    { key: "goals", label: "Goles", align: "right", render: (p) => p.goals },
    { key: "xg", label: "xG", align: "right", render: (p) => <span className="font-semibold text-wc-gold">{num(p.xG)}</span> },
    { key: "xa", label: "xA", align: "right", render: (p) => num(p.xA) },
    {
      key: "diff",
      label: "G − xG",
      align: "right",
      render: (p) => (
        <span className={p.goals - p.xG >= 0 ? "text-wc-green" : "text-wc-red"}>
          {p.goals - p.xG >= 0 ? "+" : ""}
          {num(p.goals - p.xG)}
        </span>
      ),
    },
    { key: "xg90", label: "xG/90", align: "right", render: (p) => num(normalizePer90(p.xG, p.minutes)) },
  ];

  return (
    <div className="space-y-5">
      <InfoBox title="xG por jugador">
        Compara los goles reales de cada jugador con su xG acumulado. Una diferencia positiva (G − xG &gt; 0)
        sugiere eficiencia o buena definición; negativa, mala racha o definición por debajo de lo esperado.
      </InfoBox>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Máximo xG" value={num(players[0]?.xG ?? 0)} accent="gold" hint={players[0]?.name} />
        <MetricCard label="Mayor sobre-rendimiento" value={`+${num((topOver?.goals ?? 0) - (topOver?.xG ?? 0))}`} accent="green" hint={topOver?.name} />
        <MetricCard label="Mayor bajo-rendimiento" value={num((topUnder?.goals ?? 0) - (topUnder?.xG ?? 0))} accent="red" hint={topUnder?.name} />
      </div>

      <div>
        <SectionHeading title="Ranking xG por jugador" right={<SourceBadge source="Demo" />} />
        <PlayerRankingTable columns={columns} rows={players} rowKey={(p) => p.id} highlightTop={3} />
      </div>

      <div className="wc-card p-4">
        <SectionHeading title="xG acumulado" />
        <div className="space-y-2">
          {players.map((p) => (
            <StatBar key={p.id} label={p.name} value={p.xG} max={maxXg} display={num(p.xG)} />
          ))}
        </div>
      </div>
    </div>
  );
}
