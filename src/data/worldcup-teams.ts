// =====================================================================
// FUENTE CENTRAL DE SELECCIONES DEL MUNDIAL 2026 (DATOS REALES).
//
// Grupos del sorteo final celebrado el 5 de diciembre de 2025 en
// Washington D.C. Fuentes: Wikipedia (2026 FIFA World Cup draw) y ESPN.
// El ranking FIFA es aproximado (placeholder) y solo alimenta el modelo.
//
// No declarar selecciones en ningun otro archivo. Editar aqui.
// =====================================================================

import type { Confederation } from "@/lib/data-providers/types";

export interface TeamSeed {
  id: string;
  name: string;
  code: string; // 3 letras
  flag: string; // emoji
  confederation: Confederation;
  groupId: string; // "A".."L"
  fifaRanking: number; // aproximado
}

export const GROUP_IDS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
] as const;

/** 48 selecciones reales del Mundial 2026, por grupo (cabeza de serie primero). */
export const WORLD_CUP_TEAMS: TeamSeed[] = [
  // Grupo A
  { id: "mex", name: "Mexico", code: "MEX", flag: "🇲🇽", confederation: "CONCACAF", groupId: "A", fifaRanking: 14 },
  { id: "kor", name: "Corea del Sur", code: "KOR", flag: "🇰🇷", confederation: "AFC", groupId: "A", fifaRanking: 22 },
  { id: "cze", name: "Chequia", code: "CZE", flag: "🇨🇿", confederation: "UEFA", groupId: "A", fifaRanking: 42 },
  { id: "rsa", name: "Sudafrica", code: "RSA", flag: "🇿🇦", confederation: "CAF", groupId: "A", fifaRanking: 58 },

  // Grupo B
  { id: "can", name: "Canada", code: "CAN", flag: "🇨🇦", confederation: "CONCACAF", groupId: "B", fifaRanking: 27 },
  { id: "sui", name: "Suiza", code: "SUI", flag: "🇨🇭", confederation: "UEFA", groupId: "B", fifaRanking: 19 },
  { id: "qat", name: "Catar", code: "QAT", flag: "🇶🇦", confederation: "AFC", groupId: "B", fifaRanking: 36 },
  { id: "bih", name: "Bosnia y Herzegovina", code: "BIH", flag: "🇧🇦", confederation: "UEFA", groupId: "B", fifaRanking: 75 },

  // Grupo C
  { id: "bra", name: "Brasil", code: "BRA", flag: "🇧🇷", confederation: "CONMEBOL", groupId: "C", fifaRanking: 5 },
  { id: "mar", name: "Marruecos", code: "MAR", flag: "🇲🇦", confederation: "CAF", groupId: "C", fifaRanking: 12 },
  { id: "sco", name: "Escocia", code: "SCO", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", confederation: "UEFA", groupId: "C", fifaRanking: 39 },
  { id: "hai", name: "Haiti", code: "HAI", flag: "🇭🇹", confederation: "CONCACAF", groupId: "C", fifaRanking: 83 },

  // Grupo D
  { id: "usa", name: "Estados Unidos", code: "USA", flag: "🇺🇸", confederation: "CONCACAF", groupId: "D", fifaRanking: 16 },
  { id: "aus", name: "Australia", code: "AUS", flag: "🇦🇺", confederation: "AFC", groupId: "D", fifaRanking: 25 },
  { id: "tur", name: "Turquia", code: "TUR", flag: "🇹🇷", confederation: "UEFA", groupId: "D", fifaRanking: 26 },
  { id: "par", name: "Paraguay", code: "PAR", flag: "🇵🇾", confederation: "CONMEBOL", groupId: "D", fifaRanking: 35 },

  // Grupo E
  { id: "ger", name: "Alemania", code: "GER", flag: "🇩🇪", confederation: "UEFA", groupId: "E", fifaRanking: 9 },
  { id: "civ", name: "Costa de Marfil", code: "CIV", flag: "🇨🇮", confederation: "CAF", groupId: "E", fifaRanking: 40 },
  { id: "ecu", name: "Ecuador", code: "ECU", flag: "🇪🇨", confederation: "CONMEBOL", groupId: "E", fifaRanking: 23 },
  { id: "cuw", name: "Curazao", code: "CUW", flag: "🇨🇼", confederation: "CONCACAF", groupId: "E", fifaRanking: 82 },

  // Grupo F
  { id: "ned", name: "Paises Bajos", code: "NED", flag: "🇳🇱", confederation: "UEFA", groupId: "F", fifaRanking: 7 },
  { id: "jpn", name: "Japon", code: "JPN", flag: "🇯🇵", confederation: "AFC", groupId: "F", fifaRanking: 18 },
  { id: "swe", name: "Suecia", code: "SWE", flag: "🇸🇪", confederation: "UEFA", groupId: "F", fifaRanking: 33 },
  { id: "tun", name: "Tunez", code: "TUN", flag: "🇹🇳", confederation: "CAF", groupId: "F", fifaRanking: 41 },

  // Grupo G
  { id: "bel", name: "Belgica", code: "BEL", flag: "🇧🇪", confederation: "UEFA", groupId: "G", fifaRanking: 8 },
  { id: "irn", name: "Iran", code: "IRN", flag: "🇮🇷", confederation: "AFC", groupId: "G", fifaRanking: 20 },
  { id: "nzl", name: "Nueva Zelanda", code: "NZL", flag: "🇳🇿", confederation: "OFC", groupId: "G", fifaRanking: 86 },
  { id: "egy", name: "Egipto", code: "EGY", flag: "🇪🇬", confederation: "CAF", groupId: "G", fifaRanking: 30 },

  // Grupo H
  { id: "esp", name: "Espana", code: "ESP", flag: "🇪🇸", confederation: "UEFA", groupId: "H", fifaRanking: 2 },
  { id: "uru", name: "Uruguay", code: "URU", flag: "🇺🇾", confederation: "CONMEBOL", groupId: "H", fifaRanking: 15 },
  { id: "ksa", name: "Arabia Saudita", code: "KSA", flag: "🇸🇦", confederation: "AFC", groupId: "H", fifaRanking: 60 },
  { id: "cpv", name: "Cabo Verde", code: "CPV", flag: "🇨🇻", confederation: "CAF", groupId: "H", fifaRanking: 70 },

  // Grupo I
  { id: "fra", name: "Francia", code: "FRA", flag: "🇫🇷", confederation: "UEFA", groupId: "I", fifaRanking: 3 },
  { id: "sen", name: "Senegal", code: "SEN", flag: "🇸🇳", confederation: "CAF", groupId: "I", fifaRanking: 17 },
  { id: "nor", name: "Noruega", code: "NOR", flag: "🇳🇴", confederation: "UEFA", groupId: "I", fifaRanking: 28 },
  { id: "irq", name: "Irak", code: "IRQ", flag: "🇮🇶", confederation: "AFC", groupId: "I", fifaRanking: 57 },

  // Grupo J
  { id: "arg", name: "Argentina", code: "ARG", flag: "🇦🇷", confederation: "CONMEBOL", groupId: "J", fifaRanking: 1 },
  { id: "aut", name: "Austria", code: "AUT", flag: "🇦🇹", confederation: "UEFA", groupId: "J", fifaRanking: 24 },
  { id: "alg", name: "Argelia", code: "ALG", flag: "🇩🇿", confederation: "CAF", groupId: "J", fifaRanking: 37 },
  { id: "jor", name: "Jordania", code: "JOR", flag: "🇯🇴", confederation: "AFC", groupId: "J", fifaRanking: 64 },

  // Grupo K
  { id: "por", name: "Portugal", code: "POR", flag: "🇵🇹", confederation: "UEFA", groupId: "K", fifaRanking: 6 },
  { id: "col", name: "Colombia", code: "COL", flag: "🇨🇴", confederation: "CONMEBOL", groupId: "K", fifaRanking: 13 },
  { id: "uzb", name: "Uzbekistan", code: "UZB", flag: "🇺🇿", confederation: "AFC", groupId: "K", fifaRanking: 54 },
  { id: "cod", name: "RD Congo", code: "COD", flag: "🇨🇩", confederation: "CAF", groupId: "K", fifaRanking: 56 },

  // Grupo L
  { id: "eng", name: "Inglaterra", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", confederation: "UEFA", groupId: "L", fifaRanking: 4 },
  { id: "cro", name: "Croacia", code: "CRO", flag: "🇭🇷", confederation: "UEFA", groupId: "L", fifaRanking: 10 },
  { id: "gha", name: "Ghana", code: "GHA", flag: "🇬🇭", confederation: "CAF", groupId: "L", fifaRanking: 73 },
  { id: "pan", name: "Panama", code: "PAN", flag: "🇵🇦", confederation: "CONCACAF", groupId: "L", fifaRanking: 31 },
];

export const TEAM_SEED_BY_ID: Record<string, TeamSeed> = Object.fromEntries(
  WORLD_CUP_TEAMS.map((t) => [t.id, t]),
);
