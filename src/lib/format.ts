// Helpers de formato DETERMINISTAS (parsean el ISO manualmente) para
// evitar diferencias servidor/cliente y errores de hidratacion.

const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const DAYS_ES = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];

function parts(iso: string) {
  const d = new Date(iso);
  return {
    valid: !Number.isNaN(d.getTime()),
    day: d.getUTCDate(),
    month: d.getUTCMonth(),
    year: d.getUTCFullYear(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    weekday: d.getUTCDay(),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "17 jun · 16:00" */
export function formatDateTime(iso: string): string {
  const p = parts(iso);
  if (!p.valid) return "Por confirmar";
  return `${p.day} ${MONTHS_ES[p.month]} · ${pad(p.hour)}:${pad(p.minute)} UTC`;
}

/** "mie 17 jun" */
export function formatDate(iso: string): string {
  const p = parts(iso);
  if (!p.valid) return "Por confirmar";
  return `${DAYS_ES[p.weekday]} ${p.day} ${MONTHS_ES[p.month]}`;
}

/** "16:00" */
export function formatTime(iso: string): string {
  const p = parts(iso);
  if (!p.valid) return "--:--";
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** "hace X" relativo a un ahora fijo opcional; por defecto muestra fecha. */
export function formatUpdatedAt(iso: string): string {
  const p = parts(iso);
  if (!p.valid) return "desconocido";
  return `${p.day} ${MONTHS_ES[p.month]} ${pad(p.hour)}:${pad(p.minute)} UTC`;
}

export function formatPercent(p: number, decimals = 0): string {
  return `${(p * 100).toFixed(decimals)}%`;
}

export function formatOdds(o: number): string {
  return o.toFixed(2);
}

export function formatEdge(e: number): string {
  const sign = e > 0 ? "+" : "";
  return `${sign}${(e * 100).toFixed(1)}%`;
}

export function formatSigned(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/** Clase de color segun edge. */
export function edgeColor(edge: number): string {
  if (edge >= 0.06) return "text-edge-pos";
  if (edge >= 0) return "text-edge-mid";
  return "text-edge-neg";
}

export const FIXTURE_LABELS: Record<string, string> = {
  mundial: "Mundial",
  amistoso: "Amistoso",
  eliminatoria: "Eliminatoria",
  internacional: "Internacional",
};

export const SOURCE_LABELS: Record<string, string> = {
  mock: "Mock",
  manual: "Snapshot manual",
  "365scores": "365Scores (exp.)",
};

export const CONFEDERATIONS = ["UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC", "OFC"];

export const POSITION_LABELS: Record<string, string> = {
  POR: "Portero",
  DEF: "Defensa",
  MED: "Mediocampista",
  DEL: "Delantero",
};
