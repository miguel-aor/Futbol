// =====================================================================
// scenarios.ts — escenarios de clasificación y contexto de partido.
//
// A partir de las posiciones (standings) estima, por equipo: presión por
// clasificar, riesgo de eliminación, necesidad de ganar, riesgo de rotación
// (equipo ya clasificado) y motivación. Estas señales dan CONTEXTO a Value
// Picks (no reemplazan el modelo base). Formato de grupos: 1º y 2º avanzan +
// mejores terceros (borde), sobre 3 partidos por equipo.
// =====================================================================

import { getStandingsByGroup, getTeamStanding } from "./standings";
import type { GroupId, GroupStanding } from "@/data/worldcup2026Standings";

const GROUP_MATCHES = 3;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export interface TeamScenario {
  teamId: string;
  teamName: string;
  group: GroupId;
  position: number;
  points: number;
  played: number;
  remaining: number;
  maxPoints: number;
  status: "qualified" | "eliminated" | "active";
  /** 0-1: necesidad de ganar este tramo para avanzar. */
  mustWinPressure: number;
  /** 0-1: riesgo de quedar fuera. */
  eliminationRisk: number;
  /** 0-1: riesgo de rotar titulares (ya clasificado / sin nada en juego). */
  rotationRisk: number;
  /** 0-1: motivación/intensidad esperada. */
  motivationScore: number;
  /** 0-1: presión global de clasificación. */
  qualificationPressure: number;
  summary: string;
}

function scenarioFromStanding(row: GroupStanding): TeamScenario {
  const remaining = Math.max(0, GROUP_MATCHES - row.played);
  const maxPoints = row.points + remaining * 3;
  const table = getStandingsByGroup(row.group);
  const secondPts = table[1]?.points ?? 0;
  const thirdPts = table[2]?.points ?? 0;

  // Estado refinado: clasificado (badge), eliminado (badge) o por puntos.
  const cannotReachTop2 = maxPoints < secondPts; // no alcanza ni al 2º
  const status: TeamScenario["status"] =
    row.status === "qualified" ? "qualified" : row.status === "eliminated" || cannotReachTop2 ? "eliminated" : "active";

  // Presión por ganar: peor si está fuera de zona (pos>2) con pocos partidos.
  const belowLine = row.position > 2;
  const gapToSecond = Math.max(0, secondPts - row.points);
  let mustWinPressure = 0;
  if (status === "qualified") mustWinPressure = 0.1;
  else if (status === "eliminated") mustWinPressure = 0.05;
  else mustWinPressure = clamp01((belowLine ? 0.5 : 0.25) + gapToSecond * 0.12 + (remaining <= 1 ? 0.25 : 0));

  // Riesgo de eliminación: alto si atrás, con pocos partidos y poco margen.
  let eliminationRisk = 0;
  if (status === "eliminated") eliminationRisk = 1;
  else if (status === "qualified") eliminationRisk = 0.02;
  else eliminationRisk = clamp01((row.position - 1) * 0.18 + gapToSecond * 0.1 + (remaining <= 1 ? 0.2 : 0) - (row.position <= 2 ? 0.15 : 0));

  // Riesgo de rotación: alto si ya clasificó con partidos por jugar, o si está
  // matemáticamente eliminado sin nada en juego.
  let rotationRisk = 0.1;
  if (status === "qualified" && remaining > 0) rotationRisk = clamp01(0.55 + (row.position === 1 ? 0.15 : 0));
  else if (status === "eliminated") rotationRisk = 0.45;
  else if (row.position <= 2 && remaining === 0) rotationRisk = 0.3;

  // Motivación/intensidad: alta si pelea por avanzar; baja si ya selló o sin nada.
  let motivationScore = 0.6;
  if (status === "qualified") motivationScore = clamp01(0.5 - (remaining > 0 ? 0.2 : 0));
  else if (status === "eliminated") motivationScore = 0.4;
  else motivationScore = clamp01(0.6 + mustWinPressure * 0.4);

  const qualificationPressure = clamp01(mustWinPressure * 0.6 + eliminationRisk * 0.4);

  const need =
    status === "qualified"
      ? `${row.teamName} ya está clasificado.`
      : status === "eliminated"
        ? `${row.teamName} está eliminado o sin opciones de top 2.`
        : belowLine
          ? `${row.teamName} está fuera de zona (${row.position}º) y necesita sumar para avanzar.`
          : `${row.teamName} está en zona de clasificación (${row.position}º) pero aún no asegura.`;
  const summary = `${need} ${row.points} pts, dif ${row.goalDifference >= 0 ? "+" : ""}${row.goalDifference}, ${remaining} partido(s) restante(s).`;

  return {
    teamId: row.teamId, teamName: row.teamName, group: row.group, position: row.position,
    points: row.points, played: row.played, remaining, maxPoints, status,
    mustWinPressure: round2(mustWinPressure), eliminationRisk: round2(eliminationRisk),
    rotationRisk: round2(rotationRisk), motivationScore: round2(motivationScore),
    qualificationPressure: round2(qualificationPressure), summary,
  };
}

const round2 = (v: number) => Number(v.toFixed(2));

// --- API por equipo ---------------------------------------------------

export function getTeamScenario(teamId: string): TeamScenario | null {
  const row = getTeamStanding(teamId);
  return row ? scenarioFromStanding(row) : null;
}
export function calculateMustWinPressure(teamId: string): number {
  return getTeamScenario(teamId)?.mustWinPressure ?? 0;
}
export function calculateRotationRisk(teamId: string): number {
  return getTeamScenario(teamId)?.rotationRisk ?? 0.1;
}
export function calculateMotivationScore(teamId: string): number {
  return getTeamScenario(teamId)?.motivationScore ?? 0.6;
}
export function calculateEliminationRisk(teamId: string): number {
  return getTeamScenario(teamId)?.eliminationRisk ?? 0;
}
export function calculateQualificationPressure(teamId: string): number {
  return getTeamScenario(teamId)?.qualificationPressure ?? 0;
}

// --- API por partido --------------------------------------------------

export interface MatchScenario {
  group: GroupId | null;
  home: TeamScenario | null;
  away: TeamScenario | null;
  /** 0-1: intensidad/presión combinada del partido. */
  matchPressure: number;
  /** Texto para la UI ("Contexto de grupo"). */
  context: string;
}

/** Escenario de un partido a partir de los ids (y grupo si se conoce). */
export function getMatchScenario(homeId: string, awayId: string): MatchScenario {
  const home = getTeamScenario(homeId);
  const away = getTeamScenario(awayId);
  const group = home?.group ?? away?.group ?? null;
  const matchPressure = round2(
    Math.max(home?.qualificationPressure ?? 0, away?.qualificationPressure ?? 0) * 0.6 +
      ((home?.motivationScore ?? 0.5) + (away?.motivationScore ?? 0.5)) / 2 * 0.4,
  );
  const context = [home?.summary, away?.summary].filter(Boolean).join(" ");
  return { group, home, away, matchPressure, context };
}
