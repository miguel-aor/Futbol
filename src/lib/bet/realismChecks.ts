// =====================================================================
// realismChecks.ts — sanity checks futbolísticos para Value Picks.
//
// El modelo matemático puede arrojar "valor" en picks poco realistas (p. ej.
// un under bajo en Brasil vs Haití). Esta capa detecta esas trampas a partir
// de la diferencia de nivel (teamStrength) y del tipo de mercado, y:
//   - genera flags visibles,
//   - penaliza la confianza,
//   - sube el riesgo,
//   - en casos claros fuerza rating "avoid".
// No reescribe la probabilidad del modelo; actúa como filtro de realismo.
// =====================================================================

import type { BetSource, MarketType } from "@/lib/bet/types";
import type { MismatchLevel, StrengthContext } from "@/lib/teamStrength";

export interface RealismFlag {
  code: string;
  label: string;
  note: string;
  severity: "info" | "warn" | "danger";
}

export interface RealismAssessment {
  flags: RealismFlag[];
  /** Puntos a restar de la confianza (0-45). */
  confidencePenalty: number;
  /** Pasos a subir el riesgo (0-2). */
  riskBump: number;
  /** Fuerza rating "avoid" (pick irreal / partido no resuelto). */
  forceAvoid: boolean;
}

export interface RealismInput {
  marketType: MarketType;
  selection: string;
  line: number | null;
  americanOdds: number;
  source: BetSource;
  isDemo: boolean;
  reliability: string;
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  teamId?: string;
  modelProbability: number;
  matchResolved: boolean;
  ctx: StrengthContext;
}

const isUnder = (sel: string) => /\b(under|menos|por debajo)\b/.test(sel) || sel.startsWith("u ");
const isOver = (sel: string) => /\b(over|m[áa]s|por encima)\b/.test(sel) || sel.startsWith("o ");
const isPlayerProp = (m: MarketType) =>
  m.startsWith("player_") || m === "anytime_goalscorer" || m === "first_goalscorer";
const isVolatileCount = (m: MarketType) =>
  m === "cards" || m === "team_total_cards" || m === "player_cards" || m === "offsides" ||
  m === "team_total_fouls" || m === "player_fouls" || m === "player_fouls_drawn";

/** Lado (local/visitante) al que apunta la selección. */
function selectionSide(input: RealismInput): "home" | "away" | "none" {
  const sel = input.selection.toLowerCase();
  if (input.teamId === input.awayId || sel.includes(input.awayName.toLowerCase())) return "away";
  if (input.teamId === input.homeId || sel.includes(input.homeName.toLowerCase())) return "home";
  return "none";
}

// --- Detectores individuales -----------------------------------------

/** Línea/momio extremo: bajo pago o alto riesgo de cola. */
export function detectExtremeLine(americanOdds: number): RealismFlag | null {
  if (americanOdds <= -800)
    return { code: "extreme_line", label: "Línea extrema", note: `Bajo pago (${americanOdds}); exposición alta para poco retorno.`, severity: "warn" };
  if (americanOdds >= 700)
    return { code: "extreme_line", label: "Línea extrema", note: `Momio muy alto (+${americanOdds}); baja probabilidad real.`, severity: "warn" };
  return null;
}

/** Under de goles irreal cuando hay un favorito fuerte que debería dominar. */
export function detectUnrealisticUnder(input: RealismInput): RealismFlag | null {
  const sel = input.selection.toLowerCase();
  const { level, favorite, home, away } = input.ctx;
  if (level !== "clear" && level !== "huge") return null;

  if (input.marketType === "total_goals" && isUnder(sel)) {
    const line = input.line ?? 2.5;
    if (line <= 2.5)
      return { code: "unrealistic_under", label: "Under en mismatch", note: `${input.ctx.note} El favorito proyecta muchos goles; un under ${line} tiene bajo realismo.`, severity: "danger" };
  }
  if (input.marketType === "team_total_goals" && isUnder(sel)) {
    // Under del EQUIPO FAVORITO (se espera que marque) = poco realista.
    const favTeamId = favorite === "home" ? home.teamId : favorite === "away" ? away.teamId : null;
    if (favTeamId && input.teamId === favTeamId)
      return { code: "unrealistic_under", label: "Under del favorito", note: `Se proyecta dominio ofensivo del favorito; su under tiene bajo realismo.`, severity: "danger" };
  }
  return null;
}

/** Trampa de mismatch: apostar al underdog (ML/hándicap) sin justificación. */
export function detectMismatchTrap(input: RealismInput): RealismFlag | null {
  const { level, favorite } = input.ctx;
  if (level !== "clear" && level !== "huge") return null;
  const side = selectionSide(input);
  // underdog = lado contrario al favorito
  const dog = favorite === "home" ? "away" : favorite === "away" ? "home" : "none";

  if (input.marketType === "match_result" && side !== "none" && side === dog) {
    return { code: "mismatch_trap", label: "Underdog ML", note: `${input.ctx.note} Ganar directo del más débil es poco probable aunque el momio pague.`, severity: level === "huge" ? "danger" : "warn" };
  }
  if (input.marketType === "asian_handicap" && side !== "none" && side === dog) {
    return { code: "mismatch_trap", label: "Hándicap underdog", note: `Hándicap a favor del más débil contra un favorito fuerte; baja probabilidad real.`, severity: "warn" };
  }
  return null;
}

/** Riesgo por datos incompletos (demo, baja confiabilidad, sin forma del Mundial). */
export function detectLowDataRisk(input: RealismInput): RealismFlag | null {
  if (input.isDemo || input.reliability === "demo")
    return { code: "low_data", label: "Datos demo", note: "Basado en datos de ejemplo; confianza reducida.", severity: "warn" };
  if (input.reliability === "low")
    return { code: "low_data", label: "Baja calidad de datos", note: "Confiabilidad de la fuente baja.", severity: "warn" };
  if (!input.ctx.home.hasForm && !input.ctx.away.hasForm)
    return { code: "no_wc_form", label: "Sin forma del Mundial", note: "Aún sin partidos jugados; el prior se apoya en ranking FIFA.", severity: "info" };
  return null;
}

/** Riesgo por mercado no soportado con datos suficientes (props sin alineación). */
export function detectUnsupportedMarketRisk(input: RealismInput): RealismFlag | null {
  if (isPlayerProp(input.marketType))
    return { code: "no_lineup", label: "Alineación no confirmada", note: "La prop depende de minutos/alineación no confirmada; no puede ser alta confianza.", severity: "warn" };
  if (isVolatileCount(input.marketType))
    return { code: "volatile_market", label: "Mercado volátil", note: "Tarjetas/faltas/offsides tienen alta varianza; confianza reducida aunque haya edge.", severity: "info" };
  return null;
}

const DISCIPLINARY: MarketType[] = [
  "cards", "team_total_cards", "player_cards", "penalty_awarded", "team_total_fouls", "player_fouls", "player_fouls_drawn",
];

/**
 * Riesgo por árbitro no confirmado en mercados disciplinarios. La app no tiene
 * designación oficial conectada → estos mercados usan promedio del torneo/equipos
 * y no pueden apoyarse en estadísticas de un árbitro específico.
 */
export function detectRefereeRisk(input: RealismInput): RealismFlag | null {
  if (!DISCIPLINARY.includes(input.marketType)) return null;
  return {
    code: "referee_unconfirmed",
    label: "Árbitro no confirmado",
    note: "Sin designación arbitral oficial; la proyección disciplinaria usa promedios, no un árbitro específico. Riesgo mayor.",
    severity: "warn",
  };
}

/** Marca origen de momios manuales/importados (válido, pero se muestra). */
export function detectSourceFlag(source: BetSource): RealismFlag | null {
  if (source === "Manual screenshot" || source === "Manual input")
    return { code: "manual_odds", label: "Momios manuales", note: "Momio capturado a mano; verifica línea y pago.", severity: "info" };
  if (source === "Imported CSV" || source === "Imported JSON")
    return { code: "imported_odds", label: "Momios importados", note: "Momio importado por archivo; fuente no oficial.", severity: "info" };
  return null;
}

// --- Ensamblaje -------------------------------------------------------

const PENALTY: Record<string, number> = {
  unrealistic_under: 28,
  mismatch_trap: 22,
  no_lineup: 24,
  referee_unconfirmed: 12,
  extreme_line: 10,
  low_data: 10,
  volatile_market: 8,
  no_wc_form: 4,
  manual_odds: 3,
  imported_odds: 3,
};
const RISK_BUMP: Record<string, number> = {
  unrealistic_under: 2,
  mismatch_trap: 1,
  no_lineup: 1,
  referee_unconfirmed: 1,
  extreme_line: 1,
  volatile_market: 1,
};

export function assessRealism(input: RealismInput): RealismAssessment {
  if (!input.matchResolved) {
    return {
      flags: [{ code: "unmatched", label: "Partido no reconocido", note: "Sin modelo del partido; no se calcula value.", severity: "danger" }],
      confidencePenalty: 45,
      riskBump: 2,
      forceAvoid: true,
    };
  }

  const flags: RealismFlag[] = [];
  const push = (f: RealismFlag | null) => {
    if (f && !flags.some((x) => x.code === f.code)) flags.push(f);
  };
  push(detectUnrealisticUnder(input));
  push(detectMismatchTrap(input));
  push(detectUnsupportedMarketRisk(input));
  push(detectRefereeRisk(input));
  push(detectExtremeLine(input.americanOdds));
  push(detectLowDataRisk(input));
  push(detectSourceFlag(input.source));

  let confidencePenalty = 0;
  let riskBump = 0;
  for (const f of flags) {
    confidencePenalty += PENALTY[f.code] ?? 0;
    riskBump = Math.max(riskBump, RISK_BUMP[f.code] ?? 0);
  }
  confidencePenalty = Math.min(45, confidencePenalty);
  riskBump = Math.min(2, riskBump);

  // Una pick "irreal" (under en mismatch grande) no debe poder ser top value.
  const forceAvoid = flags.some((f) => f.code === "unrealistic_under" && input.ctx.level === "huge");

  return { flags, confidencePenalty, riskBump, forceAvoid };
}

/** Explicación corta y legible de la pick (valor + realismo). */
export function explainPick(input: {
  selection: string;
  marketType: MarketType;
  edge: number;
  rating: string;
  ctx: StrengthContext;
  flags: RealismFlag[];
}): string {
  const danger = input.flags.find((f) => f.severity === "danger");
  if (danger) return `Pick penalizada: ${danger.note}`;
  const warn = input.flags.find((f) => f.severity === "warn");

  const edgePct = (input.edge * 100).toFixed(1);
  const value =
    input.edge > 0.02
      ? `El modelo ve más probabilidad que el momio implícito (edge +${edgePct}%).`
      : input.edge < -0.02
        ? `El momio implícito supera al modelo (edge ${edgePct}%).`
        : `Línea cercana al valor justo (edge ${edgePct}%).`;
  const ctxNote = input.ctx.level !== "even" ? ` ${input.ctx.note}` : "";
  const warnNote = warn ? ` Riesgo: ${warn.note}` : "";
  return `${value}${ctxNote}${warnNote}`;
}
