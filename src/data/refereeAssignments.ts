// =====================================================================
// refereeAssignments.ts — designaciones arbitrales CONFIRMADAS por partido.
//
// REGLA: no se inventan árbitros. Solo se cargan designaciones corroboradas por
// fuentes confiables (FIFA Match Centre, Wikipedia "2026 FIFA World Cup
// officials", trackers especializados de designaciones). Si un partido no tiene
// designación verificada → referee: null, status "pending_verification".
//
// El pool WORLD_CUP_REFEREES NO se usa para asignar (solo referencia). Nada de
// asignación por hash/fallback/nacionalidad.
//
// Separación de fuentes:
//   - `source`/`sourceUrl`: de DÓNDE viene la DESIGNACIÓN del árbitro.
//   - `statsSource`: de dónde vienen las ESTADÍSTICAS históricas (si se cargan).
// =====================================================================

import type { Referee } from "@/lib/data-providers/types";

export type AssignmentReliability = "confirmed" | "reported" | "pending_verification";

export interface RefereeAssignmentReferee {
  name: string;
  country: string;
  fifaId?: string;
  isConfirmed: boolean;
  reliability: AssignmentReliability;
  source: string;
  sourceUrl?: string;
  lastUpdated: string;
  // Estadísticas históricas (opcionales; NO inventar). Si faltan, el modelo usa
  // promedio del torneo/equipos y el impacto del árbitro queda neutral.
  yellowCardsPerMatch?: number;
  redCardsPerMatch?: number;
  foulsPerMatch?: number;
  penaltiesPerMatch?: number;
  matchesSample?: number;
  // Contexto reciente/temporada (si una fuente lo separa de la carrera).
  recentYellowCardsPerMatch?: number;
  recentRedCardsPerMatch?: number;
  recentFoulsPerMatch?: number;
  recentMatchesSample?: number;
  // Fuente de ESTADÍSTICAS (distinta de la fuente de designación).
  statsSource?: string;
  statsSourceUrl?: string;
  secondaryStatsSource?: string;
  secondaryStatsSourceUrl?: string;
  statsReliability?: "high" | "medium" | "low";
  notes?: string;
}

export interface RefereeAssignment {
  matchId: string;
  externalMatchId?: string;
  homeTeam: string;
  awayTeam: string;
  referee: RefereeAssignmentReferee | null;
  status?: "pending_verification";
}

const TODAY = "2026-06-21";

// Designaciones de los partidos de hoy (jornada 2, grupos G/H). Corroboradas
// por ≥2 fuentes confiables (Wikipedia "2026 FIFA World Cup officials" + tracker
// de designaciones law5-theref; España–Arabia además por prensa que cita la
// designación FIFA). reliability "reported": no leídas directo del FIFA Match
// Centre, pero corroboradas. Estadísticas históricas: pendientes (no se inventan).
export const REFEREE_ASSIGNMENTS: RefereeAssignment[] = [
  {
    matchId: "wc-H-3",
    externalMatchId: "66456998",
    homeTeam: "España",
    awayTeam: "Arabia Saudita",
    referee: {
      name: "Raphael Claus",
      country: "Brasil",
      isConfirmed: true,
      reliability: "reported",
      source: "Wikipedia (2026 FIFA World Cup officials) + tracker law5-theref + prensa (canal26/GolCaracol)",
      sourceUrl: "http://law5-theref.blogspot.com/2026/06/2026-fifa-wc-referee-appointments-for.html",
      lastUpdated: TODAY,
      yellowCardsPerMatch: 4.12,
      redCardsPerMatch: 0.19,
      foulsPerMatch: 24.0,
      penaltiesPerMatch: 0.31, // 70 penales en 224 partidos
      matchesSample: 224,
      statsSource: "FootyMetrics",
      statsReliability: "high",
      notes: "Perfil medio-alto de tarjetas (4.12/partido); penales 70/224≈0.31.",
    },
  },
  {
    matchId: "wc-G-3",
    homeTeam: "Bélgica",
    awayTeam: "Irán",
    referee: {
      name: "Darío Herrera",
      country: "Argentina",
      isConfirmed: true,
      reliability: "reported",
      source: "Wikipedia (2026 FIFA World Cup officials) + tracker law5-theref",
      sourceUrl: "http://law5-theref.blogspot.com/2026/06/2026-fifa-wc-referee-appointments-for.html",
      lastUpdated: TODAY,
      yellowCardsPerMatch: 5.5,
      redCardsPerMatch: 0.33,
      foulsPerMatch: 25.1,
      penaltiesPerMatch: 0.26, // 65 penales en 248 partidos
      matchesSample: 248,
      statsSource: "FootyMetrics",
      secondaryStatsSource: "ValueStats (5.68 amarillas / 0.24 rojas en otra muestra)",
      statsReliability: "high",
      notes: "Perfil tarjetero ALTO (>5 amarillas/partido). ValueStats difiere ligeramente (5.68/0.24).",
    },
  },
  {
    matchId: "wc-H-4",
    homeTeam: "Uruguay",
    awayTeam: "Cabo Verde",
    referee: {
      name: "Espen Eskås",
      country: "Noruega",
      isConfirmed: true,
      reliability: "reported",
      source: "Wikipedia (2026 FIFA World Cup officials) + tracker law5-theref",
      sourceUrl: "http://law5-theref.blogspot.com/2026/06/2026-fifa-wc-referee-appointments-for.html",
      lastUpdated: TODAY,
      yellowCardsPerMatch: 3.41,
      redCardsPerMatch: 0.1,
      foulsPerMatch: 20.6,
      penaltiesPerMatch: 0.21, // 30 penales en 146 partidos
      matchesSample: 146,
      statsSource: "FootyMetrics",
      secondaryStatsSource: "ValueStats (3.53 amarillas / 0.07 rojas en otra muestra)",
      statsReliability: "high",
      notes: "Perfil MODERADO/BAJO de tarjetas (3.41/partido).",
    },
  },
  {
    matchId: "wc-G-4",
    homeTeam: "Nueva Zelanda",
    awayTeam: "Egipto",
    referee: {
      name: "Omar Al Ali",
      country: "Emiratos Árabes Unidos",
      isConfirmed: true,
      reliability: "reported",
      source: "Wikipedia (2026 FIFA World Cup officials) + tracker law5-theref",
      sourceUrl: "http://law5-theref.blogspot.com/2026/06/2026-fifa-wc-referee-appointments-for.html",
      lastUpdated: TODAY,
      yellowCardsPerMatch: 4.08, // ValueStats (carrera, 61 partidos)
      redCardsPerMatch: 0.26,
      foulsPerMatch: 26.45,
      matchesSample: 61,
      // Contexto temporada (StatsBet): incluye penales que la carrera no detalla.
      recentYellowCardsPerMatch: 3.94,
      recentRedCardsPerMatch: 0.22,
      recentMatchesSample: 18,
      penaltiesPerMatch: 0.67, // StatsBet temporada
      statsSource: "ValueStats (carrera)",
      secondaryStatsSource: "StatsBet (temporada: 4.22 tarjetas, 0.67 penales, 18 partidos)",
      statsReliability: "medium",
      notes: "Perfil MEDIO/ALTO en faltas (26.45). Penales 0.67 vienen de muestra de temporada (StatsBet), no de carrera.",
    },
  },
];

const BY_MATCH = new Map(REFEREE_ASSIGNMENTS.map((a) => [a.matchId, a]));

export function getRefereeAssignment(matchId: string): RefereeAssignment | null {
  return BY_MATCH.get(matchId) ?? null;
}

/** true si el partido tiene árbitro confirmado/corroborado. */
export function isRefereeConfirmed(matchId: string): boolean {
  return Boolean(BY_MATCH.get(matchId)?.referee?.isConfirmed);
}

// Stats neutrales: ~promedio → multiplicadores de impacto ≈ 1.0 (no inflan).
const NEUTRAL = { yellow: 3.8, red: 0.15, fouls: 24, pens: 0.22 };

/**
 * Convierte una designación confirmada en el `Referee` que consume el motor.
 * Si no hay estadísticas históricas reales, usa neutrales y marca
 * statsLoaded=false (no se presentan números inventados como reales).
 */
export function getConfirmedReferee(matchId: string): Referee | null {
  const a = BY_MATCH.get(matchId);
  const r = a?.referee;
  if (!r || !r.isConfirmed) return null;
  const statsLoaded = r.yellowCardsPerMatch != null;
  return {
    id: `assign-${matchId}`,
    name: r.name,
    nationality: r.country,
    matchesCount: r.matchesSample ?? 0,
    yellowCardsPerMatch: r.yellowCardsPerMatch ?? NEUTRAL.yellow,
    redCardsPerMatch: r.redCardsPerMatch ?? NEUTRAL.red,
    foulsPerMatch: r.foulsPerMatch ?? NEUTRAL.fouls,
    penaltiesPerMatch: r.penaltiesPerMatch ?? NEUTRAL.pens,
    homeBiasIndex: 0,
    gameFlowStyle: "promedio",
    source: "manual",
    lastUpdated: r.lastUpdated,
    isConfirmed: true,
    reliability: r.reliability === "confirmed" ? "confirmed" : "reported",
    designationSource: r.source,
    designationSourceUrl: r.sourceUrl,
    statsSource: r.statsSource,
    statsLoaded,
  };
}

/** Partidos sin árbitro confirmado (para reportar al usuario). */
export function getPendingRefereeMatches(): RefereeAssignment[] {
  return REFEREE_ASSIGNMENTS.filter((a) => !a.referee?.isConfirmed);
}
