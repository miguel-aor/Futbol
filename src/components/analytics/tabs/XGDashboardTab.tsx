"use client";

import { useMemo } from "react";
import { FEATURED_MATCH_ID, MOCK_MATCHES, MOCK_SHOTS } from "@/data/footballAnalyticsMock";
import type { Shot } from "@/lib/analytics/types";
import {
  InfoBox,
  MetricCard,
  SectionHeading,
  SourceBadge,
  StatBar,
  num,
} from "../primitives";
import { ShotMap } from "../ShotMap";
import { PlayerRankingTable, type Column } from "../PlayerRankingTable";

interface TeamAgg {
  teamId: string;
  shots: number;
  goals: number;
  xg: number;
  xgPerShot: number;
  bestChance: number;
}

interface PlayerAgg {
  playerId: string;
  name: string;
  shots: number;
  goals: number;
  xg: number;
  diff: number;
}

function aggregateTeams(shots: Shot[]): TeamAgg[] {
  const byTeam = new Map<string, Shot[]>();
  for (const s of shots) {
    byTeam.set(s.teamId, [...(byTeam.get(s.teamId) ?? []), s]);
  }
  return [...byTeam.entries()].map(([teamId, list]) => {
    const xg = list.reduce((a, s) => a + s.xg, 0);
    const goals = list.filter((s) => s.isGoal).length;
    return {
      teamId,
      shots: list.length,
      goals,
      xg,
      xgPerShot: xg / list.length,
      bestChance: Math.max(...list.map((s) => s.xg)),
    };
  });
}

function aggregatePlayers(shots: Shot[]): PlayerAgg[] {
  const byPlayer = new Map<string, Shot[]>();
  for (const s of shots) {
    byPlayer.set(s.playerId, [...(byPlayer.get(s.playerId) ?? []), s]);
  }
  return [...byPlayer.entries()]
    .map(([playerId, list]) => {
      const xg = list.reduce((a, s) => a + s.xg, 0);
      const goals = list.filter((s) => s.isGoal).length;
      return { playerId, name: list[0].playerName, shots: list.length, goals, xg, diff: goals - xg };
    })
    .sort((a, b) => b.xg - a.xg);
}

export function XGDashboardTab() {
  const match = MOCK_MATCHES.find((m) => m.id === FEATURED_MATCH_ID)!;
  const teams = useMemo(() => aggregateTeams(MOCK_SHOTS), []);
  const players = useMemo(() => aggregatePlayers(MOCK_SHOTS), []);

  const home = teams.find((t) => t.teamId === match.homeTeamId)!;
  const away = teams.find((t) => t.teamId === match.awayTeamId)!;

  // xG por zona (a lo largo de la cancha).
  const zones = useMemo(() => {
    const buckets = { Cerca: 0, Media: 0, Lejos: 0 };
    for (const s of MOCK_SHOTS) {
      if (s.x >= 88) buckets.Cerca += s.xg;
      else if (s.x >= 80) buckets.Media += s.xg;
      else buckets.Lejos += s.xg;
    }
    return buckets;
  }, []);
  const maxZone = Math.max(...Object.values(zones), 0.01);

  const columns: Column<PlayerAgg>[] = [
    { key: "name", label: "Jugador", render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "shots", label: "Tiros", align: "right", render: (p) => p.shots },
    { key: "goals", label: "Goles", align: "right", render: (p) => p.goals },
    { key: "xg", label: "xG", align: "right", render: (p) => <span className="font-semibold text-wc-gold">{num(p.xg)}</span> },
    {
      key: "diff",
      label: "G − xG",
      align: "right",
      render: (p) => (
        <span className={p.diff >= 0 ? "text-wc-green" : "text-wc-red"}>
          {p.diff >= 0 ? "+" : ""}
          {num(p.diff)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <InfoBox title="Expected Goals (xG)">
        El xG estima la probabilidad de que un tiro termine en gol según factores como distancia, ángulo, tipo
        de asistencia, parte del cuerpo y ubicación del disparo. Sirve para evaluar si un equipo generó ocasiones
        de calidad, aunque el resultado final haya sido diferente.
      </InfoBox>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-wc-muted">
          Partido destacado: <span className="font-semibold text-wc-text">{match.homeTeamName} {match.homeGoals}-{match.awayGoals} {match.awayTeamName}</span>
        </div>
        <SourceBadge source="Demo" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label={`xG ${match.homeTeamName}`} value={num(home.xg)} accent="gold" hint={`${home.goals} goles reales`} />
        <MetricCard label={`xG ${match.awayTeamName}`} value={num(away.xg)} accent="blue" hint={`${away.goals} goles reales`} />
        <MetricCard label="xG concedido (local)" value={num(away.xg)} hint="= xG del rival" />
        <MetricCard label="Diferencia G − xG (local)" value={`${home.goals - home.xg >= 0 ? "+" : ""}${num(home.goals - home.xg)}`} accent={home.goals - home.xg >= 0 ? "green" : "red"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="wc-card p-4">
          <SectionHeading title="Shot map" subtitle={`${match.homeTeamName} (dorado) vs ${match.awayTeamName} (azul)`} />
          <ShotMap shots={MOCK_SHOTS} homeTeamId={match.homeTeamId} />
        </div>

        <div className="space-y-4">
          <div className="wc-card p-4">
            <SectionHeading title="Eficiencia por equipo" />
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label={`${match.homeTeamName} · xG/tiro`} value={num(home.xgPerShot)} />
              <MetricCard label={`${match.awayTeamName} · xG/tiro`} value={num(away.xgPerShot)} />
              <MetricCard label="Tiros local" value={`${home.shots}`} />
              <MetricCard label="Tiros visita" value={`${away.shots}`} />
              <MetricCard label="Mejor ocasión local" value={num(home.bestChance)} accent="gold" />
              <MetricCard label="Mejor ocasión visita" value={num(away.bestChance)} accent="blue" />
            </div>
          </div>

          <div className="wc-card p-4">
            <SectionHeading title="xG por zona" subtitle="Suma de xG según distancia a portería." />
            <div className="space-y-2">
              {Object.entries(zones).map(([z, v]) => (
                <StatBar key={z} label={z} value={v} max={maxZone} display={num(v)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <SectionHeading title="xG por jugador (partido)" subtitle="Goles reales vs calidad de oportunidades." />
        <PlayerRankingTable columns={columns} rows={players} rowKey={(p) => p.playerId} />
      </div>
    </div>
  );
}
