// =====================================================================
// Normalizadores: convierten datos crudos (ej. JSON publico de
// 365Scores) al modelo de dominio de la app.
//
// IMPORTANTE: 365Scores es una pagina muy dinamica. La estructura real
// de su payload puede cambiar y NO se garantiza. Por eso estos
// normalizadores son TOLERANTES: si falta un campo, devuelven null o
// un valor seguro y registran que no se pudo mapear, sin lanzar.
//
// Donde dice "TODO: conectar parsing real" es el punto exacto donde se
// engancharia el parsing especifico cuando se confirme la estructura.
// =====================================================================

import type {
  Confederation,
  DataSource,
  InternationalFixtureType,
  Match,
  MatchPrediction,
  Team,
} from "./types";

/** Resultado de una normalizacion con trazabilidad. */
export interface NormalizationResult<T> {
  ok: boolean;
  data: T | null;
  /** Mensajes de advertencia/errores no fatales. */
  warnings: string[];
  source: DataSource;
  capturedAt: string;
  origin: string;
}

/** Prediccion neutra por defecto cuando no hay datos para modelar. */
export function neutralPrediction(): MatchPrediction {
  return {
    homeWin: 0.34,
    draw: 0.32,
    awayWin: 0.34,
    expectedGoals: 2.5,
    over25: 0.5,
    bttsYes: 0.5,
    expectedCorners: 9.5,
    expectedCards: 4.0,
  };
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

const CONFEDERATIONS: Confederation[] = ["UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC", "OFC"];

/**
 * Normaliza un objeto crudo a Team. Best-effort.
 * @param raw objeto JSON arbitrario proveniente de la fuente.
 */
export function normalizeTeam(
  raw: unknown,
  ctx: { source: DataSource; capturedAt: string; origin: string },
): NormalizationResult<Team> {
  const warnings: string[] = [];
  const base = (raw ?? {}) as Record<string, unknown>;

  // TODO: conectar parsing real. Estos accesos son tentativos: 365Scores
  // suele exponer entidades con campos como `name`, `id`, `countryCode`.
  const name = asString(base.name) ?? asString(base.teamName);
  const id = asString(base.id) ?? (name ? name.toLowerCase().replace(/\s+/g, "-") : null);

  if (!id || !name) {
    warnings.push("No se pudo determinar id/name del equipo en el payload crudo.");
    return { ok: false, data: null, warnings, ...ctx };
  }

  const confRaw = asString(base.confederation)?.toUpperCase();
  const confederation = CONFEDERATIONS.includes(confRaw as Confederation)
    ? (confRaw as Confederation)
    : "UEFA";
  if (!confRaw) warnings.push("Confederacion ausente: se asume UEFA (placeholder).");

  const team: Team = {
    id,
    name,
    code: (asString(base.code) ?? name.slice(0, 3)).toUpperCase(),
    flag: asString(base.flag) ?? "🏳️",
    confederation,
    groupId: asString(base.groupId),
    fifaRanking: asNumber(base.fifaRanking) ?? 99,
    recentForm: {
      last5: [],
      goalsFor: 0,
      goalsAgainst: 0,
      avgCorners: 0,
      avgCards: 0,
      avgShots: 0,
      avgShotsOnTarget: 0,
      volatility: 0.5,
    },
    attackStrength: asNumber(base.attackStrength) ?? 1.3,
    defenseStrength: asNumber(base.defenseStrength) ?? 1.3,
    source: ctx.source,
    updatedAt: ctx.capturedAt,
  };
  return { ok: true, data: team, warnings, ...ctx };
}

/**
 * Normaliza un objeto crudo a Match. Best-effort.
 */
export function normalizeMatch(
  raw: unknown,
  ctx: { source: DataSource; capturedAt: string; origin: string },
): NormalizationResult<Match> {
  const warnings: string[] = [];
  const base = (raw ?? {}) as Record<string, unknown>;

  // TODO: conectar parsing real con la estructura confirmada de 365Scores.
  const id = asString(base.id);
  const homeTeamId = asString(base.homeTeamId) ?? asString(base.homeCompetitorId);
  const awayTeamId = asString(base.awayTeamId) ?? asString(base.awayCompetitorId);
  const kickoff = asString(base.kickoff) ?? asString(base.startTime);

  if (!id || !homeTeamId || !awayTeamId || !kickoff) {
    warnings.push("Faltan campos minimos del partido (id/equipos/kickoff).");
    return { ok: false, data: null, warnings, ...ctx };
  }

  const fixtureType = (asString(base.fixtureType) as InternationalFixtureType) ?? "internacional";

  const match: Match = {
    id,
    fixtureType,
    competition: asString(base.competition) ?? "Internacional",
    groupId: asString(base.groupId),
    homeTeamId,
    awayTeamId,
    kickoff,
    venue: asString(base.venue) ?? "Por confirmar",
    city: asString(base.city) ?? "",
    neutralVenue: typeof base.neutralVenue === "boolean" ? base.neutralVenue : true,
    status: "scheduled",
    homeScore: asNumber(base.homeScore),
    awayScore: asNumber(base.awayScore),
    prediction: neutralPrediction(),
    trends: [],
    headToHead: [],
    source: ctx.source,
    updatedAt: ctx.capturedAt,
  };
  return { ok: true, data: match, warnings, ...ctx };
}

/**
 * Intenta extraer un bloque JSON util desde HTML crudo de 365Scores.
 * 365Scores normalmente inyecta estado en <script> (ej. __NEXT_DATA__,
 * window.__INITIAL_STATE__, o JSON-LD). Esta funcion BUSCA esos bloques
 * pero no asume su forma: devuelve los candidatos para inspeccion.
 */
export function extractJsonCandidatesFromHtml(html: string): unknown[] {
  const candidates: unknown[] = [];
  const patterns = [
    /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
    /<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/gi,
    /window\.__INITIAL_STATE__\s*=\s*([\s\S]*?);<\/script>/gi,
  ];
  for (const pattern of patterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(html)) !== null) {
      try {
        candidates.push(JSON.parse(m[1].trim()));
      } catch {
        // bloque no parseable: se ignora silenciosamente, no es fatal.
      }
    }
  }
  // TODO: una vez confirmada la estructura, navegar el candidato correcto
  // y mapear sus partidos/equipos con normalizeMatch / normalizeTeam.
  return candidates;
}
