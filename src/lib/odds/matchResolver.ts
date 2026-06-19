// =====================================================================
// matchResolver.ts — resuelve momios importados (CSV/JSON/screenshots) a un
// partido interno del fixture del Mundial.
//
// Los feeds manuales traen IDs heterogéneos: IDs numéricos del proveedor
// (capturas PlayDoit), IDs canónicos internos (wc-C-3) o solo los nombres de
// los equipos. Este helper intenta varias estrategias en orden y NUNCA debe
// caer silenciosamente a un modelo neutral: si no resuelve, se marca unmatched.
// =====================================================================

import { WORLD_CUP_TEAMS } from "@/data/worldcup-teams";
import type { WorldCupMatch } from "@/lib/worldcup-2026/types";
import type { OddsFeedSelection } from "./types";

// ---------------------------------------------------------------------
// Mapa explícito de IDs de proveedor → matchId interno canónico.
// Origen: capturas PlayDoit que el usuario compartió (jornada 19 jun 2026).
// Es un atajo; igualmente se valida que el matchId interno exista en el fixture.
// ---------------------------------------------------------------------
export const IMPORTED_MATCH_ID_ALIASES: Record<string, string> = {
  "66456944": "wc-D-3", // Estados Unidos vs Australia
  "66456934": "wc-C-3", // Escocia vs Marruecos
  "66456946": "wc-D-4", // Turquía vs Paraguay
  "66456932": "wc-C-4", // Brasil vs Haití
};

// ---------------------------------------------------------------------
// Alias de nombres de equipo (español / inglés / código / abreviaturas).
// La clave es el teamId interno; los valores se normalizan al construir el mapa.
// ---------------------------------------------------------------------
const EXTRA_TEAM_ALIASES: Record<string, string[]> = {
  usa: ["estados unidos", "usa", "united states", "ee uu", "eeuu", "us", "estados unidos de america"],
  aus: ["australia", "aus"],
  sco: ["escocia", "scotland", "sco"],
  mar: ["marruecos", "morocco", "mar"],
  tur: ["turquia", "turquía", "turkey", "turkiye", "türkiye", "tur"],
  par: ["paraguay", "par"],
  bra: ["brasil", "brazil", "bra"],
  hai: ["haiti", "haití", "hai", "hti"],
};

/** Normaliza un texto: minúsculas, sin acentos, sin signos, espacios colapsados. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Mapa normalizado (alias → teamId) construido desde el seed + alias extra.
const TEAM_ALIAS_MAP: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const t of WORLD_CUP_TEAMS) {
    map.set(normalizeText(t.id), t.id);
    map.set(normalizeText(t.name), t.id);
    if (t.code) map.set(normalizeText(t.code), t.id);
  }
  for (const [teamId, aliases] of Object.entries(EXTRA_TEAM_ALIASES)) {
    for (const a of aliases) map.set(normalizeText(a), teamId);
  }
  return map;
})();

/** Devuelve el teamId interno para un nombre/alias, o null si no se reconoce. */
export function normalizeTeamName(name: string | null | undefined): string | null {
  if (!name) return null;
  const norm = normalizeText(name);
  if (!norm) return null;
  // colapsa espacios internos a una sola pieza para coincidir con "ee uu"→"eeuu"
  return TEAM_ALIAS_MAP.get(norm) ?? TEAM_ALIAS_MAP.get(norm.replace(/\s+/g, "")) ?? null;
}

export type ResolveMethod =
  | "matchId"
  | "alias-map"
  | "teams"
  | "teams-swapped"
  | "kickoff"
  | "unmatched";

export interface ResolveResult {
  match: WorldCupMatch | null;
  method: ResolveMethod;
  /** El ID original del proveedor, preservado siempre. */
  externalMatchId: string;
}

/** Diferencia en horas entre dos ISO timestamps (Infinity si alguno falta). */
function hoursApart(a: string | null, b: string | null): number {
  if (!a || !b) return Infinity;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return Infinity;
  return Math.abs(ta - tb) / 3_600_000;
}

/**
 * Resuelve un momio importado a un partido interno. Intenta, en orden:
 *  1) matchId directo  2) alias de ID de proveedor  3) equipos normalizados
 *  4) equipos invertidos  5) kickoff cercano (≤ 6 h).
 */
export function resolveImportedMatch(
  odd: Pick<OddsFeedSelection, "matchId" | "externalMatchId" | "homeTeam" | "awayTeam" | "kickoff">,
  internalMatches: WorldCupMatch[],
): ResolveResult {
  const externalMatchId = odd.externalMatchId ?? odd.matchId ?? "";

  // 1) matchId directo (ya viene canónico, p. ej. wc-C-3).
  const direct = internalMatches.find((m) => m.id === odd.matchId);
  if (direct) return { match: direct, method: "matchId", externalMatchId };

  // 2) alias de ID de proveedor (numérico → wc-*).
  const aliased = IMPORTED_MATCH_ID_ALIASES[odd.matchId] ?? IMPORTED_MATCH_ID_ALIASES[externalMatchId];
  if (aliased) {
    const m = internalMatches.find((mm) => mm.id === aliased);
    if (m) return { match: m, method: "alias-map", externalMatchId };
  }

  // 3) y 4) por equipos normalizados (directo e invertido).
  const home = normalizeTeamName(odd.homeTeam);
  const away = normalizeTeamName(odd.awayTeam);
  if (home && away) {
    const exact = internalMatches.find((m) => m.homeId === home && m.awayId === away);
    if (exact) return { match: exact, method: "teams", externalMatchId };
    const swapped = internalMatches.find((m) => m.homeId === away && m.awayId === home);
    if (swapped) return { match: swapped, method: "teams-swapped", externalMatchId };
  }

  // 5) kickoff cercano (último recurso, requiere timestamp del feed).
  if (odd.kickoff) {
    const near = internalMatches
      .map((m) => ({ m, dist: hoursApart(odd.kickoff, m.kickoff) }))
      .filter((x) => x.dist <= 6)
      .sort((a, b) => a.dist - b.dist)[0];
    if (near) return { match: near.m, method: "kickoff", externalMatchId };
  }

  return { match: null, method: "unmatched", externalMatchId };
}
