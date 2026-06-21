// =====================================================================
// playerRecentStats.ts — estadísticas recientes de jugadores del Mundial 2026,
// transcritas de los leaderboards de 365Scores (ZIP "Estadisticas jugadores").
//
// Capa de CONTEXTO para player props (NO reemplaza el modelo base). Los
// leaderboards dan AGREGADOS del torneo (1-2 partidos jugados) → sampleSize bajo,
// penaliza la confianza. reliability "manual_screenshot".
//
// Cobertura actual: porteros (atajadas) de los equipos de HOY + goleadores
// destacados legibles. Tiros/pases por jugador NO vienen en estos leaderboards
// (Opta/365 no publican la tabla por jugador tan temprano) → quedan pendientes
// (needsReview en quien aplique).
// =====================================================================

export interface PlayerRecentStats {
  playerName: string;
  teamId: string;
  teamName: string;
  position?: string;
  roleKey?: string;
  source: "365Scores screenshot";
  reliability: "manual_screenshot";
  sampleSize: number; // partidos del torneo cubiertos
  lastUpdated: string;
  needsReview?: boolean;

  goals?: number;
  assists?: number;
  shots?: number;
  shotsOnTarget?: number;
  keyPasses?: number;
  foulsCommitted?: number;
  foulsReceived?: number;
  yellowCards?: number;
  interceptions?: number;
  tacklesWon?: number;
  clearances?: number;

  // Portero
  saves?: number;
  savesPerMatch?: number;
}

const SRC = { source: "365Scores screenshot" as const, reliability: "manual_screenshot" as const, lastUpdated: "2026-06-21" };

// Porteros de los 8 equipos de HOY (atajadas acumuladas del torneo; 1 partido
// jugado → savesPerMatch = total). Fuente: leaderboard "paradas de arqueros".
export const PLAYER_RECENT_STATS: PlayerRecentStats[] = [
  { playerName: "Mohammed Al Owais", teamId: "ksa", teamName: "Arabia Saudita", position: "GK", saves: 9, savesPerMatch: 9, sampleSize: 1, ...SRC },
  { playerName: "Vozinha", teamId: "cpv", teamName: "Cabo Verde", position: "GK", saves: 7, savesPerMatch: 7, sampleSize: 1, ...SRC },
  { playerName: "Alireza Beiranvand", teamId: "irn", teamName: "Irán", position: "GK", saves: 6, savesPerMatch: 6, sampleSize: 1, ...SRC },
  { playerName: "Mostafa Shobeir", teamId: "egy", teamName: "Egipto", position: "GK", saves: 3, savesPerMatch: 3, sampleSize: 1, ...SRC },
  { playerName: "Thibaut Courtois", teamId: "bel", teamName: "Bélgica", position: "GK", saves: 2, savesPerMatch: 2, sampleSize: 1, ...SRC },
  { playerName: "Fernando Muslera", teamId: "uru", teamName: "Uruguay", position: "GK", saves: 2, savesPerMatch: 2, sampleSize: 1, ...SRC },
  { playerName: "Max Crocombe", teamId: "nzl", teamName: "Nueva Zelanda", position: "GK", saves: 2, savesPerMatch: 2, sampleSize: 1, ...SRC },

  // Goleadores destacados (goles del torneo) — contexto para anytime scorer.
  { playerName: "Folarin Balogun", teamId: "usa", teamName: "Estados Unidos", position: "FW", goals: 2, sampleSize: 2, ...SRC },
  { playerName: "Ismael Saibari", teamId: "mar", teamName: "Marruecos", position: "MF", goals: 2, sampleSize: 2, ...SRC },
  { playerName: "Abdulelah Al-Amri", teamId: "ksa", teamName: "Arabia Saudita", position: "DF", goals: 1, sampleSize: 1, ...SRC },
];

const BY_KEY = new Map<string, PlayerRecentStats>();
function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
for (const p of PLAYER_RECENT_STATS) BY_KEY.set(norm(p.playerName), p);

export function getPlayerRecentStats(playerName: string): PlayerRecentStats | null {
  if (!playerName) return null;
  const n = norm(playerName);
  if (BY_KEY.has(n)) return BY_KEY.get(n)!;
  // coincidencia por apellido/substring (las props suelen traer solo apellido).
  for (const p of PLAYER_RECENT_STATS) {
    const pn = norm(p.playerName);
    if (pn.includes(n) || n.includes(pn) || pn.split(" ").some((part) => part.length > 3 && n.includes(part))) return p;
  }
  return null;
}

/** Porteros con atajadas recientes de un equipo (para props de saves). */
export function getGoalkeeperRecent(teamId: string): PlayerRecentStats | null {
  return PLAYER_RECENT_STATS.find((p) => p.teamId === teamId && p.position === "GK") ?? null;
}
