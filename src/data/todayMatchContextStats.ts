// =====================================================================
// todayMatchContextStats.ts — estadísticas del ÚLTIMO partido de cada selección,
// transcritas de screenshots de 365Scores (carpeta "estadisticas mundial").
//
// Es una CAPA DE CONTEXTO reciente (no reemplaza el modelo base). sampleSize=1:
// una sola muestra → el modelo penaliza la confianza y mezcla con peso bajo.
// reliability "manual_screenshot": transcripción manual, no feed conectado.
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
}

const SRC = { source: "365Scores screenshot", reliability: "manual_screenshot" as const, sampleSize: 1, lastUpdated: "2026-06-21" };

// Último partido de cada selección (jornada 1). Para los partidos de hoy con
// datos transcritos. Otras selecciones se irán agregando desde sus screenshots.
export const TODAY_RECENT_STATS: TeamRecentMatchStats[] = [
  {
    teamId: "esp", teamName: "España", opponentName: "Cabo Verde", scoreFor: 0, scoreAgainst: 0,
    possession: 74, xg: 2.1, xgAgainst: 0.2, shots: 27, shotsOnTarget: 7, shotsOnTargetAgainst: 1,
    corners: 11, cornersAgainst: null, fouls: 10, foulsDrawn: 1, yellowCards: 1, redCards: 0,
    gkSaves: 1, clearances: 7, attacks: 147, offsides: 2, ...SRC,
  },
  {
    teamId: "ksa", teamName: "Arabia Saudita", opponentName: "Uruguay", scoreFor: 1, scoreAgainst: 1,
    possession: 33, xg: 0.66, xgAgainst: 1.72, shots: 7, shotsOnTarget: 3, shotsOnTargetAgainst: 10,
    corners: 4, cornersAgainst: 14, fouls: 11, foulsDrawn: 6, yellowCards: 1, redCards: 0,
    gkSaves: 9, clearances: 43, attacks: 67, offsides: 0, ...SRC,
  },
];

const BY_TEAM = new Map(TODAY_RECENT_STATS.map((s) => [s.teamId, s]));

export function getRecentStatsByTeam(teamId: string): TeamRecentMatchStats | null {
  return BY_TEAM.get(teamId) ?? null;
}
