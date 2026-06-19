// =====================================================================
// oddsProvider.ts (capa odds feed) — registro de proveedores y conversión de
// un feed de momios a Value Picks.
//
// PRIORIDAD de fuentes para Value Picks:
//   1) API autorizada  2) Imported CSV/JSON  3) Manual input  4) Demo
//
// Este proyecto NO hace scraping de casas de apuestas. Un feed real solo se
// conecta vía API oficial/proveedor autorizado.
// =====================================================================

import { rankBestValuePicks } from "@/lib/betBuilderModels";
import type { BetSelection } from "@/lib/bet/types";
import {
  importOddsAsSelections,
  type ImportOddsResult,
  type MatchContext,
} from "./importedOddsProvider";
import type { ImportMetrics, OddsFeedSelection, OddsProviderInfo, UnmatchedOdd } from "./types";

/** Proveedores disponibles y su estado. La API solo se habilita si hay base. */
export function getEnabledOddsProviders(): OddsProviderInfo[] {
  const apiBase = typeof process !== "undefined" ? process.env.ODDS_API_BASE_URL : undefined;
  return [
    { id: "manual", name: "Manual input", type: "manual", enabled: true, reliability: "medium", lastSync: null, notes: "Captura del usuario en Bet Builder." },
    { id: "imported", name: "Imported CSV/JSON", type: "imported", enabled: true, reliability: "medium", lastSync: null, notes: "Importación manual de momios." },
    { id: "demo", name: "Demo", type: "demo", enabled: true, reliability: "demo", lastSync: null, notes: "Datos de ejemplo." },
    {
      id: "api",
      name: process.env.ODDS_PROVIDER_NAME ?? "Authorized Odds API",
      type: "api",
      enabled: Boolean(apiBase),
      reliability: "high",
      lastSync: null,
      notes: apiBase ? "API autorizada conectada." : "No configurada (sin scraping).",
    },
  ];
}

/** Validación mínima de una selección de feed: momio válido y partido identificable
 *  (por matchId o por nombres de equipo, que el resolver intentará mapear). */
export function validateOddsSelection(s: OddsFeedSelection): boolean {
  const hasMatchRef = Boolean(s.matchId) || Boolean(s.homeTeam && s.awayTeam);
  return hasMatchRef && Number.isFinite(s.americanOdds) && s.americanOdds !== 0;
}

/** Convierte un feed de momios en BetSelections evaluadas por el modelo real. */
export function convertOddsFeedToBetSelections(
  feed: OddsFeedSelection[],
  resolveMatch: (odd: OddsFeedSelection) => MatchContext | null,
): ImportOddsResult {
  return importOddsAsSelections(feed.filter(validateOddsSelection), resolveMatch);
}

export interface ValuePicksFromFeed {
  picks: BetSelection[];
  warnings: string[];
  metrics: ImportMetrics;
  unmatched: UnmatchedOdd[];
}

/** Value picks a partir de un feed: resuelve partido, evalúa con modelo real y ordena. */
export function calculateValuePicksFromOddsFeed(
  feed: OddsFeedSelection[],
  resolveMatch: (odd: OddsFeedSelection) => MatchContext | null,
): ValuePicksFromFeed {
  const { selections, warnings, metrics, unmatched } = convertOddsFeedToBetSelections(feed, resolveMatch);
  return { picks: rankBestValuePicks(selections), warnings, metrics, unmatched };
}
