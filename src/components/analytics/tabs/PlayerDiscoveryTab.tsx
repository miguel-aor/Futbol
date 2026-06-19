"use client";

import { useMemo, useState } from "react";
import { MOCK_SCOUTING_PLAYERS } from "@/data/footballAnalyticsMock";
import { rankScoutingPlayers } from "@/lib/scoutingModels";
import type { ScoutingFilters, ScoutingPlayer } from "@/lib/analytics/types";
import { InfoBox, SectionHeading, SourceBadge, num } from "../primitives";
import { ScoutingFiltersPanel } from "../ScoutingFilters";
import { PlayerRankingTable, type Column } from "../PlayerRankingTable";
import { PlayerProfileCard } from "../PlayerProfileCard";

const DEFAULT_FILTERS: ScoutingFilters = {
  query: "",
  league: "",
  position: "ALL",
  maxAge: 40,
  minMinutes: 0,
  minRating: 5,
  risk: "ALL",
};

const POS_LABEL: Record<ScoutingPlayer["position"], string> = {
  GK: "GK",
  DF: "DF",
  MF: "MF",
  FW: "FW",
};

function recommendation(p: ScoutingPlayer): { label: string; cls: string } {
  if (p.scoutingScore >= 70 && p.riskScore < 50) return { label: "Prioritario", cls: "text-wc-green" };
  if (p.scoutingScore >= 55) return { label: "Seguir", cls: "text-wc-gold" };
  return { label: "Monitorear", cls: "text-wc-muted" };
}

export function PlayerDiscoveryTab({
  shortlistIds,
  onAdd,
}: {
  shortlistIds: Set<string>;
  onAdd: (p: ScoutingPlayer) => void;
}) {
  const [filters, setFilters] = useState<ScoutingFilters>(DEFAULT_FILTERS);
  const leagues = useMemo(
    () => [...new Set(MOCK_SCOUTING_PLAYERS.map((p) => p.league))].sort(),
    [],
  );
  const results = useMemo(() => rankScoutingPlayers(MOCK_SCOUTING_PLAYERS, filters), [filters]);

  const columns: Column<ScoutingPlayer>[] = [
    { key: "rank", label: "#", render: (_p, i) => <span className="text-wc-muted">{i + 1}</span> },
    { key: "name", label: "Jugador", render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "age", label: "Edad", align: "right", render: (p) => p.age },
    { key: "pos", label: "Pos.", render: (p) => POS_LABEL[p.position] },
    { key: "team", label: "Equipo", render: (p) => <span className="text-wc-muted">{p.team}</span> },
    { key: "league", label: "Liga", render: (p) => <span className="text-wc-muted">{p.league}</span> },
    { key: "min", label: "Min", align: "right", render: (p) => p.minutes },
    { key: "rating", label: "Rating", align: "right", render: (p) => num(p.rating365, 1) },
    { key: "score", label: "Scouting", align: "right", render: (p) => <span className="font-bold text-wc-gold">{p.scoutingScore}</span> },
    { key: "rec", label: "Recom.", render: (p) => <span className={recommendation(p).cls}>{recommendation(p).label}</span> },
    {
      key: "add",
      label: "",
      align: "right",
      render: (p) => (
        <button
          type="button"
          onClick={() => onAdd(p)}
          disabled={shortlistIds.has(p.id)}
          className={`rounded px-2 py-1 text-xs font-semibold ${
            shortlistIds.has(p.id) ? "cursor-default text-wc-muted" : "bg-wc-gold/15 text-wc-gold hover:bg-wc-gold/25"
          }`}
        >
          {shortlistIds.has(p.id) ? "✓" : "+"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <InfoBox title="Player Discovery">
        Busca y filtra jugadores por nombre, liga, posición, edad, minutos, rating y nivel de riesgo. Los datos
        priorizan 365Scores; cuando una métrica no existe, se usa una fuente de fallback confiable.
      </InfoBox>

      <ScoutingFiltersPanel filters={filters} onChange={setFilters} leagues={leagues} />

      <div className="flex items-center justify-between">
        <SectionHeading title={`${results.length} jugadores encontrados`} subtitle="Ordenados por scouting score." />
        <SourceBadge source="Demo" />
      </div>

      <PlayerRankingTable columns={columns} rows={results} rowKey={(p) => p.id} highlightTop={3} />

      {results.length > 0 ? (
        <div>
          <SectionHeading title="Top perfiles" subtitle="Tarjetas de los mejores resultados." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.slice(0, 3).map((p) => (
              <PlayerProfileCard key={p.id} player={p} onAdd={onAdd} added={shortlistIds.has(p.id)} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
