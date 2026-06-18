// =====================================================================
// Banderas de selecciones. Mapea teamId -> codigo ISO 3166-1 alpha-2
// (o subdivision para Inglaterra/Escocia) y arma URLs de FlagCDN.
// Fallback a emoji si no hay match. Fuente unica de banderas de la app.
// =====================================================================

/** teamId -> codigo de bandera para FlagCDN (ISO2 o gb-eng/gb-sct). */
export const TEAM_ISO2: Record<string, string> = {
  mex: "mx", kor: "kr", cze: "cz", rsa: "za",
  can: "ca", sui: "ch", qat: "qa", bih: "ba",
  bra: "br", mar: "ma", sco: "gb-sct", hai: "ht",
  usa: "us", aus: "au", tur: "tr", par: "py",
  ger: "de", civ: "ci", ecu: "ec", cuw: "cw",
  ned: "nl", jpn: "jp", swe: "se", tun: "tn",
  bel: "be", irn: "ir", nzl: "nz", egy: "eg",
  esp: "es", uru: "uy", ksa: "sa", cpv: "cv",
  fra: "fr", sen: "sn", nor: "no", irq: "iq",
  arg: "ar", aut: "at", alg: "dz", jor: "jo",
  por: "pt", col: "co", uzb: "uz", cod: "cd",
  eng: "gb-eng", cro: "hr", gha: "gh", pan: "pa",
};

/** Emojis de bandera como fallback (algunos no aplican a subdivisiones). */
export const TEAM_FLAG_EMOJI: Record<string, string> = {
  mex: "🇲🇽", kor: "🇰🇷", cze: "🇨🇿", rsa: "🇿🇦",
  can: "🇨🇦", sui: "🇨🇭", qat: "🇶🇦", bih: "🇧🇦",
  bra: "🇧🇷", mar: "🇲🇦", sco: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", hai: "🇭🇹",
  usa: "🇺🇸", aus: "🇦🇺", tur: "🇹🇷", par: "🇵🇾",
  ger: "🇩🇪", civ: "🇨🇮", ecu: "🇪🇨", cuw: "🇨🇼",
  ned: "🇳🇱", jpn: "🇯🇵", swe: "🇸🇪", tun: "🇹🇳",
  bel: "🇧🇪", irn: "🇮🇷", nzl: "🇳🇿", egy: "🇪🇬",
  esp: "🇪🇸", uru: "🇺🇾", ksa: "🇸🇦", cpv: "🇨🇻",
  fra: "🇫🇷", sen: "🇸🇳", nor: "🇳🇴", irq: "🇮🇶",
  arg: "🇦🇷", aut: "🇦🇹", alg: "🇩🇿", jor: "🇯🇴",
  por: "🇵🇹", col: "🇨🇴", uzb: "🇺🇿", cod: "🇨🇩",
  eng: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", cro: "🇭🇷", gha: "🇬🇭", pan: "🇵🇦",
};

export type FlagSize = "w20" | "w40" | "w80" | "w160" | "w320";

/** Codigo ISO2/subdivision para un teamId (o null si no hay). */
export function isoForTeam(teamId: string): string | null {
  return TEAM_ISO2[teamId] ?? null;
}

/** URL PNG de FlagCDN para un codigo (ej. "mx" -> .../w160/mx.png). */
export function flagUrlFromIso(iso2: string, size: FlagSize = "w160"): string {
  return `https://flagcdn.com/${size}/${iso2.toLowerCase()}.png`;
}

/** URL de bandera para un teamId, o null si no se conoce el ISO. */
export function flagUrlForTeam(teamId: string, size: FlagSize = "w160"): string | null {
  const iso = isoForTeam(teamId);
  return iso ? flagUrlFromIso(iso, size) : null;
}

/** Emoji de bandera de fallback. */
export function flagEmojiForTeam(teamId: string): string {
  return TEAM_FLAG_EMOJI[teamId] ?? "🏳️";
}
