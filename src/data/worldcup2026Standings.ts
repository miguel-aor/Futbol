// =====================================================================
// worldcup2026Standings.ts — posiciones de grupos del Mundial 2026.
//
// Origen: screenshots de 365Scores que el usuario compartió (carpeta
// "estadisticas mundial / Posiciones actuales 21-06-2026 3 AM MTY").
// Corte: 21 de junio de 2026, 03:00 America/Mexico_City.
//
// reliability "manual_screenshot": transcripción manual de capturas, NO feed
// oficial conectado. Puntos, GF, GA, diferencia y posición se leyeron de las
// tablas; el detalle de victorias/empates/derrotas y los desempates avanzados
// FIFA quedan PENDIENTES DE VALIDACIÓN (ver STANDINGS_WARNINGS).
//
// No es la fuente del modelo base; es una capa de contexto adicional.
// =====================================================================

export type GroupId =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";

export type StandingReliability = "confirmed" | "reported" | "manual_screenshot" | "computed";
export type GroupTeamStatus = "qualified" | "eliminated" | "active";

export interface GroupStanding {
  group: GroupId;
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
  status: GroupTeamStatus;
  source: string;
  reliability: StandingReliability;
  lastUpdated: string;
}

export const STANDINGS_LAST_UPDATED = "2026-06-21T03:00:00-06:00";
export const STANDINGS_SOURCE = "365Scores screenshot";
export const STANDINGS_CUTOFF_CDMX = "2026-06-21 03:00 America/Mexico_City";
export const STANDINGS_WARNINGS = [
  "Posiciones transcritas de screenshots 365Scores (manual_screenshot), no feed oficial.",
  "Desempates avanzados (head-to-head/fair play) pendientes de validación.",
];

// Helper compacto: deriva W/D/L/GD/status quedan explícitos por legibilidad.
function s(
  group: GroupId, teamId: string, teamName: string, position: number,
  played: number, wins: number, draws: number, losses: number,
  goalsFor: number, goalsAgainst: number, points: number, status: GroupTeamStatus = "active",
): GroupStanding {
  return {
    group, teamId, teamName, position, played, wins, draws, losses,
    goalsFor, goalsAgainst, goalDifference: goalsFor - goalsAgainst, points, status,
    source: STANDINGS_SOURCE, reliability: "manual_screenshot", lastUpdated: STANDINGS_LAST_UPDATED,
  };
}

/** Snapshot de posiciones por grupo al corte (21-06-2026 03:00 CDMX). */
export const WORLD_CUP_STANDINGS: GroupStanding[] = [
  // Grupo A (2 jugados)
  s("A", "mex", "México", 1, 2, 2, 0, 0, 3, 0, 6, "qualified"),
  s("A", "kor", "Corea del Sur", 2, 2, 1, 0, 1, 2, 2, 3),
  s("A", "cze", "Chequia", 3, 2, 1, 0, 1, 2, 3, 3),
  s("A", "rsa", "Sudáfrica", 4, 2, 0, 0, 2, 1, 3, 0),

  // Grupo B (2 jugados)
  s("B", "can", "Canadá", 1, 2, 1, 1, 0, 7, 1, 4),
  s("B", "sui", "Suiza", 2, 2, 1, 1, 0, 5, 2, 4),
  s("B", "bih", "Bosnia y Herzegovina", 3, 2, 0, 1, 1, 2, 5, 1),
  s("B", "qat", "Catar", 4, 2, 0, 0, 2, 1, 7, 0),

  // Grupo C (2 jugados)
  s("C", "bra", "Brasil", 1, 2, 1, 1, 0, 4, 1, 4),
  s("C", "mar", "Marruecos", 2, 2, 1, 1, 0, 3, 1, 4),
  s("C", "sco", "Escocia", 3, 2, 0, 1, 1, 1, 2, 1),
  s("C", "hai", "Haití", 4, 2, 0, 0, 2, 0, 4, 0, "eliminated"),

  // Grupo D (2 jugados)
  s("D", "usa", "Estados Unidos", 1, 2, 2, 0, 0, 6, 1, 6, "qualified"),
  s("D", "aus", "Australia", 2, 2, 1, 0, 1, 2, 2, 3),
  s("D", "par", "Paraguay", 3, 2, 1, 0, 1, 3, 2, 3),
  s("D", "tur", "Turquía", 4, 2, 0, 0, 2, 1, 7, 0, "eliminated"),

  // Grupo E (2 jugados)
  s("E", "ger", "Alemania", 1, 2, 2, 0, 0, 9, 2, 6, "qualified"),
  s("E", "civ", "Costa de Marfil", 2, 2, 1, 0, 1, 2, 2, 3),
  s("E", "ecu", "Ecuador", 3, 2, 0, 1, 1, 0, 1, 1),
  s("E", "cuw", "Curazao", 4, 2, 0, 1, 1, 1, 7, 1),

  // Grupo F (2 jugados)
  s("F", "ned", "Países Bajos", 1, 2, 1, 1, 0, 7, 3, 4),
  s("F", "jpn", "Japón", 2, 2, 1, 1, 0, 6, 2, 4),
  s("F", "swe", "Suecia", 3, 2, 1, 0, 1, 6, 6, 3),
  s("F", "tun", "Túnez", 4, 2, 0, 0, 2, 1, 9, 0, "eliminated"),

  // Grupo G (1 jugado)
  s("G", "nzl", "Nueva Zelanda", 1, 1, 0, 1, 0, 2, 2, 1),
  s("G", "irn", "Irán", 2, 1, 0, 1, 0, 2, 2, 1),
  s("G", "bel", "Bélgica", 3, 1, 0, 1, 0, 1, 1, 1),
  s("G", "egy", "Egipto", 4, 1, 0, 1, 0, 1, 1, 1),

  // Grupo H (1 jugado)
  s("H", "uru", "Uruguay", 1, 1, 0, 1, 0, 1, 1, 1),
  s("H", "ksa", "Arabia Saudita", 2, 1, 0, 1, 0, 1, 1, 1),
  s("H", "esp", "España", 3, 1, 0, 1, 0, 0, 0, 1),
  s("H", "cpv", "Cabo Verde", 4, 1, 0, 1, 0, 0, 0, 1),

  // Grupo I (1 jugado)
  s("I", "nor", "Noruega", 1, 1, 1, 0, 0, 4, 1, 3),
  s("I", "fra", "Francia", 2, 1, 1, 0, 0, 3, 1, 3),
  s("I", "sen", "Senegal", 3, 1, 0, 0, 1, 1, 3, 0),
  s("I", "irq", "Irak", 4, 1, 0, 0, 1, 1, 4, 0),

  // Grupo J (1 jugado)
  s("J", "arg", "Argentina", 1, 1, 1, 0, 0, 3, 0, 3),
  s("J", "aut", "Austria", 2, 1, 1, 0, 0, 3, 1, 3),
  s("J", "jor", "Jordania", 3, 1, 0, 0, 1, 1, 3, 0),
  s("J", "alg", "Argelia", 4, 1, 0, 0, 1, 0, 3, 0),

  // Grupo K (1 jugado)
  s("K", "col", "Colombia", 1, 1, 1, 0, 0, 3, 1, 3),
  s("K", "cod", "RD Congo", 2, 1, 0, 1, 0, 1, 1, 1),
  s("K", "por", "Portugal", 3, 1, 0, 1, 0, 1, 1, 1),
  s("K", "uzb", "Uzbekistán", 4, 1, 0, 0, 1, 1, 2, 0),

  // Grupo L (1 jugado)
  s("L", "eng", "Inglaterra", 1, 1, 1, 0, 0, 4, 2, 3),
  s("L", "gha", "Ghana", 2, 1, 1, 0, 0, 1, 0, 3),
  s("L", "pan", "Panamá", 3, 1, 0, 0, 1, 0, 1, 0),
  s("L", "cro", "Croacia", 4, 1, 0, 0, 1, 2, 4, 0),
];
