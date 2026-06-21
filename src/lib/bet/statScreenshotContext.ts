// =====================================================================
// statScreenshotContext.ts — acceso al contexto reciente (stats 365Scores) por
// partido. Resuelve matchId → equipos del fixture y adjunta el último partido
// de cada uno. Sin datos → hasContext=false (el modelo usa solo la base).
// =====================================================================

import { computeWorldCupMatches } from "@/lib/worldcup-2026/tournament-form";
import { getRecentStatsByTeam, type TeamRecentMatchStats } from "@/data/todayMatchContextStats";

export interface TodayMatchContext {
  matchId: string;
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  homeStats: TeamRecentMatchStats | null;
  awayStats: TeamRecentMatchStats | null;
  hasContext: boolean;
  source: string;
  sampleSize: number;
}

let fixtureIndex: Map<string, { homeId: string; awayId: string; homeName: string; awayName: string }> | null = null;
function index() {
  if (!fixtureIndex) {
    fixtureIndex = new Map(
      computeWorldCupMatches().map((m) => [m.id, { homeId: m.homeId, awayId: m.awayId, homeName: m.homeName, awayName: m.awayName }]),
    );
  }
  return fixtureIndex;
}

export function getPreviousMatchStatsForTeam(teamId: string): TeamRecentMatchStats | null {
  return getRecentStatsByTeam(teamId);
}

/** Contexto reciente de un partido (último juego de cada selección). */
export function getTodayMatchContext(matchId: string): TodayMatchContext | null {
  const fx = index().get(matchId);
  if (!fx) return null;
  const homeStats = getRecentStatsByTeam(fx.homeId);
  const awayStats = getRecentStatsByTeam(fx.awayId);
  return {
    matchId,
    homeId: fx.homeId,
    awayId: fx.awayId,
    homeName: fx.homeName,
    awayName: fx.awayName,
    homeStats,
    awayStats,
    hasContext: Boolean(homeStats || awayStats),
    source: "365Scores screenshot",
    sampleSize: 1,
  };
}
