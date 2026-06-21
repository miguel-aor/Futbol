// =====================================================================
// Helpers de zona horaria Monterrey y cálculo de estado de partidos.
//
// Los DATOS de partidos ya NO viven aquí: la UI los lee de la API interna
// (/api/worldcup-2026/matches), que los computa desde el snapshot real de
// fixtures (grupos A–L reales, resultados reales de la jornada 1). Este archivo
// solo aporta utilidades de presentación, deterministas y SSR-safe.
//
// Fecha de referencia: 19 jun 2026, America/Monterrey (UTC−6 fijo, sin DST).
// =====================================================================

export const REFERENCE_DATE = "2026-06-19";
export const REFERENCE_TIMEZONE = "America/Monterrey";
export const MONTERREY_UTC_OFFSET_HOURS = -6;
/** "Ahora" simulado en UTC. Corte 21 jun 2026 ~03:00 Monterrey (09:00 UTC):
 *  la J2 de grupos A-F ya se jugó (no elegible) y los partidos de HOY (G/H,
 *  16:00+ UTC) siguen como próximos elegibles. */
export const REFERENCE_NOW_UTC = "2026-06-21T09:00:00.000Z";
export const MATCHES_LAST_UPDATED = "2026-06-21T03:00:00-06:00";

export type MatchStatus =
  | "Scheduled"
  | "Live"
  | "Complete"
  | "Postponed"
  | "Pending verification";

const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAYS_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const pad = (n: number) => String(n).padStart(2, "0");

function toMonterrey(iso: string) {
  const utc = new Date(iso);
  const shifted = new Date(utc.getTime() + MONTERREY_UTC_OFFSET_HOURS * 3600 * 1000);
  return {
    valid: !Number.isNaN(utc.getTime()),
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

/** "jue 19 jun · 11:00 (CST Monterrey)" */
export function formatMonterrey(iso: string): string {
  const p = toMonterrey(iso);
  if (!p.valid) return "Por confirmar";
  return `${DAYS_ES[p.weekday]} ${p.day} ${MONTHS_ES[p.month]} · ${pad(p.hour)}:${pad(p.minute)} (CST Monterrey)`;
}

/** Solo hora local: "11:00". */
export function formatMonterreyTime(iso: string): string {
  const p = toMonterrey(iso);
  if (!p.valid) return "--:--";
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Clave de fecha local Monterrey "YYYY-MM-DD". */
export function monterreyDateKey(iso: string): string {
  const p = toMonterrey(iso);
  if (!p.valid) return "";
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}`;
}

/**
 * Estado del partido relativo a REFERENCE_NOW_UTC. No inventa resultados: si
 * el kickoff ya pasó pero el snapshot no trae marcador, queda "Pending
 * verification" (o "Live" si está dentro de la ventana de juego).
 */
export function computeStatus(m: {
  homeScore: number | null;
  awayScore: number | null;
  kickoff: string;
}): MatchStatus {
  if (m.homeScore != null && m.awayScore != null) return "Complete";
  const kickoff = new Date(m.kickoff).getTime();
  const now = new Date(REFERENCE_NOW_UTC).getTime();
  if (Number.isNaN(kickoff)) return "Scheduled";
  if (kickoff > now) return "Scheduled";
  if (now - kickoff < 2.5 * 3600 * 1000) return "Live";
  return "Pending verification";
}
