// =====================================================================
// FUENTE CENTRAL DE SELECCIONES PARTICIPANTES DEL MUNDIAL 2026.
// No declarar selecciones en ningun otro archivo. Si hay que agregar,
// quitar o reasignar una seleccion, se hace AQUI.
//
// Son datos mock/placeholder configurables: grupos, ranking y
// confederaciones son aproximados y sirven para llenar la UI.
// =====================================================================

import type { Confederation } from "@/lib/data-providers/types";

/** Identidad minima de una seleccion. El mockProvider la enriquece
 *  con forma reciente, fuerzas ofensivas/defensivas, etc. */
export interface TeamSeed {
  id: string;
  name: string;
  code: string; // 3 letras
  flag: string; // emoji
  confederation: Confederation;
  groupId: string; // "A".."L"
  fifaRanking: number;
}

/** Los 12 grupos del Mundial. */
export const GROUP_IDS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
] as const;

/** 48 selecciones repartidas en 12 grupos de 4 (mock configurable). */
export const WORLD_CUP_TEAMS: TeamSeed[] = [
  // Grupo A
  { id: "mex", name: "Mexico", code: "MEX", flag: "🇲🇽", confederation: "CONCACAF", groupId: "A", fifaRanking: 14 },
  { id: "cro", name: "Croacia", code: "CRO", flag: "🇭🇷", confederation: "UEFA", groupId: "A", fifaRanking: 10 },
  { id: "ecu", name: "Ecuador", code: "ECU", flag: "🇪🇨", confederation: "CONMEBOL", groupId: "A", fifaRanking: 23 },
  { id: "qat", name: "Catar", code: "QAT", flag: "🇶🇦", confederation: "AFC", groupId: "A", fifaRanking: 36 },

  // Grupo B
  { id: "can", name: "Canada", code: "CAN", flag: "🇨🇦", confederation: "CONCACAF", groupId: "B", fifaRanking: 31 },
  { id: "bel", name: "Belgica", code: "BEL", flag: "🇧🇪", confederation: "UEFA", groupId: "B", fifaRanking: 6 },
  { id: "mar", name: "Marruecos", code: "MAR", flag: "🇲🇦", confederation: "CAF", groupId: "B", fifaRanking: 12 },
  { id: "kor", name: "Corea del Sur", code: "KOR", flag: "🇰🇷", confederation: "AFC", groupId: "B", fifaRanking: 22 },

  // Grupo C
  { id: "usa", name: "Estados Unidos", code: "USA", flag: "🇺🇸", confederation: "CONCACAF", groupId: "C", fifaRanking: 16 },
  { id: "ned", name: "Paises Bajos", code: "NED", flag: "🇳🇱", confederation: "UEFA", groupId: "C", fifaRanking: 7 },
  { id: "uru", name: "Uruguay", code: "URU", flag: "🇺🇾", confederation: "CONMEBOL", groupId: "C", fifaRanking: 15 },
  { id: "jpn", name: "Japon", code: "JPN", flag: "🇯🇵", confederation: "AFC", groupId: "C", fifaRanking: 18 },

  // Grupo D
  { id: "arg", name: "Argentina", code: "ARG", flag: "🇦🇷", confederation: "CONMEBOL", groupId: "D", fifaRanking: 1 },
  { id: "pol", name: "Polonia", code: "POL", flag: "🇵🇱", confederation: "UEFA", groupId: "D", fifaRanking: 27 },
  { id: "tun", name: "Tunez", code: "TUN", flag: "🇹🇳", confederation: "CAF", groupId: "D", fifaRanking: 41 },
  { id: "aus", name: "Australia", code: "AUS", flag: "🇦🇺", confederation: "AFC", groupId: "D", fifaRanking: 24 },

  // Grupo E
  { id: "fra", name: "Francia", code: "FRA", flag: "🇫🇷", confederation: "UEFA", groupId: "E", fifaRanking: 2 },
  { id: "sen", name: "Senegal", code: "SEN", flag: "🇸🇳", confederation: "CAF", groupId: "E", fifaRanking: 17 },
  { id: "per", name: "Peru", code: "PER", flag: "🇵🇪", confederation: "CONMEBOL", groupId: "E", fifaRanking: 33 },
  { id: "irn", name: "Iran", code: "IRN", flag: "🇮🇷", confederation: "AFC", groupId: "E", fifaRanking: 20 },

  // Grupo F
  { id: "eng", name: "Inglaterra", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", confederation: "UEFA", groupId: "F", fifaRanking: 4 },
  { id: "col", name: "Colombia", code: "COL", flag: "🇨🇴", confederation: "CONMEBOL", groupId: "F", fifaRanking: 13 },
  { id: "egy", name: "Egipto", code: "EGY", flag: "🇪🇬", confederation: "CAF", groupId: "F", fifaRanking: 35 },
  { id: "sau", name: "Arabia Saudita", code: "SAU", flag: "🇸🇦", confederation: "AFC", groupId: "F", fifaRanking: 56 },

  // Grupo G
  { id: "bra", name: "Brasil", code: "BRA", flag: "🇧🇷", confederation: "CONMEBOL", groupId: "G", fifaRanking: 5 },
  { id: "ger", name: "Alemania", code: "GER", flag: "🇩🇪", confederation: "UEFA", groupId: "G", fifaRanking: 9 },
  { id: "gha", name: "Ghana", code: "GHA", flag: "🇬🇭", confederation: "CAF", groupId: "G", fifaRanking: 61 },
  { id: "nzl", name: "Nueva Zelanda", code: "NZL", flag: "🇳🇿", confederation: "OFC", groupId: "G", fifaRanking: 86 },

  // Grupo H
  { id: "esp", name: "Espana", code: "ESP", flag: "🇪🇸", confederation: "UEFA", groupId: "H", fifaRanking: 3 },
  { id: "mex2", name: "Costa Rica", code: "CRC", flag: "🇨🇷", confederation: "CONCACAF", groupId: "H", fifaRanking: 54 },
  { id: "civ", name: "Costa de Marfil", code: "CIV", flag: "🇨🇮", confederation: "CAF", groupId: "H", fifaRanking: 39 },
  { id: "par", name: "Paraguay", code: "PAR", flag: "🇵🇾", confederation: "CONMEBOL", groupId: "H", fifaRanking: 45 },

  // Grupo I
  { id: "por", name: "Portugal", code: "POR", flag: "🇵🇹", confederation: "UEFA", groupId: "I", fifaRanking: 8 },
  { id: "nga", name: "Nigeria", code: "NGA", flag: "🇳🇬", confederation: "CAF", groupId: "I", fifaRanking: 28 },
  { id: "pan", name: "Panama", code: "PAN", flag: "🇵🇦", confederation: "CONCACAF", groupId: "I", fifaRanking: 43 },
  { id: "uzb", name: "Uzbekistan", code: "UZB", flag: "🇺🇿", confederation: "AFC", groupId: "I", fifaRanking: 57 },

  // Grupo J
  { id: "ita", name: "Italia", code: "ITA", flag: "🇮🇹", confederation: "UEFA", groupId: "J", fifaRanking: 11 },
  { id: "chi", name: "Chile", code: "CHI", flag: "🇨🇱", confederation: "CONMEBOL", groupId: "J", fifaRanking: 38 },
  { id: "cmr", name: "Camerun", code: "CMR", flag: "🇨🇲", confederation: "CAF", groupId: "J", fifaRanking: 42 },
  { id: "jor", name: "Jordania", code: "JOR", flag: "🇯🇴", confederation: "AFC", groupId: "J", fifaRanking: 64 },

  // Grupo K
  { id: "den", name: "Dinamarca", code: "DEN", flag: "🇩🇰", confederation: "UEFA", groupId: "K", fifaRanking: 19 },
  { id: "mli", name: "Mali", code: "MLI", flag: "🇲🇱", confederation: "CAF", groupId: "K", fifaRanking: 49 },
  { id: "hon", name: "Honduras", code: "HON", flag: "🇭🇳", confederation: "CONCACAF", groupId: "K", fifaRanking: 67 },
  { id: "rsa", name: "Sudafrica", code: "RSA", flag: "🇿🇦", confederation: "CAF", groupId: "K", fifaRanking: 58 },

  // Grupo L
  { id: "sui", name: "Suiza", code: "SUI", flag: "🇨🇭", confederation: "UEFA", groupId: "L", fifaRanking: 21 },
  { id: "srb", name: "Serbia", code: "SRB", flag: "🇷🇸", confederation: "UEFA", groupId: "L", fifaRanking: 29 },
  { id: "ven", name: "Venezuela", code: "VEN", flag: "🇻🇪", confederation: "CONMEBOL", groupId: "L", fifaRanking: 48 },
  { id: "alg", name: "Argelia", code: "ALG", flag: "🇩🇿", confederation: "CAF", groupId: "L", fifaRanking: 37 },
];

/** Mapa rapido id -> seed. */
export const TEAM_SEED_BY_ID: Record<string, TeamSeed> = Object.fromEntries(
  WORLD_CUP_TEAMS.map((t) => [t.id, t]),
);
