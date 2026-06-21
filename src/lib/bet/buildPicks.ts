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
  calculateFinalValueScore,
  calculatePickRisk,
  estimateModelProbability,
  maxCorrelationRisk,
  modelsFor,
  rankBestValuePicks,
} from "@/lib/betBuilderModels";
import { getTeamStrengthContext } from "@/lib/teamStrength";
import { assessRealism, explainPick } from "@/lib/bet/realismChecks";
import { calculateModelAgreement } from "@/lib/bet/modelAgreement";
import { getRefereeAssignment } from "@/data/refereeAssignments";
import { recentContextProbability, scenarioVolumeNudge } from "@/lib/bet/todayContextModel";
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
  const baseProbability = estimateModelProbability(m, {
    params,
    lambda: m.modelLambda ?? undefined,
    teamXG: m.marketType === "team_total_goals" ? m.modelLambda ?? undefined : undefined,
  });

  // --- Capa de contexto reciente (stats 365Scores) ---
  // El modelo base manda (85%); el contexto reciente ajusta (15%) + un pequeño
  // empuje por escenario de grupo. sampleSize=1 → se marca y baja la confianza.
  const recent = recentContextProbability(m, params);
  const contextNotes: string[] = [];
  let modelProbability = baseProbability;
  let contextDirection: "boost" | "penalty" | null = null;
  if (recent) {
    const nudge = scenarioVolumeNudge(m, params);
    // Peso del contexto: alto en props de volumen donde la base no tiene lambda
    // informativa (tiros/atajadas → base por defecto poco fiable); bajo donde la
    // base ya es sólida (goles/BTTS/corners/tarjetas).
    const baseUninformative =
      m.modelLambda == null && ["team_shots", "team_shots_on_target", "goalkeeper_saves"].includes(m.marketType);
    const w = baseUninformative ? 0.7 : 0.15;
    modelProbability = Math.min(0.99, Math.max(0.01, baseProbability * (1 - w) + recent.prob * w + nudge));
    contextNotes.push(...recent.notes);
    contextDirection = modelProbability >= baseProbability + 0.01 ? "boost" : modelProbability <= baseProbability - 0.01 ? "penalty" : null;
  }

  const edge = calculateEdge(modelProbability, implied);
  const expectedValue = calculateExpectedValue(modelProbability, decimalOdds);

  // --- Capa realista: fuerza de selección, sanity checks y coincidencia ---
  const ctx = getTeamStrengthContext(params.homeId, params.awayId);
  const matchResolved = Boolean(params.homeId) && Boolean(params.awayId) && params.homeId !== "home";
  const refAssignment = getRefereeAssignment(m.matchId);
  const refereeConfirmed = Boolean(refAssignment?.referee?.isConfirmed);
  const realism = assessRealism({
    marketType: m.marketType,
    selection: m.selection,
    line: m.line,
    americanOdds: m.americanOdds,
    source: m.source,
    isDemo: m.isDemo,
    reliability: m.reliability,
    homeId: params.homeId,
    awayId: params.awayId,
    homeName: params.homeName,
    awayName: params.awayName,
    teamId: m.teamId,
    modelProbability,
    matchResolved,
    refereeConfirmed,
    refereeName: refAssignment?.referee?.name,
    benchPlus: m.benchPlus,
    ctx,
  });
  const agreement = calculateModelAgreement({
    marketType: m.marketType,
    selection: m.selection,
    modelProbability,
    homeId: params.homeId,
    awayId: params.awayId,
    homeName: params.homeName,
    awayName: params.awayName,
    teamId: m.teamId,
    ctx,
  });

  // Flags de contexto reciente (informativos) + penalización leve por muestra.
  const contextFlags: typeof realism.flags = [];
  if (recent) {
    contextFlags.push({ code: "last_match_context", label: "Last-match context", note: contextNotes.join(" "), severity: "info" });
    if (contextDirection === "boost")
      contextFlags.push({ code: "context_boost", label: "Context boost", note: "El contexto reciente sube la proyección.", severity: "info" });
    if (contextDirection === "penalty")
      contextFlags.push({ code: "context_penalty", label: "Context penalty", note: "El contexto reciente baja la proyección.", severity: "info" });
    contextFlags.push({ code: "sample_size_1", label: "Sample size: 1", note: "Una sola muestra reciente; contexto con peso bajo.", severity: "info" });
    contextFlags.push({ code: "src_365", label: "365Scores screenshot", note: "Contexto desde captura 365Scores (manual).", severity: "info" });
  }
  const flags = [...realism.flags, ...contextFlags];
  const sampleSizePenalty = recent ? 3 : 0;

  const riskLevel = calculatePickRisk({
    marketType: m.marketType,
    edge,
    reliability: m.reliability,
    isDemo: m.isDemo,
    riskBump: realism.riskBump,
  });
  const hasDanger = flags.some((f) => f.severity === "danger");
  const rating = calculatePickRating(edge, expectedValue, riskLevel, {
    forceAvoid: realism.forceAvoid,
    hasDanger,
    modelAgreement: agreement.score,
  });
  const confidenceScore = calculateConfidenceScore({
    edge,
    expectedValue,
    reliability: m.reliability,
    isDemo: m.isDemo,
    marketType: m.marketType,
    risk: riskLevel,
    realismPenalty: realism.confidencePenalty + sampleSizePenalty,
    modelAgreement: agreement.score,
  });
  const finalValueScore = calculateFinalValueScore({
    edge,
    expectedValue,
    confidenceScore,
    risk: riskLevel,
    modelAgreement: agreement.score,
    realismPenalty: realism.confidencePenalty + sampleSizePenalty,
    reliability: m.reliability,
    forceAvoid: realism.forceAvoid,
  });
  let explanation = explainPick({
    selection: m.selection,
    marketType: m.marketType,
    edge,
    rating,
    ctx,
    flags,
  });
  if (recent && contextNotes.length) {
    explanation += ` Contexto reciente (365Scores): ${contextNotes.join(" ")}`;
  }

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
    finalValueScore,
    modelAgreement: agreement.score,
    modelAgreementLabel: agreement.label,
    strengthGap: ctx.gap,
    realismFlags: flags,
    explanation,
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
    externalMatchId: s.externalMatchId ?? null,
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
    source: s.source,
    finalValueScore: s.finalValueScore,
    realismFlags: s.realismFlags,
    explanation: s.explanation,
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
