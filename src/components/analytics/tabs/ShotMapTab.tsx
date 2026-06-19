"use client";

import { useState } from "react";
import { FEATURED_MATCH_ID, MOCK_MATCHES, MOCK_SHOTS } from "@/data/footballAnalyticsMock";
import { InfoBox, MetricCard, SectionHeading, Select, SourceBadge, num } from "../primitives";
import { ShotMap } from "../ShotMap";
import { PlayerRankingTable, type Column } from "../PlayerRankingTable";
import type { Shot } from "@/lib/analytics/types";

const SITUATION_LABEL: Record<Shot["situation"], string> = {
  open_play: "Juego abierto",
  set_piece: "Balón parado",
  penalty: "Penal",
  corner: "Córner",
  fast_break: "Contragolpe",
};
const BODY_LABEL: Record<Shot["bodyPart"], string> = {
  left: "Pie izq.",
  right: "Pie der.",
  head: "Cabeza",
  other: "Otro",
};

export function ShotMapTab() {
  const match = MOCK_MATCHES.find((m) => m.id === FEATURED_MATCH_ID)!;
  const [filter, setFilter] = useState<"all" | string>("all");

  const shots =
    filter === "all" ? MOCK_SHOTS : MOCK_SHOTS.filter((s) => s.teamId === filter);
  const goals = shots.filter((s) => s.isGoal).length;
  const totalXg = shots.reduce((a, s) => a + s.xg, 0);

  const columns: Column<Shot>[] = [
    { key: "min", label: "Min", render: (s) => `${s.minute}'` },
    { key: "player", label: "Jugador", render: (s) => <span className="font-medium">{s.playerName}</span> },
    { key: "xg", label: "xG", align: "right", render: (s) => <span className="font-semibold text-wc-gold">{num(s.xg)}</span> },
    { key: "body", label: "Ejecución", render: (s) => BODY_LABEL[s.bodyPart] },
    { key: "sit", label: "Situación", render: (s) => SITUATION_LABEL[s.situation] },
    { key: "goal", label: "Resultado", align: "right", render: (s) => s.isGoal ? <span className="font-semibold text-wc-green">GOL</span> : <span className="text-wc-muted">—</span> },
  ];

  return (
    <div className="space-y-5">
      <InfoBox title="Shot Map">
        Cada disparo se ubica en la cancha; el tamaño del punto refleja su xG (probabilidad de gol). Permite ver
        de dónde y con qué calidad generó cada equipo sus ocasiones.
      </InfoBox>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Ambos equipos" },
            { value: match.homeTeamId, label: match.homeTeamName },
            { value: match.awayTeamId, label: match.awayTeamName },
          ]}
        />
        <SourceBadge source="Demo" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Tiros" value={`${shots.length}`} />
        <MetricCard label="Goles" value={`${goals}`} accent="green" />
        <MetricCard label="xG acumulado" value={num(totalXg)} accent="gold" />
      </div>

      <div className="wc-card p-4">
        <SectionHeading title={`Mapa de tiros · ${match.homeTeamName} ${match.homeGoals}-${match.awayGoals} ${match.awayTeamName}`} />
        <ShotMap shots={shots} homeTeamId={match.homeTeamId} />
      </div>

      <div>
        <SectionHeading title="Detalle de tiros" />
        <PlayerRankingTable columns={columns} rows={[...shots].sort((a, b) => a.minute - b.minute)} rowKey={(s) => s.id} />
      </div>
    </div>
  );
}
