// =====================================================================
// importedOddsProvider.ts — importación de momios por CSV/JSON.
//
// Permite copiar/exportar momios desde una fuente externa SIN scraping
// automático. Valida, convierte a decimal/implícita y marca la fuente como
// "Imported CSV" / "Imported JSON". Funciones puras (sin red).
//
// Columnas CSV esperadas (encabezado, en cualquier orden):
//   matchId, homeTeam, awayTeam, marketType, selection, team, playerName,
//   line, americanOdds, provider, source, lastUpdated
// =====================================================================

import { evaluateMarket } from "@/lib/bet/buildPicks";
import type { BetMarket, BetSelection, BetSource, MarketType, MatchModelParams } from "@/lib/bet/types";
import type { OddsFeedSelection } from "./types";

function americanToDecimal(odds: number): number {
  if (odds === 0) return 1;
  return odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds);
}
function impliedFromAmerican(odds: number): number {
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
}

export type RawOddsRow = Record<string, string>;

/** Parsea CSV simple (sin comas dentro de campos). Primera fila = encabezados. */
export function parseOddsCSV(text: string): RawOddsRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row: RawOddsRow = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

/** Parsea JSON (arreglo de objetos). Tolera objeto único o {data:[...]}. */
export function parseOddsJSON(text: string): RawOddsRow[] {
  try {
    const parsed = JSON.parse(text) as unknown;
    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { data?: unknown[] })?.data)
        ? (parsed as { data: unknown[] }).data
        : [parsed];
    return arr.map((o) => {
      const row: RawOddsRow = {};
      for (const [k, v] of Object.entries(o as Record<string, unknown>)) row[k.toLowerCase()] = String(v ?? "");
      return row;
    });
  } catch {
    return [];
  }
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

/** Valida una fila importada. No importa si falta matchId o americanOdds. */
export function validateImportedOdds(row: RawOddsRow): ValidationResult {
  const warnings: string[] = [];
  const matchId = row.matchid ?? row.match_id ?? "";
  const odds = Number(row.americanodds ?? row.american_odds ?? row.odds);
  if (!matchId) warnings.push("Falta matchId");
  if (!Number.isFinite(odds) || odds === 0) warnings.push("americanOdds inválido");
  if (!(row.markettype ?? row.market_type)) warnings.push("Falta marketType");
  if (!row.selection) warnings.push("Falta selection (se usará genérica)");
  return { valid: Boolean(matchId) && Number.isFinite(odds) && odds !== 0, warnings };
}

/** Normaliza filas válidas a OddsFeedSelection (con decimal + implícita). */
export function normalizeImportedOdds(
  rows: RawOddsRow[],
  format: "csv" | "json",
): { selections: OddsFeedSelection[]; warnings: string[] } {
  const source: BetSource = format === "csv" ? "Imported CSV" : "Imported JSON";
  const warnings: string[] = [];
  const selections: OddsFeedSelection[] = [];
  rows.forEach((row, i) => {
    const v = validateImportedOdds(row);
    if (v.warnings.length) warnings.push(`Fila ${i + 1}: ${v.warnings.join(", ")}`);
    if (!v.valid) return;
    const odds = Number(row.americanodds ?? row.american_odds ?? row.odds);
    const lineRaw = row.line ?? "";
    const line = lineRaw === "" ? null : Number(lineRaw);
    selections.push({
      id: `imp-${i}`,
      marketId: `impm-${i}`,
      matchId: row.matchid ?? row.match_id ?? "",
      marketType: (row.markettype ?? row.market_type ?? "match_result") as MarketType,
      selection: row.selection || "Selección",
      team: row.team || null,
      playerName: row.playername ?? row.player_name ?? null,
      line: Number.isFinite(line as number) ? (line as number) : null,
      americanOdds: odds,
      decimalOdds: Number(americanToDecimal(odds).toFixed(3)),
      impliedProbability: Number(impliedFromAmerican(odds).toFixed(4)),
      provider: row.provider || "Imported",
      source,
      reliability: "medium",
      lastUpdated: row.lastupdated ?? row.last_updated ?? new Date().toISOString(),
      isLive: false,
      isManual: false,
      isDemo: false,
      isImported: true,
    });
  });
  return { selections, warnings };
}

export interface MatchContext {
  params: MatchModelParams;
  name: string;
}

/**
 * Convierte selecciones importadas en BetSelection evaluadas por el modelo.
 * `resolveParams(matchId)` debe devolver el contexto del partido (o null si
 * no se reconoce → se evalúa con params neutrales y se avisa).
 */
export function importOddsAsSelections(
  feed: OddsFeedSelection[],
  resolveParams: (matchId: string) => MatchContext | null,
): { selections: BetSelection[]; warnings: string[] } {
  const warnings: string[] = [];
  const neutral: MatchModelParams = {
    homeId: "home",
    awayId: "away",
    homeName: "Local",
    awayName: "Visitante",
    homeXG: 1.4,
    awayXG: 1.1,
    cornersLambda: 10,
    cardsLambda: 4.5,
    offsidesLambda: 3.4,
    penaltyProb: 0.24,
  };

  const selections = feed.map((f) => {
    const ctx = resolveParams(f.matchId);
    if (!ctx) warnings.push(`Partido no reconocido (${f.matchId}); evaluado con modelo neutral.`);
    const params = ctx?.params ?? neutral;
    const market: BetMarket = {
      id: f.marketId,
      matchId: f.matchId,
      category: f.playerName ? "player" : f.team ? "team" : "match",
      marketType: f.marketType,
      label: f.marketType,
      selection: f.selection,
      line: f.line,
      americanOdds: f.americanOdds,
      oppositeAmericanOdds: null,
      modelLambda: null,
      teamId: f.team ?? undefined,
      playerId: undefined,
      source: f.source,
      reliability: f.reliability,
      isDemo: false,
      lastUpdated: f.lastUpdated,
    };
    return evaluateMarket(market, params, ctx?.name ?? `${params.homeName} vs ${params.awayName}`);
  });

  return { selections, warnings };
}
