// =====================================================================
// URLs publicas configurables para la ingesta EXPERIMENTAL de 365Scores.
// No hardcodear URLs dentro de los scripts: editarlas aqui.
//
// IMPORTANTE: la recopilacion es manual (`npm run ingest:365`), con rate
// limit y cache. Nunca corre en build ni en cada request de usuario.
// Si una URL deja de ser legible, el script registra el error y continua.
// =====================================================================

export interface SourceUrl {
  /** Identificador estable usado para nombrar snapshots. */
  id: string;
  /** Tipo de entidad esperada para guiar el normalizador. */
  kind: "match" | "team" | "competition" | "player" | "unknown";
  url: string;
  /** Notas para el desarrollador sobre que se espera extraer. */
  note?: string;
}

/**
 * Lista de ejemplo. Son URLs publicas de seccion de futbol/Mundial.
 * Sustituye o agrega segun lo que quieras intentar ingerir.
 * El parsing real de cada pagina queda como TODO en el normalizador.
 */
export const SOURCE_URLS: SourceUrl[] = [
  {
    id: "365scores-football-home",
    kind: "competition",
    url: "https://www.365scores.com/es/football",
    note: "Landing de futbol. Pagina dinamica: probablemente requiera parsing de JSON embebido.",
  },
  {
    id: "365scores-worldcup",
    kind: "competition",
    url: "https://www.365scores.com/es/football/world-cup",
    note: "Hub del Mundial. Punto de partida para descubrir partidos y grupos.",
  },
];

/** Configuracion de rate limit / cache para la ingesta. */
export const INGEST_CONFIG = {
  /** Milisegundos minimos entre requests (cortesia con la fuente). */
  minDelayMs: 4000,
  /** Timeout por request. */
  requestTimeoutMs: 15000,
  /** Reusar snapshot raw si es mas reciente que esto (ms). */
  cacheTtlMs: 1000 * 60 * 60 * 6, // 6 horas
  /** User-Agent identificable; no se hace evasion de bloqueos. */
  userAgent:
    "FutbolPrototype/0.1 (investigacion interna; respeta rate limit; contacto: ejemplo@local)",
};
