/* =====================================================================
 * Parser PURO del dataset martj42/international_results (sin fs/red).
 *
 * CSV: date,home_team,away_team,home_score,away_score,tournament,city,country,neutral
 * Resultados de partidos internacionales desde 1872 → base para calibrar Elo.
 *
 * Equipos fuera de las 48 del Mundial igual importan (rivales): se les asigna un
 * id "ghost:<slug>" determinista para que la cadena de Elo sea correcta.
 * ===================================================================== */

import { normalizeName } from "./team-aliases";

export interface RawResult {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  tournament: string;
  neutral: boolean;
}

export interface CleanResult {
  date: string;
  ts: number; // epoch segundos (UTC)
  homeId: string; // id real (3 letras) o "ghost:<slug>"
  awayId: string;
  homeScore: number;
  awayScore: number;
  tournament: string;
  importance: number; // K-factor base por importancia del torneo
  neutral: boolean;
}

/** Parser CSV tolerante a comas entre comillas (RFC-4180 simplificado). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Parsea el CSV de martj42 (indexado por header, tolerante al orden). */
export function parseMartj42(text: string): RawResult[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iDate = idx("date");
  const iHome = idx("home_team");
  const iAway = idx("away_team");
  const iHs = idx("home_score");
  const iAs = idx("away_score");
  const iTour = idx("tournament");
  const iNeutral = idx("neutral");
  if (iDate < 0 || iHome < 0 || iAway < 0 || iHs < 0 || iAs < 0) return [];

  const toScore = (v: string): number | null => {
    const n = Number((v ?? "").trim());
    return Number.isInteger(n) && n >= 0 ? n : null;
  };

  const out: RawResult[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length <= iAway) continue;
    out.push({
      date: (row[iDate] ?? "").trim(),
      homeTeam: (row[iHome] ?? "").trim(),
      awayTeam: (row[iAway] ?? "").trim(),
      homeScore: toScore(row[iHs]),
      awayScore: toScore(row[iAs]),
      tournament: iTour >= 0 ? (row[iTour] ?? "").trim() : "",
      neutral: iNeutral >= 0 ? (row[iNeutral] ?? "").trim().toLowerCase() === "true" : false,
    });
  }
  return out;
}

/** Resuelve un nombre a id real (alias) o a "ghost:<slug>" determinista. */
export function resolveTeamId(name: string, aliases: Record<string, string>): string {
  const norm = normalizeName(name);
  const hit = aliases[norm];
  if (hit) return hit;
  return "ghost:" + norm.replace(/\s+/g, "-");
}

/** K-factor base por importancia del torneo (estilo World Football Elo / Hicruben). */
export function importanceOf(tournament: string): number {
  const t = tournament.toLowerCase();
  if (/world cup(?!.*qual)/.test(t) && !/qualif/.test(t)) return 55;
  if (/world cup.*qual|qualif/.test(t)) return 30;
  if (/nations league/.test(t)) return 40;
  if (/copa am|copa rica|euro|european championship|afc asian|africa cup|gold cup|confederations/.test(t))
    return 45;
  if (/uefa euro/.test(t)) return 50;
  if (/friendly|friendlies/.test(t)) return 18;
  return 25;
}

function dateToEpochSec(date: string): number {
  // date "YYYY-MM-DD" → epoch UTC en segundos (determinista, no usa Date.now).
  const ms = Date.parse(date + "T00:00:00Z");
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
}

/**
 * Limpia y ordena resultados: conserva los que tienen ambos marcadores y fecha
 * válida (>= minDate). Orden estable (ts, homeId, awayId) → determinista.
 */
export function cleanResults(
  raw: RawResult[],
  aliases: Record<string, string>,
  opts: { minDate?: string } = {},
): CleanResult[] {
  const minTs = opts.minDate ? dateToEpochSec(opts.minDate) : 0;
  const out: CleanResult[] = [];
  for (const m of raw) {
    if (m.homeScore == null || m.awayScore == null) continue;
    const ts = dateToEpochSec(m.date);
    if (ts === 0 || ts < minTs) continue;
    out.push({
      date: m.date,
      ts,
      homeId: resolveTeamId(m.homeTeam, aliases),
      awayId: resolveTeamId(m.awayTeam, aliases),
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      tournament: m.tournament,
      importance: importanceOf(m.tournament),
      neutral: m.neutral,
    });
  }
  out.sort((a, b) =>
    a.ts !== b.ts
      ? a.ts - b.ts
      : a.homeId !== b.homeId
        ? a.homeId.localeCompare(b.homeId)
        : a.awayId.localeCompare(b.awayId),
  );
  return out;
}
