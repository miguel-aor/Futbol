// =====================================================================
// betBuilderModels.ts — matemáticas del motor de value picks.
//
// Convierte momios + línea en: probabilidad implícita, no-vig, probabilidad
// del MODELO (Poisson/Dixon-Coles, Elo, conteo), edge, EV, confianza, rating,
// riesgo y correlación. Los modelos estadísticos quedan APLICADOS aquí; el
// usuario solo ve el resultado.
//
// Lenguaje responsable: son ESTIMACIONES, no garantías.
// =====================================================================

import {
  calculateMatchOutcomeProbabilities,
  generateScoreMatrix,
  poissonProbability,
} from "@/lib/footballModels";
import type {
  BetMarket,
  BetSlipPick,
  MarketType,
  MatchModelParams,
  PickRating,
  RiskLevel,
} from "@/lib/bet/types";

function clamp(v: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, v));
}

// ---------------------------------------------------------------------
// Momios
// ---------------------------------------------------------------------

/** Momio americano → decimal. +200 → 3.0 ; -150 → 1.667. */
export function americanOddsToDecimal(odds: number): number {
  if (odds === 0) return 1;
  return odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds);
}

/** Decimal → momio americano. */
export function decimalToAmerican(decimal: number): number {
  if (decimal <= 1) return 0;
  return decimal >= 2
    ? Math.round((decimal - 1) * 100)
    : Math.round(-100 / (decimal - 1));
}

/** Momio americano → probabilidad implícita (con margen de la casa). */
export function americanOddsToImpliedProbability(odds: number): number {
  return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
}

/**
 * Probabilidad sin margen (no-vig) para un mercado de dos lados: normaliza la
 * implícita de ambos lados. Si no hay lado opuesto, devuelve null.
 */
export function calculateNoVigProbability(
  impliedThis: number,
  impliedOpposite: number | null | undefined,
): number | null {
  if (impliedOpposite == null) return null;
  const total = impliedThis + impliedOpposite;
  return total > 0 ? impliedThis / total : null;
}

// ---------------------------------------------------------------------
// Probabilidad del modelo por mercado
// ---------------------------------------------------------------------

/** ¿La selección es "Más de" (over)? */
function isOver(selection: string): boolean {
  return /m[áa]s|over|\+/i.test(selection);
}

/** P(conteo Poisson supera la línea .5). over: X ≥ ceil(line). */
function poissonOverUnder(lambda: number, line: number, over: boolean): number {
  // Para líneas .5, "over" = X ≥ line+0.5 redondeado hacia arriba.
  const threshold = Math.floor(line) + 1; // line 2.5 → 3
  let cdf = 0;
  for (let k = 0; k < threshold; k++) cdf += poissonProbability(lambda, k);
  const overProb = 1 - cdf;
  return clamp(over ? overProb : 1 - overProb);
}

/** Probabilidades de diferencia de goles desde la matriz. */
function diffProbabilities(matrix: number[][]): Map<number, number> {
  const m = new Map<number, number>();
  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      const d = h - a;
      m.set(d, (m.get(d) ?? 0) + matrix[h][a]);
    }
  }
  return m;
}

/** Hándicap asiático para una línea entera o .5 (home positivo = ventaja). */
function asianHandicap(matrix: number[][], side: "home" | "away", line: number): number {
  const diffs = diffProbabilities(matrix);
  let win = 0;
  for (const [d, p] of diffs) {
    const adj = side === "home" ? d + line : -d + line;
    if (adj > 0) win += p; // .25/.5 → no hay push relevante para demo
  }
  return clamp(win);
}

export interface ModelContext {
  params: MatchModelParams;
  /** Lambda de conteo/jugador para mercados de conteo o props. */
  lambda?: number;
  /** xG del equipo para team_total_goals. */
  teamXG?: number;
}

/**
 * Estima la probabilidad real de un mercado con el modelo adecuado. Si no hay
 * datos suficientes, el llamador marca el resultado como "Demo model probability".
 */
export function estimateModelProbability(market: BetMarket, ctx: ModelContext): number {
  const { params } = ctx;
  const matrix = generateScoreMatrix(params.homeXG, params.awayXG, 8, -0.05);
  const sel = market.selection.toLowerCase();

  switch (market.marketType) {
    case "match_result": {
      const o = calculateMatchOutcomeProbabilities(matrix);
      if (sel.includes("empate") || sel.includes("draw")) return o.draw;
      if (sel.includes(params.awayName.toLowerCase()) || market.teamId === params.awayId) return o.awayWin;
      return o.homeWin;
    }
    case "double_chance": {
      const o = calculateMatchOutcomeProbabilities(matrix);
      const home = o.homeWin, draw = o.draw, away = o.awayWin;
      const hasHome = sel.includes(params.homeName.toLowerCase());
      const hasAway = sel.includes(params.awayName.toLowerCase());
      const hasDraw = sel.includes("empate");
      if (hasHome && hasDraw) return clamp(home + draw);
      if (hasAway && hasDraw) return clamp(away + draw);
      if (hasHome && hasAway) return clamp(home + away);
      return clamp(home + draw);
    }
    case "total_goals": {
      const o = calculateMatchOutcomeProbabilities(matrix);
      // over/under usando la matriz completa
      const line = market.line ?? 2.5;
      let over = 0;
      for (let h = 0; h < matrix.length; h++)
        for (let a = 0; a < matrix[h].length; a++)
          if (h + a > line) over += matrix[h][a];
      void o;
      return clamp(isOver(sel) ? over : 1 - over);
    }
    case "both_teams_score": {
      let yes = 0;
      for (let h = 1; h < matrix.length; h++)
        for (let a = 1; a < matrix[h].length; a++) yes += matrix[h][a];
      const no = 1 - yes;
      return clamp(sel.startsWith("s") || sel.includes("sí") || sel.includes("yes") ? yes : no);
    }
    case "asian_handicap": {
      const side: "home" | "away" =
        sel.includes(params.awayName.toLowerCase()) || market.teamId === params.awayId ? "away" : "home";
      return asianHandicap(matrix, side, market.line ?? 0);
    }
    case "team_total_goals": {
      const lambda = ctx.teamXG ?? (market.teamId === params.awayId ? params.awayXG : params.homeXG);
      return poissonOverUnder(lambda, market.line ?? 1.5, isOver(sel));
    }
    case "corners":
    case "team_total_corners":
      return poissonOverUnder(ctx.lambda ?? params.cornersLambda, market.line ?? 9.5, isOver(sel));
    case "cards":
    case "team_total_cards":
      return poissonOverUnder(ctx.lambda ?? params.cardsLambda, market.line ?? 3.5, isOver(sel));
    case "offsides":
      return poissonOverUnder(ctx.lambda ?? params.offsidesLambda, market.line ?? 3.5, isOver(sel));
    case "team_total_fouls":
      return poissonOverUnder(ctx.lambda ?? 11, market.line ?? 10.5, isOver(sel));
    case "penalty_awarded":
      return clamp(sel.startsWith("s") || sel.includes("sí") ? params.penaltyProb : 1 - params.penaltyProb);
    case "team_win_either_half": {
      const o = calculateMatchOutcomeProbabilities(matrix);
      // aproximación: prob de ganar alguna mitad ≈ 1 - (1 - pWin)^1.5 acotado
      const pWin = market.teamId === params.awayId ? o.awayWin : o.homeWin;
      return clamp(1 - Math.pow(1 - pWin, 1.4));
    }
    // -------- Props de jugador / equipo (conteo Poisson sobre lambda) --------
    case "player_shots":
    case "player_shots_on_target":
    case "player_assists":
    case "player_cards":
    case "player_fouls":
    case "player_fouls_drawn":
    case "player_passes":
    case "team_shots":
    case "team_shots_on_target":
    case "goalkeeper_saves":
      return poissonOverUnder(ctx.lambda ?? 1, market.line ?? 0.5, isOver(sel) || market.line == null);
    case "anytime_goalscorer":
      // P(≥1 gol) = 1 - e^(-lambdaGoles)
      return clamp(1 - Math.exp(-(ctx.lambda ?? 0.3)));
    case "first_goalscorer":
      // aproximación: anytime ponderado por participación temprana
      return clamp((1 - Math.exp(-(ctx.lambda ?? 0.3))) * 0.32);
    default:
      return clamp(market.line == null ? 0.5 : 0.5);
  }
}

/** Modelos que alimentan cada mercado (para mostrar "motor/fuente"). */
export function modelsFor(marketType: MarketType): string[] {
  if (["match_result", "double_chance", "asian_handicap"].includes(marketType))
    return ["Elo/SPI", "Poisson/Dixon-Coles", "Monte Carlo"];
  if (["total_goals", "both_teams_score", "team_total_goals"].includes(marketType))
    return ["Poisson/Dixon-Coles", "xG"];
  if (marketType.startsWith("player_") || marketType.includes("goalscorer"))
    return ["xG", "VAEP", "Scouting"];
  if (marketType === "goalkeeper_saves") return ["Conteo (Poisson)", "Scouting"];
  return ["Conteo (Poisson)"];
}

// ---------------------------------------------------------------------
// Edge / EV / rating / confianza / riesgo
// ---------------------------------------------------------------------

/** edge = probModelo − probImplícita. */
export function calculateEdge(modelProbability: number, impliedProbability: number): number {
  return modelProbability - impliedProbability;
}

/** EV por unidad apostada. */
export function calculateExpectedValue(modelProbability: number, decimalOdds: number): number {
  return modelProbability * (decimalOdds - 1) - (1 - modelProbability);
}

/** Volatilidad típica del mercado. */
export function marketVolatility(marketType: MarketType): RiskLevel {
  if (["match_result", "double_chance", "total_goals", "team_total_goals", "both_teams_score"].includes(marketType))
    return "low";
  if (marketType.startsWith("player_") || marketType.includes("goalscorer") || marketType === "cards")
    return "high";
  return "medium";
}

const RISK_RANK: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };
const RANK_RISK: RiskLevel[] = ["low", "medium", "high"];
function bumpRisk(r: RiskLevel, by = 1): RiskLevel {
  return RANK_RISK[Math.min(2, RISK_RANK[r] + by)];
}

/** Riesgo de una pick individual. */
export function calculatePickRisk(opts: {
  marketType: MarketType;
  edge: number;
  reliability: string;
  isDemo: boolean;
}): RiskLevel {
  let r = marketVolatility(opts.marketType);
  // Datos demo / baja confiabilidad suben el riesgo de BAJO a MEDIO (no a alto):
  // el origen del dato se refleja aparte (dataQuality), no infla todo a "alto".
  if ((opts.isDemo || opts.reliability === "demo" || opts.reliability === "low") && r === "low")
    r = "medium";
  if (opts.edge < -0.02) r = "high";
  return r;
}

/** Rating cualitativo de la pick. */
export function calculatePickRating(edge: number, expectedValue: number, risk: RiskLevel): PickRating {
  if (expectedValue <= 0) return edge < -0.01 ? "avoid" : "fair_line";
  if (edge >= 0.07 && risk !== "high") return "strong_value";
  if (edge >= 0.025) return "positive_value";
  if (Math.abs(edge) < 0.025) return "fair_line";
  return "risky";
}

/** Score de confianza 0-100. */
export function calculateConfidenceScore(opts: {
  edge: number;
  expectedValue: number;
  reliability: string;
  isDemo: boolean;
  marketType: MarketType;
  risk: RiskLevel;
}): number {
  let s = 50;
  s += clamp(opts.edge, -0.2, 0.2) * 180; // ±36
  s += clamp(opts.expectedValue, -0.5, 0.5) * 30; // ±15
  s -= RISK_RANK[opts.risk] * 8;
  s -= RISK_RANK[marketVolatility(opts.marketType)] * 4;
  if (opts.isDemo) s -= 6;
  if (opts.reliability === "high") s += 6;
  if (opts.reliability === "low" || opts.reliability === "demo") s -= 6;
  return Math.round(Math.min(100, Math.max(0, s)));
}

// ---------------------------------------------------------------------
// Correlación entre picks
// ---------------------------------------------------------------------

/** Riesgo de correlación entre DOS picks (low/medium/high). */
export function calculateCorrelationRisk(a: BetSlipPick, b: BetSlipPick): RiskLevel {
  if (a.matchId !== b.matchId) return "low"; // partidos distintos → independientes
  const ta = new Set(a.correlationTags);
  const tb = new Set(b.correlationTags);
  const has = (s: Set<string>, t: string) => s.has(t);

  // Over goles + ambos anotan → alta
  if ((has(ta, "goals_over") && has(tb, "btts_yes")) || (has(tb, "goals_over") && has(ta, "btts_yes")))
    return "high";
  // Under goles + ambos anotan → conflicto
  if ((has(ta, "goals_under") && has(tb, "btts_yes")) || (has(tb, "goals_under") && has(ta, "btts_yes")))
    return "high";
  // Portero saves + rival tiros a puerta → alta
  if ((has(ta, "gk_saves") && has(tb, "shots_on_target")) || (has(tb, "gk_saves") && has(ta, "shots_on_target")))
    return "high";
  // Tarjetas totales + faltas totales → media/alta
  if ((has(ta, "cards") && has(tb, "fouls")) || (has(tb, "cards") && has(ta, "fouls"))) return "medium";
  // Delantero tiros + equipo over tiros → media
  if ((has(ta, "player_shots") && has(tb, "team_shots")) || (has(tb, "player_shots") && has(ta, "team_shots")))
    return "medium";
  // Equipo gana + delantero goleador → media
  if ((has(ta, "team_win") && has(tb, "goalscorer")) || (has(tb, "team_win") && has(ta, "goalscorer")))
    return "medium";
  // Hándicap favorito + under → revisar
  if ((has(ta, "handicap_fav") && has(tb, "goals_under")) || (has(tb, "handicap_fav") && has(ta, "goals_under")))
    return "medium";
  // Mismo partido sin patrón claro → media por defecto
  return "medium";
}

/** Riesgo de correlación máximo del ticket. */
export function maxCorrelationRisk(picks: BetSlipPick[]): RiskLevel {
  let max: RiskLevel = "low";
  for (let i = 0; i < picks.length; i++)
    for (let j = i + 1; j < picks.length; j++) {
      const r = calculateCorrelationRisk(picks[i], picks[j]);
      if (RISK_RANK[r] > RISK_RANK[max]) max = r;
    }
  return max;
}

// ---------------------------------------------------------------------
// Ticket / combinaciones
// ---------------------------------------------------------------------

/** Multiplica momios decimales y devuelve {decimal, american}. */
export function calculateCombinedOdds(decimalOdds: number[]): { decimal: number; american: number } {
  const decimal = decimalOdds.reduce((p, d) => p * d, 1);
  return { decimal, american: decimalToAmerican(decimal) };
}

/** Riesgo total del ticket. */
export function calculateBetSlipRisk(picks: BetSlipPick[]): RiskLevel {
  if (picks.length === 0) return "low";
  let r: RiskLevel = picks.length >= 5 ? "high" : picks.length >= 3 ? "medium" : "low";
  const corr = maxCorrelationRisk(picks);
  if (RISK_RANK[corr] > RISK_RANK[r]) r = corr;
  if (picks.some((p) => p.isDemo)) r = bumpRisk(r);
  if (picks.some((p) => p.expectedValue < 0)) r = "high";
  return r;
}

/** Ordena picks por valor (EV → edge → confianza → menor riesgo). */
export function rankBestValuePicks<T extends { expectedValue: number; edge: number; confidenceScore: number; riskLevel: RiskLevel }>(
  picks: T[],
): T[] {
  return [...picks].sort(
    (a, b) =>
      b.expectedValue - a.expectedValue ||
      b.edge - a.edge ||
      b.confidenceScore - a.confidenceScore ||
      RISK_RANK[a.riskLevel] - RISK_RANK[b.riskLevel],
  );
}
