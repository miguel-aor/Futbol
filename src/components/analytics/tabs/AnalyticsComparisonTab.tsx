"use client";

import { useState } from "react";
import { MOCK_SCOUTING_PLAYERS, MOCK_TEAMS } from "@/data/footballAnalyticsMock";
import { calculatePlayerComparison, normalizePer90 } from "@/lib/scoutingModels";
import { eloMatchProbabilities } from "@/lib/footballModels";
import type { ScoutingPlayer, Team } from "@/lib/analytics/types";
import {
  Field,
  FormDots,
  InfoBox,
  ProbabilityBar,
  SectionHeading,
  Select,
  SourceBadge,
  TabNav,
} from "../primitives";
import { RadarChart } from "../RadarChart";

// Ejes del radar (multivariable). Mismo orden para jugadores y equipos.
const RADAR_AXES = [
  "Ataque",
  "Finalización",
  "Creación",
  "Progresión",
  "Defensa",
  "Riesgo",
  "Forma",
];

const COLOR_A = "#E7C77C"; // dorado
const COLOR_B = "#2563EB"; // azul

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, v));
}

/** Perfil radar (0-100) de un jugador en los 7 ejes. */
function playerRadar(p: ScoutingPlayer): number[] {
  const per90 = (v: number) => normalizePer90(v, p.minutes);
  return [
    clamp((per90(p.xG) / 0.7) * 100), // Ataque (amenaza de gol)
    clamp(50 + (p.goals - p.xG) * 45), // Finalización (vs xG)
    clamp((per90(p.xA) / 0.5) * 100), // Creación
    clamp((per90(p.progressivePasses) / 9) * 100), // Progresión
    clamp(((per90(p.tacklesWon) / 4 + per90(p.interceptions) / 4) / 2) * 100), // Defensa
    clamp(p.riskScore), // Riesgo (más alto = más riesgo)
    clamp(((p.rating365 - 5.5) / 4) * 100), // Forma / nivel
  ];
}

/** Perfil radar (0-100) de un equipo en los 7 ejes. */
function teamRadar(t: Team): number[] {
  const formScore =
    (t.recentForm.reduce((s, r) => s + (r === "W" ? 3 : r === "D" ? 1 : 0), 0) /
      (t.recentForm.length * 3)) *
    100;
  return [
    clamp(t.offensiveRating), // Ataque
    clamp((t.goalsForAvg / 3) * 100), // Finalización
    clamp((t.goalsForAvg / 2.6) * 100), // Creación
    clamp(((t.eloRating - 1850) / 300) * 100), // Progresión
    clamp(t.defensiveRating), // Defensa
    clamp((t.goalsAgainstAvg / 2) * 100), // Riesgo (más goles en contra = más riesgo)
    clamp(formScore), // Forma
  ];
}

export function AnalyticsComparisonTab() {
  const [mode, setMode] = useState("teams");

  return (
    <div className="space-y-5">
      <InfoBox title="Comparador">
        Compara dos equipos o dos jugadores lado a lado. El radar muestra el perfil multivariable —ataque,
        finalización, creación, progresión, defensa, riesgo y forma— y abajo se listan las métricas exactas.
        <span className="mt-1 block text-[11px] text-wc-muted/80">
          Nota: en el eje <strong>Riesgo</strong>, un valor más alto significa más riesgo (no es “mejor”).
        </span>
      </InfoBox>
      <TabNav
        tabs={[
          { key: "teams", label: "Comparar equipos" },
          { key: "players", label: "Comparar jugadores" },
        ]}
        active={mode}
        onChange={setMode}
        variant="sub"
        label="Modo de comparación"
      />
      {mode === "teams" ? <TeamCompare /> : <PlayerCompare />}
    </div>
  );
}

/** Radar + tabla de valores de los 7 ejes (labels claros, no solo visual). */
function RadarBlock({
  nameA,
  nameB,
  valsA,
  valsB,
}: {
  nameA: string;
  nameB: string;
  valsA: number[];
  valsB: number[];
}) {
  return (
    <div className="wc-card p-4">
      <SectionHeading title="Perfil multivariable (radar)" right={<SourceBadge source="Demo" />} />
      <RadarChart
        axes={RADAR_AXES}
        series={[
          { name: nameA, color: COLOR_A, values: valsA },
          { name: nameB, color: COLOR_B, values: valsB },
        ]}
        ariaSummary={`Radar comparando ${nameA} y ${nameB} en ${RADAR_AXES.join(", ")}. Valores de 0 a 100.`}
      />
      <div className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {RADAR_AXES.map((axis, i) => {
          const a = Math.round(valsA[i]);
          const b = Math.round(valsB[i]);
          const isRisk = axis === "Riesgo";
          const aWins = isRisk ? a < b : a > b;
          const bWins = isRisk ? b < a : b > a;
          return (
            <div key={axis} className="grid grid-cols-3 items-center gap-1 border-t border-white/[0.06] py-1.5 text-sm">
              <span className={`text-right font-semibold tabular-nums ${aWins ? "text-wc-green" : "text-wc-text"}`}>{a}</span>
              <span className="text-center text-xs text-wc-muted">{axis}</span>
              <span className={`text-left font-semibold tabular-nums ${bWins ? "text-wc-green" : "text-wc-text"}`}>{b}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamCompare() {
  const [aId, setAId] = useState("arg");
  const [bId, setBId] = useState("fra");
  const a = MOCK_TEAMS.find((t) => t.id === aId)!;
  const b = MOCK_TEAMS.find((t) => t.id === bId)!;
  const probs = eloMatchProbabilities(a.eloRating, b.eloRating, 0);

  const rows: Array<{ label: string; a: number; b: number; better: "high" | "low" }> = [
    { label: "Rating Elo/SPI", a: Math.round(a.eloRating), b: Math.round(b.eloRating), better: "high" },
    { label: "Rating ofensivo", a: a.offensiveRating, b: b.offensiveRating, better: "high" },
    { label: "Rating defensivo", a: a.defensiveRating, b: b.defensiveRating, better: "high" },
    { label: "Goles a favor (prom.)", a: a.goalsForAvg, b: b.goalsForAvg, better: "high" },
    { label: "Goles en contra (prom.)", a: a.goalsAgainstAvg, b: b.goalsAgainstAvg, better: "low" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Equipo A">
          <Select value={aId} onChange={setAId} options={MOCK_TEAMS.map((t) => ({ value: t.id, label: t.name }))} />
        </Field>
        <Field label="Equipo B">
          <Select value={bId} onChange={setBId} options={MOCK_TEAMS.map((t) => ({ value: t.id, label: t.name }))} />
        </Field>
      </div>

      <RadarBlock nameA={a.name} nameB={b.name} valsA={teamRadar(a)} valsB={teamRadar(b)} />

      <div className="wc-card p-4">
        <SectionHeading title="Probabilidad en campo neutral" right={<SourceBadge source="Demo" />} />
        <ProbabilityBar
          segments={[
            { label: a.name, value: probs.homeWin, color: "bg-wc-gold" },
            { label: "Empate", value: probs.draw, color: "bg-white/30" },
            { label: b.name, value: probs.awayWin, color: "bg-wc-blue" },
          ]}
        />
      </div>

      <div className="wc-card p-4">
        <div className="mb-3 grid grid-cols-3 items-center text-sm">
          <div className="text-center font-semibold text-wc-gold">{a.name}</div>
          <div className="text-center text-xs text-wc-muted">Métrica</div>
          <div className="text-center font-semibold text-wc-blue">{b.name}</div>
        </div>
        <div className="space-y-1">
          {rows.map((r) => {
            const aWins = r.better === "high" ? r.a > r.b : r.a < r.b;
            const bWins = r.better === "high" ? r.b > r.a : r.b < r.a;
            return (
              <div key={r.label} className="grid grid-cols-3 items-center border-t border-white/[0.06] py-2 text-sm">
                <div className={`text-center font-semibold tabular-nums ${aWins ? "text-wc-green" : "text-wc-text"}`}>{r.a}</div>
                <div className="text-center text-xs text-wc-muted">{r.label}</div>
                <div className={`text-center font-semibold tabular-nums ${bWins ? "text-wc-green" : "text-wc-text"}`}>{r.b}</div>
              </div>
            );
          })}
          <div className="grid grid-cols-3 items-center border-t border-white/[0.06] py-2">
            <div className="flex justify-center"><FormDots form={a.recentForm} /></div>
            <div className="text-center text-xs text-wc-muted">Forma</div>
            <div className="flex justify-center"><FormDots form={b.recentForm} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerCompare() {
  const [aId, setAId] = useState(MOCK_SCOUTING_PLAYERS[2].id);
  const [bId, setBId] = useState(MOCK_SCOUTING_PLAYERS[10].id);
  const a = MOCK_SCOUTING_PLAYERS.find((p) => p.id === aId)!;
  const b = MOCK_SCOUTING_PLAYERS.find((p) => p.id === bId)!;
  const rows = calculatePlayerComparison(a, b);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jugador A">
          <Select value={aId} onChange={setAId} options={MOCK_SCOUTING_PLAYERS.map((p) => ({ value: p.id, label: `${p.name} · ${p.team}` }))} />
        </Field>
        <Field label="Jugador B">
          <Select value={bId} onChange={setBId} options={MOCK_SCOUTING_PLAYERS.map((p) => ({ value: p.id, label: `${p.name} · ${p.team}` }))} />
        </Field>
      </div>

      <RadarBlock nameA={a.name} nameB={b.name} valsA={playerRadar(a)} valsB={playerRadar(b)} />

      <div className="wc-card p-4">
        <div className="mb-3 grid grid-cols-3 items-center text-sm">
          <div className="text-center font-semibold text-wc-gold">{a.name}</div>
          <div className="text-center text-xs text-wc-muted">Métrica</div>
          <div className="text-center font-semibold text-wc-blue">{b.name}</div>
        </div>
        <div className="space-y-1">
          {rows.map((r) => {
            const aWins = r.higherIsBetter ? r.a > r.b : r.a < r.b;
            const bWins = r.higherIsBetter ? r.b > r.a : r.b < r.a;
            return (
              <div key={r.label} className="grid grid-cols-3 items-center border-t border-white/[0.06] py-2 text-sm">
                <div className={`text-center font-semibold tabular-nums ${aWins ? "text-wc-green" : "text-wc-text"}`}>{r.a}</div>
                <div className="text-center text-xs text-wc-muted">{r.label}</div>
                <div className={`text-center font-semibold tabular-nums ${bWins ? "text-wc-green" : "text-wc-text"}`}>{r.b}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex justify-end">
          <SourceBadge source="Demo" />
        </div>
      </div>
    </div>
  );
}
