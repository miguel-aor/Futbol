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
  type MatchContext,
} from "./importedOddsProvider";
import type { OddsFeedSelection, OddsProviderInfo } from "./types";

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

/** Validación mínima de una selección de feed. */
export function validateOddsSelection(s: OddsFeedSelection): boolean {
  return Boolean(s.matchId) && Number.isFinite(s.americanOdds) && s.americanOdds !== 0;
}

/** Convierte un feed de momios en BetSelections evaluadas por el modelo. */
export function convertOddsFeedToBetSelections(
  feed: OddsFeedSelection[],
  resolveParams: (matchId: string) => MatchContext | null,
): { selections: BetSelection[]; warnings: string[] } {
  return importOddsAsSelections(feed.filter(validateOddsSelection), resolveParams);
}

/** Value picks a partir de un feed: evalúa + ordena por valor. */
export function calculateValuePicksFromOddsFeed(
  feed: OddsFeedSelection[],
  resolveParams: (matchId: string) => MatchContext | null,
): { picks: BetSelection[]; warnings: string[] } {
  const { selections, warnings } = convertOddsFeedToBetSelections(feed, resolveParams);
  return { picks: rankBestValuePicks(selections), warnings };
}
