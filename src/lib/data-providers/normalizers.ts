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
    refereeId: asString(base.refereeId),
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
  return candidates;
}

// =====================================================================
// Parsing EXPERIMENTAL de subtabs de 365Scores.
//
// 365Scores suele exponer su estado en objetos con claves como `games`,
// `competitors`, `lineups`, `statistics`, `standings`, `events`, `odds`,
// `h2h`/`headToHead`, `news`. Esta funcion NO asume la estructura exacta
// (puede cambiar): BUSCA esas secciones de forma tolerante en cualquier
// nivel de los candidatos JSON y reporta que encontro. Donde la forma no
// esta confirmada se deja TODO; nunca lanza, siempre cae a vacio.
// =====================================================================

/** Secciones (subtabs) que se intentan detectar por partido/competicion. */
export type Scores365Section =
  | "matchPage"
  | "lineups"
  | "stats"
  | "groups"
  | "headToHead"
  | "odds"
  | "events"
  | "playerStats"
  | "teamForm"
  | "standings"
  | "news";

/** Mapa clave-de-payload -> subtab. Tentativo (ver nota arriba). */
const SECTION_KEYS: Record<Scores365Section, string[]> = {
  matchPage: ["game", "games", "match"],
  lineups: ["lineups", "lineup", "formations"],
  stats: ["statistics", "stats"],
  groups: ["groups", "group"],
  headToHead: ["headToHead", "h2h", "previousMeetings"],
  odds: ["odds", "bookmakers", "lines"],
  events: ["events", "incidents", "timeline"],
  playerStats: ["playerStatistics", "topPerformers", "players"],
  teamForm: ["form", "recentForm", "lastMatches"],
  standings: ["standings", "tableRows", "table"],
  news: ["news", "articles", "stories"],
};

export interface Scores365ParseResult {
  matches: Match[];
  teams: Team[];
  /** Secciones (subtabs) detectadas en el payload. */
  sectionsFound: Scores365Section[];
  warnings: string[];
}

/** Indica si un objeto contiene alguna de las claves dadas (recursivo, acotado). */
function findKeysDeep(value: unknown, keys: string[], depth = 0): boolean {
  if (depth > 6 || value == null || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  for (const k of keys) {
    if (k in obj && obj[k] != null) return true;
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) {
      for (const item of v) if (findKeysDeep(item, keys, depth + 1)) return true;
    } else if (typeof v === "object") {
      if (findKeysDeep(v, keys, depth + 1)) return true;
    }
  }
  return false;
}

/** Recolecta arrays bajo cualquiera de las claves dadas (recursivo, acotado). */
function collectArrays(value: unknown, keys: string[], out: unknown[], depth = 0): void {
  if (depth > 6 || value == null || typeof value !== "object") return;
  const obj = value as Record<string, unknown>;
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) out.push(...v);
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) {
      for (const item of v) collectArrays(item, keys, out, depth + 1);
    } else if (typeof v === "object") {
      collectArrays(v, keys, out, depth + 1);
    }
  }
}

/** Normaliza un "game" estilo 365Scores (competitors anidados) a Match. */
function normalizeScores365Game(
  raw: unknown,
  ctx: { source: DataSource; capturedAt: string; origin: string },
): NormalizationResult<Match> {
  const base = (raw ?? {}) as Record<string, unknown>;
  const home = (base.homeCompetitor ?? base.home) as Record<string, unknown> | undefined;
  const away = (base.awayCompetitor ?? base.away) as Record<string, unknown> | undefined;
  // Aplana al shape que entiende normalizeMatch.
  const flat = {
    id: base.id ?? base.gameId,
    homeTeamId: home?.id ?? base.homeCompetitorId,
    awayTeamId: away?.id ?? base.awayCompetitorId,
    kickoff: base.startTime ?? base.kickoff ?? base.startTimeStr,
    competition: base.competitionName ?? base.competition,
    venue: base.venue ?? base.stadium,
    homeScore: home?.score ?? base.homeScore,
    awayScore: away?.score ?? base.awayScore,
  };
  return normalizeMatch(flat, ctx);
}

/**
 * Intenta parsear las subtabs de 365Scores desde candidatos JSON.
 * Best-effort: detecta secciones presentes y normaliza games/competitors.
 */
export function parseScores365Sections(
  candidates: unknown[],
  ctx: { source: DataSource; capturedAt: string; origin: string },
): Scores365ParseResult {
  const warnings: string[] = [];
  const sectionsFound: Scores365Section[] = [];
  const matches: Match[] = [];
  const teams: Team[] = [];

  for (const candidate of candidates) {
    for (const section of Object.keys(SECTION_KEYS) as Scores365Section[]) {
      if (!sectionsFound.includes(section) && findKeysDeep(candidate, SECTION_KEYS[section])) {
        sectionsFound.push(section);
      }
    }

    // Games -> Match.
    const games: unknown[] = [];
    collectArrays(candidate, SECTION_KEYS.matchPage, games);
    for (const g of games) {
      const r = normalizeScores365Game(g, ctx);
      if (r.ok && r.data) matches.push(r.data);
    }

    // Competitors -> Team.
    const competitors: unknown[] = [];
    collectArrays(candidate, ["competitors", "teams"], competitors);
    for (const c of competitors) {
      const r = normalizeTeam(c, ctx);
      if (r.ok && r.data) teams.push(r.data);
    }
  }

  if (sectionsFound.length === 0) {
    warnings.push(
      "No se detectaron subtabs de 365Scores (matchPage/lineups/stats/standings/...). " +
        "La estructura puede haber cambiado: revisar SECTION_KEYS y conectar parsing fino (TODO).",
    );
  } else {
    warnings.push(`Subtabs detectadas: ${sectionsFound.join(", ")}.`);
  }
  if (matches.length === 0 && teams.length === 0) {
    warnings.push("Secciones presentes pero sin games/competitors mapeables aun (parsing fino pendiente).");
  }

  // Dedup por id.
  const dedup = <T extends { id: string }>(arr: T[]) => [...new Map(arr.map((x) => [x.id, x])).values()];
  return { matches: dedup(matches), teams: dedup(teams), sectionsFound, warnings };
}
