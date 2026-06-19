// =====================================================================
// eligibility.ts — qué partidos son elegibles para generar picks.
//
// Regla: SOLO partidos por jugar (futuros, no finalizados). Los jugados se
// usan como histórico/forma para los modelos, pero NO aparecen como apostables
// en Value Picks, Bet Builder, AI Parlay ni en el ticket para nuevas picks.
//
// "Ahora" = hora simulada del entorno (REFERENCE_NOW_UTC), no el reloj real,
// para mantener consistencia con los datos del Mundial 2026.
//
// Fix "live falso": no confiamos en status:"Live" si el kickoff aún es futuro
// o si no hay fuente confiable de marcador en vivo.
// =====================================================================

import { REFERENCE_NOW_UTC } from "@/data/currentFootballMatches";

export type NormalizedStatus =
  | "scheduled"
  | "scheduled_unverified"
  | "live"
  | "finished"
  | "unverified";

export interface EligibilityMatch {
  kickoff: string;
  status?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  /** Marcar true solo si hay una fuente CONFIABLE de marcador en vivo. */
  liveVerified?: boolean;
}

const FINISHED_WORDS = ["finished", "complete", "finalized", "played", "ft", "result"];

export const SIMULATED_NOW = Date.parse(REFERENCE_NOW_UTC);

function hasFinalScore(m: EligibilityMatch): boolean {
  return m.homeScore != null && m.awayScore != null;
}

/** Normaliza el estado del partido de forma robusta (corrige live falso). */
export function normalizeMatchStatus(m: EligibilityMatch, now: number = SIMULATED_NOW): NormalizedStatus {
  const status = (m.status ?? "").toLowerCase();
  const kickoff = Date.parse(m.kickoff);

  if (hasFinalScore(m) || FINISHED_WORDS.some((w) => status.includes(w))) return "finished";
  if (Number.isNaN(kickoff)) return "unverified";

  const saysLive = status.includes("live") || status.includes("vivo");
  if (kickoff > now) {
    // Aún no empieza: si dice "live", es un live FALSO → sin verificar.
    return saysLive ? "scheduled_unverified" : "scheduled";
  }
  // Kickoff ya pasó:
  if (saysLive && m.liveVerified) return "live";
  return "unverified";
}

export function isMatchFinished(m: EligibilityMatch, now: number = SIMULATED_NOW): boolean {
  return normalizeMatchStatus(m, now) === "finished";
}

export function isMatchUpcoming(m: EligibilityMatch, now: number = SIMULATED_NOW): boolean {
  const k = Date.parse(m.kickoff);
  return !Number.isNaN(k) && k > now && !hasFinalScore(m);
}

/** ¿Se puede generar picks de este partido? (futuro y no finalizado). */
export function isMatchEligibleForPicks(
  m: EligibilityMatch,
  now: number = SIMULATED_NOW,
  includeLive = false,
): boolean {
  const s = normalizeMatchStatus(m, now);
  if (s === "finished" || s === "unverified") return false;
  if (s === "live") return includeLive;
  // scheduled / scheduled_unverified → elegible si el kickoff sigue en el futuro
  return Date.parse(m.kickoff) > now;
}

export interface UpcomingOptions {
  now?: number;
  limit?: number;
  includeLive?: boolean;
}

/** Próximos partidos elegibles, ordenados por kickoff asc, top `limit`. */
export function getUpcomingEligibleMatches<T extends EligibilityMatch>(
  matches: T[],
  options: UpcomingOptions = {},
): T[] {
  const now = options.now ?? SIMULATED_NOW;
  const limit = options.limit ?? 8;
  const includeLive = options.includeLive ?? false;
  return matches
    .filter((m) => isMatchEligibleForPicks(m, now, includeLive))
    .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff))
    .slice(0, limit);
}

/** Etiqueta corta de estado para badges (no usa "En vivo" si no se verifica). */
export function statusLabel(s: NormalizedStatus): string {
  switch (s) {
    case "scheduled":
      return "Programado";
    case "scheduled_unverified":
      return "Programado · sin verificar";
    case "live":
      return "En vivo";
    case "finished":
      return "Finalizado";
    case "unverified":
      return "Sin verificar";
  }
}
