// =====================================================================
// fifaRankings.ts — ranking FIFA de las 48 selecciones como dataset dedicado.
//
// FUENTE ÚNICA DE VERDAD: WORLD_CUP_TEAMS (worldcup-teams.ts). Aquí se proyecta
// a la forma { team, fifaRank, confederation, ... } que consume la capa de
// fuerza. El ranking es aproximado (placeholder actualizable); cuando se
// conecte un feed oficial, actualizar worldcup-teams.ts y este módulo lo refleja.
// =====================================================================

import { WORLD_CUP_TEAMS } from "@/data/worldcup-teams";
import type { Confederation } from "@/lib/data-providers/types";

export const RANKING_LAST_UPDATED = "2026-06-19";
export const RANKING_SOURCE = "World Cup 2026 internal dataset (aprox.)";
export const RANKING_NOTE =
  "Ranking FIFA aproximado (placeholder). Alimenta priors de fuerza; no es un feed oficial conectado.";

export interface FifaRankingEntry {
  teamId: string;
  team: string;
  fifaCode: string;
  fifaRank: number;
  fifaPoints: number | null;
  confederation: Confederation;
  lastUpdated: string;
  source: string;
}

export const FIFA_RANKINGS: FifaRankingEntry[] = WORLD_CUP_TEAMS.map((t) => ({
  teamId: t.id,
  team: t.name,
  fifaCode: t.code,
  fifaRank: t.fifaRanking,
  fifaPoints: null, // sin feed oficial de puntos; el rank alimenta la fuerza
  confederation: t.confederation,
  lastUpdated: RANKING_LAST_UPDATED,
  source: RANKING_SOURCE,
})).sort((a, b) => a.fifaRank - b.fifaRank);

const BY_ID = new Map(FIFA_RANKINGS.map((r) => [r.teamId, r]));

export function getFifaRanking(teamId: string): FifaRankingEntry | undefined {
  return BY_ID.get(teamId);
}
