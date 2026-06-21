// =====================================================================
// bettable.ts — filtro CENTRAL de elegibilidad para apostar.
//
// Una sola fuente de verdad para "¿este partido/pick puede generar apuestas?".
// La usan Inicio, Value Picks, Bet Builder, AI Parlay y el ticket. Un partido
// finalizado alimenta modelo/historial/standings pero NO genera picks nuevas.
// =====================================================================

import { computeWorldCupMatches } from "@/lib/worldcup-2026/tournament-form";
import { isMatchEligibleForPicks, SIMULATED_NOW } from "./eligibility";
import { DEMO_MATCH_ID } from "@/data/betBuilderMock";

/** El demo (USA vs Australia, ya jugado) solo aparece en modo demo explícito. */
export function isDemoEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_DEMO_DATA === "true";
}

interface IdxEntry {
  kickoff: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
}
let idx: Map<string, IdxEntry> | null = null;
function matchIndex(): Map<string, IdxEntry> {
  if (!idx) {
    idx = new Map(
      computeWorldCupMatches().map((m) => [m.id, { kickoff: m.kickoff, status: m.status, homeScore: m.homeScore, awayScore: m.awayScore }]),
    );
  }
  return idx;
}

/** ¿El partido (por id) es apostable: próximo, no finalizado, no demo? */
export function isBettableMatchId(matchId: string, now: number = SIMULATED_NOW): boolean {
  if (!matchId) return false;
  if (matchId === DEMO_MATCH_ID) return isDemoEnabled();
  const m = matchIndex().get(matchId);
  if (!m) return false; // fuera del calendario interno → no apostable
  return isMatchEligibleForPicks({ kickoff: m.kickoff, status: m.status, homeScore: m.homeScore, awayScore: m.awayScore }, now);
}

/** Filtra una lista de selecciones/picks a solo las apostables. */
export function filterBettable<T extends { matchId: string }>(items: T[], now: number = SIMULATED_NOW): T[] {
  return items.filter((i) => isBettableMatchId(i.matchId, now));
}
