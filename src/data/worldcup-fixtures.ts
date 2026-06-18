// =====================================================================
// CALENDARIO REAL del Mundial 2026 - fase de grupos (72 partidos).
// Fuente: ESPN (match schedule) + Wikipedia + 365Scores/Milenio (resultados
// del 17 jun). Capturado el 2026-06-18.
//
// La jornada 1 (11-17 jun) esta COMPLETA con resultados REALES. La jornada 2
// (desde el 18 jun) esta programada (score null) y la app le calcula
// prediccion. La hora exacta de algunos partidos es aproximada.
// =====================================================================

/** Timestamp de captura de estos datos (publicos). */
export const DATA_CAPTURED_AT = "2026-06-18T12:00:00.000Z";

/** Sedes reales del Mundial 2026. */
export const VENUES: Record<string, { venue: string; city: string }> = {
  "mexico-city": { venue: "Estadio Azteca", city: "Ciudad de Mexico" },
  guadalajara: { venue: "Estadio Akron", city: "Guadalajara" },
  monterrey: { venue: "Estadio BBVA", city: "Monterrey" },
  toronto: { venue: "BMO Field", city: "Toronto" },
  vancouver: { venue: "BC Place", city: "Vancouver" },
  "los-angeles": { venue: "SoFi Stadium", city: "Los Angeles" },
  "bay-area": { venue: "Levi's Stadium", city: "San Francisco Bay" },
  "new-york": { venue: "MetLife Stadium", city: "Nueva York/Nueva Jersey" },
  boston: { venue: "Gillette Stadium", city: "Boston" },
  dallas: { venue: "AT&T Stadium", city: "Dallas" },
  houston: { venue: "NRG Stadium", city: "Houston" },
  philadelphia: { venue: "Lincoln Financial Field", city: "Philadelphia" },
  atlanta: { venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  seattle: { venue: "Lumen Field", city: "Seattle" },
  miami: { venue: "Hard Rock Stadium", city: "Miami" },
  "kansas-city": { venue: "Arrowhead Stadium", city: "Kansas City" },
};

export interface FixtureSeed {
  id: string;
  groupId: string;
  homeId: string;
  awayId: string;
  kickoff: string; // ISO (hora aproximada)
  venueId: keyof typeof VENUES;
  homeScore: number | null;
  awayScore: number | null;
}

const f = (
  id: string,
  groupId: string,
  homeId: string,
  awayId: string,
  date: string,
  hourUtc: number,
  venueId: keyof typeof VENUES,
  homeScore: number | null = null,
  awayScore: number | null = null,
): FixtureSeed => ({
  id,
  groupId,
  homeId,
  awayId,
  kickoff: `${date}T${String(hourUtc).padStart(2, "0")}:00:00.000Z`,
  venueId,
  homeScore,
  awayScore,
});

/** Jornada 1 (11-17 jun): resultados REALES. Jornadas 2-3: programadas. */
export const WORLD_CUP_FIXTURES: FixtureSeed[] = [
  // ---- Jornada 1 (resultados reales) ----
  f("wc-A-1", "A", "mex", "rsa", "2026-06-11", 16, "mexico-city", 2, 0),
  f("wc-A-2", "A", "kor", "cze", "2026-06-11", 19, "guadalajara", 2, 1),
  f("wc-B-1", "B", "can", "bih", "2026-06-12", 16, "toronto", 1, 1),
  f("wc-D-1", "D", "usa", "par", "2026-06-12", 20, "los-angeles", 4, 1),
  f("wc-B-2", "B", "qat", "sui", "2026-06-13", 16, "bay-area", 1, 1),
  f("wc-C-1", "C", "bra", "mar", "2026-06-13", 18, "new-york", 1, 1),
  f("wc-C-2", "C", "hai", "sco", "2026-06-13", 20, "boston", 0, 1),
  f("wc-D-2", "D", "aus", "tur", "2026-06-13", 22, "vancouver", 2, 0),
  f("wc-E-1", "E", "ger", "cuw", "2026-06-14", 16, "houston", 7, 1),
  f("wc-F-1", "F", "ned", "jpn", "2026-06-14", 18, "dallas", 2, 2),
  f("wc-E-2", "E", "civ", "ecu", "2026-06-14", 20, "philadelphia", 1, 0),
  f("wc-F-2", "F", "swe", "tun", "2026-06-14", 22, "monterrey", 5, 1),
  f("wc-H-1", "H", "esp", "cpv", "2026-06-15", 16, "atlanta", 0, 0),
  f("wc-G-1", "G", "bel", "egy", "2026-06-15", 18, "seattle", 1, 1),
  f("wc-H-2", "H", "ksa", "uru", "2026-06-15", 20, "miami", 1, 1),
  f("wc-G-2", "G", "irn", "nzl", "2026-06-15", 22, "los-angeles", 2, 2),
  f("wc-I-1", "I", "fra", "sen", "2026-06-16", 16, "new-york", 3, 1),
  f("wc-I-2", "I", "irq", "nor", "2026-06-16", 18, "boston", 1, 4),
  f("wc-J-1", "J", "arg", "alg", "2026-06-16", 20, "kansas-city", 3, 0),
  f("wc-J-2", "J", "aut", "jor", "2026-06-16", 22, "bay-area", 3, 1),
  f("wc-K-1", "K", "por", "cod", "2026-06-17", 16, "houston", 1, 1),
  f("wc-L-1", "L", "eng", "cro", "2026-06-17", 20, "dallas", 4, 2),
  f("wc-L-2", "L", "gha", "pan", "2026-06-17", 23, "toronto", 1, 0),
  f("wc-K-2", "K", "uzb", "col", "2026-06-18", 1, "mexico-city", 1, 3),

  // ---- Jornada 2 (programada) ----
  f("wc-A-3", "A", "cze", "rsa", "2026-06-18", 16, "atlanta"),
  f("wc-B-3", "B", "sui", "bih", "2026-06-18", 18, "los-angeles"),
  f("wc-B-4", "B", "can", "qat", "2026-06-18", 22, "vancouver"),
  f("wc-A-4", "A", "mex", "kor", "2026-06-19", 1, "guadalajara"),
  f("wc-D-3", "D", "usa", "aus", "2026-06-19", 22, "seattle"),
  f("wc-C-3", "C", "sco", "mar", "2026-06-19", 16, "boston"),
  f("wc-C-4", "C", "bra", "hai", "2026-06-19", 19, "philadelphia"),
  f("wc-D-4", "D", "tur", "par", "2026-06-19", 22, "bay-area"),
  f("wc-F-3", "F", "ned", "swe", "2026-06-20", 16, "houston"),
  f("wc-E-3", "E", "ger", "civ", "2026-06-20", 18, "toronto"),
  f("wc-E-4", "E", "ecu", "cuw", "2026-06-20", 20, "kansas-city"),
  f("wc-F-4", "F", "tun", "jpn", "2026-06-20", 22, "monterrey"),
  f("wc-H-3", "H", "esp", "ksa", "2026-06-21", 16, "atlanta"),
  f("wc-G-3", "G", "bel", "irn", "2026-06-21", 18, "los-angeles"),
  f("wc-H-4", "H", "uru", "cpv", "2026-06-21", 20, "miami"),
  f("wc-G-4", "G", "nzl", "egy", "2026-06-21", 22, "vancouver"),
  f("wc-J-3", "J", "arg", "aut", "2026-06-22", 16, "dallas"),
  f("wc-I-3", "I", "fra", "irq", "2026-06-22", 18, "philadelphia"),
  f("wc-I-4", "I", "nor", "sen", "2026-06-22", 20, "new-york"),
  f("wc-J-4", "J", "jor", "alg", "2026-06-22", 22, "bay-area"),
  f("wc-K-3", "K", "por", "uzb", "2026-06-23", 16, "houston"),
  f("wc-L-3", "L", "eng", "gha", "2026-06-23", 18, "boston"),
  f("wc-L-4", "L", "pan", "cro", "2026-06-23", 20, "toronto"),
  f("wc-K-4", "K", "col", "cod", "2026-06-23", 22, "guadalajara"),
  f("wc-B-5", "B", "sui", "can", "2026-06-24", 16, "vancouver"),
  f("wc-B-6", "B", "bih", "qat", "2026-06-24", 18, "seattle"),
  f("wc-C-5", "C", "sco", "bra", "2026-06-24", 20, "miami"),
  f("wc-C-6", "C", "mar", "hai", "2026-06-24", 22, "atlanta"),
  f("wc-A-5", "A", "cze", "mex", "2026-06-24", 23, "mexico-city"),
  f("wc-A-6", "A", "rsa", "kor", "2026-06-24", 23, "monterrey"),

  // ---- Jornada 3 (programada, horarios simultaneos) ----
  f("wc-E-5", "E", "ecu", "ger", "2026-06-25", 20, "new-york"),
  f("wc-E-6", "E", "cuw", "civ", "2026-06-25", 20, "philadelphia"),
  f("wc-F-5", "F", "jpn", "swe", "2026-06-25", 16, "dallas"),
  f("wc-F-6", "F", "tun", "ned", "2026-06-25", 16, "kansas-city"),
  f("wc-D-5", "D", "tur", "usa", "2026-06-25", 23, "los-angeles"),
  f("wc-D-6", "D", "par", "aus", "2026-06-25", 23, "bay-area"),
  f("wc-I-5", "I", "nor", "fra", "2026-06-26", 16, "boston"),
  f("wc-I-6", "I", "sen", "irq", "2026-06-26", 16, "toronto"),
  f("wc-H-5", "H", "cpv", "ksa", "2026-06-26", 20, "houston"),
  f("wc-H-6", "H", "uru", "esp", "2026-06-26", 20, "guadalajara"),
  f("wc-G-5", "G", "egy", "irn", "2026-06-26", 23, "seattle"),
  f("wc-G-6", "G", "nzl", "bel", "2026-06-26", 23, "vancouver"),
  f("wc-L-5", "L", "pan", "eng", "2026-06-27", 16, "new-york"),
  f("wc-L-6", "L", "cro", "gha", "2026-06-27", 16, "philadelphia"),
  f("wc-K-5", "K", "col", "por", "2026-06-27", 20, "miami"),
  f("wc-K-6", "K", "cod", "uzb", "2026-06-27", 20, "atlanta"),
  f("wc-J-5", "J", "alg", "aut", "2026-06-27", 23, "kansas-city"),
  f("wc-J-6", "J", "jor", "arg", "2026-06-27", 23, "dallas"),
];
