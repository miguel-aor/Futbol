// =====================================================================
// buildPicks.ts — motor que convierte mercados en picks evaluadas y arma el
// resumen del ticket. Une los modelos (betBuilderModels) con los datos.
// =====================================================================

import { DEMO_MARKETS, DEMO_MATCH } from "@/data/betBuilderMock";
import {
  americanOddsToDecimal,
  americanOddsToImpliedProbability,
  calculateBetSlipRisk,
  calculateCombinedOdds,
  calculateConfidenceScore,
  calculateEdge,
  calculateExpectedValue,
  calculateNoVigProbability,
  calculatePickRating,
  calculatePickRisk,
  estimateModelProbability,
  maxCorrelationRisk,
  modelsFor,
  rankBestValuePicks,
} from "@/lib/betBuilderModels";
import type {
  BetMarket,
  BetSelection,
  BetSlipPick,
  BetSlipSummary,
  MatchModelParams,
} from "@/lib/bet/types";

function isOver(selection: string): boolean {
  return /m[áa]s|over|\+/i.test(selection);
}

/** Etiquetas para detectar correlación entre picks del mismo partido. */
export function correlationTags(m: BetMarket): string[] {
  const tags: string[] = [`match:${m.matchId}`];
  if (m.teamId) tags.push(`team:${m.teamId}`);
  if (m.playerId) tags.push(`player:${m.playerId}`);
  switch (m.marketType) {
    case "total_goals":
      tags.push(isOver(m.selection) ? "goals_over" : "goals_under");
      break;
    case "both_teams_score":
      tags.push(/^s|s[íi]|yes/i.test(m.selection) ? "btts_yes" : "btts_no");
      break;
    case "match_result":
    case "double_chance":
      tags.push("team_win");
      break;
    case "asian_handicap":
      tags.push("team_win", "handicap_fav");
      break;
    case "cards":
    case "player_cards":
    case "team_total_cards":
      tags.push("cards");
      break;
    case "team_total_fouls":
    case "player_fouls":
      tags.push("fouls");
      break;
    case "goalkeeper_saves":
      tags.push("gk_saves");
      break;
    case "player_shots":
      tags.push("player_shots");
      break;
    case "player_shots_on_target":
      tags.push("player_shots", "shots_on_target");
      break;
    case "team_shots":
    case "team_shots_on_target":
      tags.push("team_shots");
      break;
    case "anytime_goalscorer":
    case "first_goalscorer":
      tags.push("goalscorer");
      break;
    default:
      break;
  }
  return tags;
}

/** Evalúa un mercado y devuelve una pick con edge/EV/confianza/riesgo/rating. */
export function evaluateMarket(
  m: BetMarket,
  params: MatchModelParams,
  matchName: string,
): BetSelection {
  const decimalOdds = americanOddsToDecimal(m.americanOdds);
  const implied = americanOddsToImpliedProbability(m.americanOdds);
  const oppImplied =
    m.oppositeAmericanOdds != null
      ? americanOddsToImpliedProbability(m.oppositeAmericanOdds)
      : null;
  const noVig = calculateNoVigProbability(implied, oppImplied);
  const modelProbability = estimateModelProbability(m, {
    params,
    lambda: m.modelLambda ?? undefined,
    teamXG: m.marketType === "team_total_goals" ? m.modelLambda ?? undefined : undefined,
  });
  const edge = calculateEdge(modelProbability, implied);
  const expectedValue = calculateExpectedValue(modelProbability, decimalOdds);
  const riskLevel = calculatePickRisk({
    marketType: m.marketType,
    edge,
    reliability: m.reliability,
    isDemo: m.isDemo,
  });
  const rating = calculatePickRating(edge, expectedValue, riskLevel);
  const confidenceScore = calculateConfidenceScore({
    edge,
    expectedValue,
    reliability: m.reliability,
    isDemo: m.isDemo,
    marketType: m.marketType,
    risk: riskLevel,
  });
  return {
    id: `sel-${m.id}`,
    marketId: m.id,
    matchId: m.matchId,
    matchName,
    category: m.category,
    marketType: m.marketType,
    label: m.label,
    selection: m.selection,
    line: m.line,
    americanOdds: m.americanOdds,
    decimalOdds,
    impliedProbability: implied,
    noVigProbability: noVig,
    modelProbability,
    edge,
    expectedValue,
    confidenceScore,
    rating,
    riskLevel,
    correlationTags: correlationTags(m),
    source: m.source,
    reliability: m.reliability,
    isDemo: m.isDemo,
    models: modelsFor(m.marketType),
  };
}

export function buildDemoSelections(): BetSelection[] {
  return DEMO_MARKETS.map((m) => evaluateMarket(m, DEMO_MATCH.params, DEMO_MATCH.name));
}

/** Picks ordenadas por valor (EV → edge → confianza → riesgo). */
export function buildValuePicks(): BetSelection[] {
  return rankBestValuePicks(buildDemoSelections());
}

export function selectionToSlipPick(s: BetSelection): BetSlipPick {
  return {
    id: `pick-${s.id}`,
    selectionId: s.id,
    matchId: s.matchId,
    matchName: s.matchName,
    marketType: s.marketType,
    selection: s.selection,
    line: s.line,
    americanOdds: s.americanOdds,
    decimalOdds: s.decimalOdds,
    modelProbability: s.modelProbability,
    edge: s.edge,
    expectedValue: s.expectedValue,
    confidenceScore: s.confidenceScore,
    riskLevel: s.riskLevel,
    correlationTags: s.correlationTags,
    isDemo: s.isDemo,
  };
}

/** Resumen del ticket (momio combinado, prob. conjunta, EV, riesgo, avisos). */
export function computeSlipSummary(picks: BetSlipPick[]): BetSlipSummary {
  if (picks.length === 0) {
    return {
      pickCount: 0,
      combinedDecimalOdds: 1,
      combinedAmericanOdds: 0,
      estimatedProbability: 0,
      estimatedEV: 0,
      confidenceScore: 0,
      correlationRisk: "low",
      isSameGame: false,
      warnings: [],
      finalRecommendation: "Agrega picks para evaluar el ticket.",
    };
  }
  const { decimal, american } = calculateCombinedOdds(picks.map((p) => p.decimalOdds));
  // Probabilidad conjunta asumiendo independencia (se avisa si es mismo partido).
  const jointProb = picks.reduce((p, x) => p * x.modelProbability, 1);
  const estimatedEV = jointProb * (decimal - 1) - (1 - jointProb);
  const confidenceScore = Math.round(
    picks.reduce((s, p) => s + p.confidenceScore, 0) / picks.length -
      (picks.length - 1) * 4,
  );
  const matches = new Set(picks.map((p) => p.matchId));
  const isSameGame = matches.size === 1 && picks.length > 1;
  const correlationRisk = maxCorrelationRisk(picks);
  const slipRisk = calculateBetSlipRisk(picks);

  const warnings: string[] = [];
  if (picks.some((p) => p.isDemo)) warnings.push("Incluye datos demo (no son picks reales).");
  if (picks.some((p) => p.expectedValue < 0)) warnings.push("Hay picks con EV estimado negativo.");
  if (isSameGame)
    warnings.push("Same Game Parlay: picks del mismo partido, probabilidad ajustada por correlación.");
  if (correlationRisk === "high")
    warnings.push("Correlación alta entre picks: la probabilidad combinada puede ser engañosa.");
  if (picks.length >= 5) warnings.push("Parlay largo (5+): mayor volatilidad y menor probabilidad conjunta.");
  if (Math.max(0, ...picks.map((p) => 0)) === 0 && confidenceScore < 40)
    warnings.push("Confianza baja del ticket.");

  const finalRecommendation =
    estimatedEV > 0 && slipRisk !== "high"
      ? "Ticket con valor estadístico estimado positivo. Estimación, no garantía."
      : estimatedEV > 0
        ? "Valor positivo pero riesgo alto; considera reducir picks."
        : "EV estimado no positivo; revisa líneas o reduce el ticket.";

  return {
    pickCount: picks.length,
    combinedDecimalOdds: decimal,
    combinedAmericanOdds: american,
    estimatedProbability: jointProb,
    estimatedEV,
    confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
    correlationRisk,
    isSameGame,
    warnings,
    finalRecommendation,
  };
}
