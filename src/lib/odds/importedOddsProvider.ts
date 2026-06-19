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
import type { ImportMetrics, OddsFeedSelection, UnmatchedOdd } from "./types";

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
  const matchId =
    row.matchid ?? row.match_id ?? row.externalid ?? row.external_id ?? row.fifaid ?? row.fifa_id ?? row.providereventid ?? "";
  const hasTeams = Boolean((row.hometeam ?? row.home_team ?? row.home) && (row.awayteam ?? row.away_team ?? row.away));
  const odds = Number(row.americanodds ?? row.american_odds ?? row.odds);
  if (!matchId && !hasTeams) warnings.push("Falta matchId o equipos (homeTeam/awayTeam)");
  if (!Number.isFinite(odds) || odds === 0) warnings.push("americanOdds inválido");
  if (!(row.markettype ?? row.market_type)) warnings.push("Falta marketType");
  if (!row.selection) warnings.push("Falta selection (se usará genérica)");
  return { valid: (Boolean(matchId) || hasTeams) && Number.isFinite(odds) && odds !== 0, warnings };
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
    const matchId =
      row.matchid ?? row.match_id ?? row.externalid ?? row.external_id ?? row.fifaid ?? row.fifa_id ?? row.providereventid ?? "";
    selections.push({
      id: `imp-${i}`,
      marketId: `impm-${i}`,
      matchId,
      externalMatchId: matchId,
      homeTeam: row.hometeam ?? row.home_team ?? row.home ?? null,
      awayTeam: row.awayteam ?? row.away_team ?? row.away ?? null,
      kickoff: row.kickoff ?? row.kickofftime ?? row.kickoff_time ?? row.starttime ?? null,
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
  /** matchId interno canónico (p. ej. wc-C-3) al que se resolvió el partido. */
  matchId: string;
  params: MatchModelParams;
  name: string;
}

export interface ImportOddsResult {
  selections: BetSelection[];
  warnings: string[];
  metrics: ImportMetrics;
  unmatched: UnmatchedOdd[];
}

/**
 * Convierte selecciones importadas en BetSelection evaluadas por el modelo del
 * partido REAL. `resolveMatch(odd)` resuelve el contexto del partido interno
 * (matchId canónico + params) o null si no se reconoce.
 *
 * Regla clave: si el partido NO se resuelve, NO se evalúa con modelo neutral.
 * Se omite la selección y se reporta como unmatched para que la UI lo muestre.
 */
export function importOddsAsSelections(
  feed: OddsFeedSelection[],
  resolveMatch: (odd: OddsFeedSelection) => MatchContext | null,
): ImportOddsResult {
  const warnings: string[] = [];
  const selections: BetSelection[] = [];
  const unmatchedMap = new Map<string, UnmatchedOdd>();
  const resolvedMatchIds = new Set<string>();
  let skipped = 0;

  for (const f of feed) {
    const ctx = resolveMatch(f);
    if (!ctx) {
      skipped += 1;
      const key = f.externalMatchId || f.matchId || `${f.homeTeam ?? "?"}-${f.awayTeam ?? "?"}`;
      const prev = unmatchedMap.get(key);
      if (prev) prev.count += 1;
      else
        unmatchedMap.set(key, {
          externalMatchId: f.externalMatchId || f.matchId || key,
          homeTeam: f.homeTeam,
          awayTeam: f.awayTeam,
          count: 1,
        });
      continue;
    }

    resolvedMatchIds.add(ctx.matchId);
    const market: BetMarket = {
      id: f.marketId,
      matchId: ctx.matchId,
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
    const evaluated = evaluateMarket(market, ctx.params, ctx.name);
    selections.push({ ...evaluated, externalMatchId: f.externalMatchId });
  }

  const unmatched = [...unmatchedMap.values()];
  for (const u of unmatched) {
    warnings.push(
      `Partido no reconocido (${u.externalMatchId}${u.homeTeam || u.awayTeam ? ` · ${u.homeTeam ?? "?"} vs ${u.awayTeam ?? "?"}` : ""}). ` +
        `Revisa matchId/equipos antes de calcular value. No se calcularon picks para estas selecciones (${u.count}).`,
    );
  }

  const metrics: ImportMetrics = {
    totalImported: feed.length,
    resolvedMatches: resolvedMatchIds.size,
    unmatchedMatches: unmatched.length,
    selectionsReadyForModel: selections.length,
    selectionsSkipped: skipped,
  };

  return { selections, warnings, metrics, unmatched };
}
