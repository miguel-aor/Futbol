// =====================================================================
// todayMatchContextStats.ts — estadísticas del ÚLTIMO partido de cada selección
// (jornada 1), transcritas de screenshots de 365Scores (carpeta
// "estadisticas mundial"). Cubre los 8 equipos de los 4 partidos de HOY.
//
// Capa de CONTEXTO reciente (no reemplaza el modelo base). sampleSize=1 → el
// modelo penaliza la confianza y mezcla con peso bajo (salvo props de volumen).
// reliability "manual_screenshot": transcripción manual, no feed conectado.
// `needsReview` marca campos/equipos que no se pudieron leer con confianza.
// =====================================================================

export interface TeamRecentMatchStats {
  teamId: string;
  teamName: string;
  opponentName: string;
  scoreFor: number;
  scoreAgainst: number;
  possession: number; // %
  xg: number;
  xgAgainst: number;
  shots: number;
  shotsOnTarget: number;
  shotsOnTargetAgainst: number; // tiros a puerta concedidos (≈ saves + goles)
  corners: number;
  cornersAgainst: number | null;
  fouls: number; // faltas cometidas
  foulsDrawn: number; // faltas recibidas
  yellowCards: number;
  redCards: number;
  gkSaves: number; // atajadas del portero propio
  clearances: number;
  attacks: number;
  offsides: number;
  source: string;
  reliability: "manual_screenshot";
  sampleSize: number;
  lastUpdated: string;
  /** true si algún dato quedó sin confirmar (revisión manual pendiente). */
  needsReview?: boolean;
}

const SRC = { source: "365Scores screenshot", reliability: "manual_screenshot" as const, sampleSize: 1, lastUpdated: "2026-06-21" };

// Último partido de cada selección (jornada 1), leído de las capturas 365Scores.
export const TODAY_RECENT_STATS: TeamRecentMatchStats[] = [
  // ---- Grupo H ----
  {
    teamId: "esp", teamName: "España", opponentName: "Cabo Verde", scoreFor: 0, scoreAgainst: 0,
    possession: 74, xg: 2.1, xgAgainst: 0.2, shots: 27, shotsOnTarget: 7, shotsOnTargetAgainst: 1,
    corners: 11, cornersAgainst: 1, fouls: 10, foulsDrawn: 1, yellowCards: 1, redCards: 0,
    gkSaves: 1, clearances: 7, attacks: 147, offsides: 2, ...SRC,
  },
  {
    teamId: "cpv", teamName: "Cabo Verde", opponentName: "España", scoreFor: 0, scoreAgainst: 0,
    possession: 26, xg: 0.2, xgAgainst: 2.1, shots: 6, shotsOnTarget: 1, shotsOnTargetAgainst: 7,
    corners: 1, cornersAgainst: 11, fouls: 1, foulsDrawn: 9, yellowCards: 1, redCards: 0,
    gkSaves: 7, clearances: 46, attacks: 34, offsides: 3, ...SRC,
  },
  {
    teamId: "ksa", teamName: "Arabia Saudita", opponentName: "Uruguay", scoreFor: 1, scoreAgainst: 1,
    possession: 33, xg: 0.66, xgAgainst: 1.72, shots: 7, shotsOnTarget: 3, shotsOnTargetAgainst: 10,
    corners: 4, cornersAgainst: 14, fouls: 11, foulsDrawn: 6, yellowCards: 1, redCards: 0,
    gkSaves: 9, clearances: 43, attacks: 67, offsides: 0, ...SRC,
  },
  {
    teamId: "uru", teamName: "Uruguay", opponentName: "Arabia Saudita", scoreFor: 1, scoreAgainst: 1,
    possession: 67, xg: 1.72, xgAgainst: 0.66, shots: 27, shotsOnTarget: 10, shotsOnTargetAgainst: 3,
    corners: 14, cornersAgainst: 4, fouls: 6, foulsDrawn: 11, yellowCards: 0, redCards: 0,
    gkSaves: 2, clearances: 17, attacks: 129, offsides: 6, ...SRC,
  },
  // ---- Grupo G ----
  {
    teamId: "bel", teamName: "Bélgica", opponentName: "Egipto", scoreFor: 1, scoreAgainst: 1,
    possession: 54, xg: 1.35, xgAgainst: 1.08, shots: 15, shotsOnTarget: 3, shotsOnTargetAgainst: 3,
    corners: 2, cornersAgainst: 7, fouls: 15, foulsDrawn: 15, yellowCards: 2, redCards: 0,
    gkSaves: 2, clearances: 25, attacks: 118, offsides: 0, ...SRC,
  },
  {
    teamId: "egy", teamName: "Egipto", opponentName: "Bélgica", scoreFor: 1, scoreAgainst: 1,
    possession: 46, xg: 1.08, xgAgainst: 1.35, shots: 14, shotsOnTarget: 3, shotsOnTargetAgainst: 3,
    corners: 7, cornersAgainst: 2, fouls: 15, foulsDrawn: 14, yellowCards: 2, redCards: 0,
    gkSaves: 3, clearances: 17, attacks: 82, offsides: 1, ...SRC,
  },
  {
    teamId: "irn", teamName: "Irán", opponentName: "Nueva Zelanda", scoreFor: 2, scoreAgainst: 2,
    possession: 48, xg: 1.5, xgAgainst: 1.24, shots: 17, shotsOnTarget: 4, shotsOnTargetAgainst: 8,
    corners: 4, cornersAgainst: 1, fouls: 10, foulsDrawn: 8, yellowCards: 1, redCards: 0,
    gkSaves: 6, clearances: 27, attacks: 93, offsides: 2, ...SRC,
  },
  {
    teamId: "nzl", teamName: "Nueva Zelanda", opponentName: "Irán", scoreFor: 2, scoreAgainst: 2,
    possession: 52, xg: 1.24, xgAgainst: 1.5, shots: 14, shotsOnTarget: 8, shotsOnTargetAgainst: 4,
    corners: 1, cornersAgainst: 4, fouls: 8, foulsDrawn: 10, yellowCards: 0, redCards: 0,
    gkSaves: 2, clearances: 26, attacks: 100, offsides: 0, ...SRC,
  },
];

const BY_TEAM = new Map(TODAY_RECENT_STATS.map((s) => [s.teamId, s]));

export function getRecentStatsByTeam(teamId: string): TeamRecentMatchStats | null {
  return BY_TEAM.get(teamId) ?? null;
}
