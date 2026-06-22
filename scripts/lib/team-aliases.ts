/* =====================================================================
 * Mapa de nombres de martj42 (INGLÉS) → id de 3 letras del repo.
 *
 * Riesgo nº1 de la calibración: worldcup-teams.ts usa nombres en español
 * ("Chequia", "Sudafrica", "Catar"); martj42 usa inglés ("Czech Republic",
 * "South Africa", "Qatar"). Este mapa puentea inglés→id, con normalización
 * tolerante a acentos/variantes (Türkiye/Turkey, Côte d'Ivoire/Ivory Coast…).
 *
 * `assertAll48Covered()` falla ruidoso si alguna de las 48 selecciones del
 * Mundial no es alcanzable — así un equipo jamás queda en 1500 por silencio.
 * ===================================================================== */

import { WORLD_CUP_TEAMS } from "../../src/data/worldcup-teams";

/** Normaliza un nombre: minúsculas, sin acentos, sin puntuación, espacios colapsados. */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita diacríticos (combining marks)
    .toLowerCase()
    .replace(/[.'’`]/g, "") // apóstrofos/puntos
    .replace(/[^a-z0-9]+/g, " ") // resto de símbolos → espacio
    .trim()
    .replace(/\s+/g, " ");
}

/** Pares [nombre martj42 (inglés/variantes), id]. Se normalizan al construir el mapa. */
const ALIAS_PAIRS: ReadonlyArray<readonly [string, string]> = [
  // Grupo A
  ["Mexico", "mex"],
  ["South Korea", "kor"], ["Korea Republic", "kor"],
  ["Czech Republic", "cze"], ["Czechia", "cze"],
  ["South Africa", "rsa"],
  // Grupo B
  ["Canada", "can"],
  ["Switzerland", "sui"],
  ["Qatar", "qat"],
  ["Bosnia and Herzegovina", "bih"], ["Bosnia-Herzegovina", "bih"],
  // Grupo C
  ["Brazil", "bra"],
  ["Morocco", "mar"],
  ["Scotland", "sco"],
  ["Haiti", "hai"],
  // Grupo D
  ["United States", "usa"], ["USA", "usa"], ["United States of America", "usa"],
  ["Australia", "aus"],
  ["Turkey", "tur"], ["Türkiye", "tur"], ["Turkiye", "tur"],
  ["Paraguay", "par"],
  // Grupo E
  ["Germany", "ger"],
  ["Ivory Coast", "civ"], ["Côte d'Ivoire", "civ"], ["Cote d'Ivoire", "civ"],
  ["Ecuador", "ecu"],
  ["Curaçao", "cuw"], ["Curacao", "cuw"],
  // Grupo F
  ["Netherlands", "ned"],
  ["Japan", "jpn"],
  ["Sweden", "swe"],
  ["Tunisia", "tun"],
  // Grupo G
  ["Belgium", "bel"],
  ["Iran", "irn"], ["Iran Islamic Republic", "irn"],
  ["New Zealand", "nzl"],
  ["Egypt", "egy"],
  // Grupo H
  ["Spain", "esp"],
  ["Uruguay", "uru"],
  ["Saudi Arabia", "ksa"],
  ["Cape Verde", "cpv"], ["Cabo Verde", "cpv"],
  // Grupo I
  ["France", "fra"],
  ["Senegal", "sen"],
  ["Norway", "nor"],
  ["Iraq", "irq"],
  // Grupo J
  ["Argentina", "arg"],
  ["Austria", "aut"],
  ["Algeria", "alg"],
  ["Jordan", "jor"],
  // Grupo K
  ["Portugal", "por"],
  ["Colombia", "col"],
  ["Uzbekistan", "uzb"],
  ["DR Congo", "cod"], ["Congo DR", "cod"], ["Democratic Republic of the Congo", "cod"],
  ["Congo Kinshasa", "cod"],
  // Grupo L
  ["England", "eng"],
  ["Croatia", "cro"],
  ["Ghana", "gha"],
  ["Panama", "pan"],
];

/** Nombre normalizado → id de 3 letras (solo las 48 + variantes). */
export const MARTJ42_NAME_TO_ID: Record<string, string> = Object.fromEntries(
  ALIAS_PAIRS.map(([name, id]) => [normalizeName(name), id]),
);

/**
 * Verifica que las 48 selecciones del Mundial sean alcanzables desde el mapa.
 * Lanza con la lista de ids faltantes si no. Determinista.
 */
export function assertAll48Covered(): void {
  const covered = new Set(Object.values(MARTJ42_NAME_TO_ID));
  const missing = WORLD_CUP_TEAMS.filter((t) => !covered.has(t.id)).map((t) => t.id);
  if (missing.length > 0) {
    throw new Error(
      `team-aliases: ${missing.length} selección(es) del Mundial sin alias inglés → id: ${missing.join(", ")}`,
    );
  }
}
