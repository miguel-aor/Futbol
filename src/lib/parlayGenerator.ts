// =====================================================================
// parlayGenerator.ts — genera combinaciones (parleys) candidatas LOCALMENTE
// con valor estadístico y riesgo medido. No inventa picks, no promete ganar.
//
// La estadística local hace el trabajo: probabilidad, edge, EV, momio
// combinado, correlación, riesgo, confianza. (La IA solo explica/clasifica.)
// =====================================================================

import {
  calculateCombinedOdds,
  marketVolatility,
  maxCorrelationRisk,
} from "@/lib/betBuilderModels";
import type {
  BetSlipPick,
  ParlayCandidate,
  ParlayGenerationSettings,
  ParlayStrategy,
  RiskLevel,
} from "@/lib/bet/types";

const RISK_RANK: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };

/** Picks elegibles: edge+EV positivos, confianza mínima, riesgo aceptable. */
export function filterEligiblePicks(
  picks: BetSlipPick[],
  settings: ParlayGenerationSettings,
): BetSlipPick[] {
  return picks.filter((p) => {
    if (p.edge <= 0) return false;
    if (p.expectedValue <= 0) return false;
    if (p.confidenceScore < settings.minConfidence) return false;
    if (RISK_RANK[p.riskLevel] > RISK_RANK[settings.maxRisk]) return false;
    if (!settings.includeDemo && p.isDemo) return false;
    return true;
  });
}

/** Combinaciones (índices) de tamaño k en orden lexicográfico. */
function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  const n = arr.length;
  if (k > n || k <= 0) return;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    yield idx.map((i) => arr[i]);
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i--;
    if (i < 0) break;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
}

export function calculateJointProbability(picks: BetSlipPick[], correlationPenalty = 1): number {
  return picks.reduce((p, x) => p * x.modelProbability, 1) * correlationPenalty;
}

/** Penalización de correlación (multiplicador 0-1) para picks del mismo partido. */
export function calculateCorrelationPenalty(picks: BetSlipPick[]): number {
  const sameGame = new Set(picks.map((p) => p.matchId)).size === 1 && picks.length > 1;
  if (!sameGame) return 1;
  const risk = maxCorrelationRisk(picks);
  return risk === "high" ? 0.75 : risk === "medium" ? 0.88 : 0.96;
}

export function calculateParlayEV(jointProbability: number, combinedDecimalOdds: number): number {
  return jointProbability * (combinedDecimalOdds - 1) - (1 - jointProbability);
}

export function calculateParlayConfidence(picks: BetSlipPick[], correlationRisk: RiskLevel): number {
  const avg = picks.reduce((s, p) => s + p.confidenceScore, 0) / picks.length;
  return Math.round(
    Math.max(0, Math.min(100, avg - (picks.length - 2) * 6 - RISK_RANK[correlationRisk] * 6)),
  );
}

export function calculateParlayRisk(picks: BetSlipPick[]): {
  correlationRisk: RiskLevel;
  volatilityRisk: RiskLevel;
  dataQualityRisk: RiskLevel;
} {
  const correlationRisk = maxCorrelationRisk(picks);
  const volatileCount = picks.filter((p) => marketVolatility(p.marketType) === "high").length;
  const volatilityRisk: RiskLevel = volatileCount >= 2 ? "high" : volatileCount === 1 ? "medium" : "low";
  const demoCount = picks.filter((p) => p.isDemo).length;
  const dataQualityRisk: RiskLevel = demoCount === picks.length ? "high" : demoCount > 0 ? "medium" : "low";
  return { correlationRisk, volatilityRisk, dataQualityRisk };
}

function classifyStrategy(picks: BetSlipPick[], risk: RiskLevel): ParlayStrategy {
  const sameGame = new Set(picks.map((p) => p.matchId)).size === 1 && picks.length > 1;
  if (sameGame) return "same_game";
  if (picks.every((p) => p.marketType.startsWith("player_") || p.marketType.includes("goalscorer")))
    return "player_props";
  if (picks.length === 2 && risk === "low") return "conservative";
  if (picks.length <= 3) return "balanced";
  return "aggressive";
}

let candidateSeq = 0;
function buildCandidate(picks: BetSlipPick[]): ParlayCandidate {
  const { decimal, american } = calculateCombinedOdds(picks.map((p) => p.decimalOdds));
  const penalty = calculateCorrelationPenalty(picks);
  const jointProb = calculateJointProbability(picks, penalty);
  const ev = calculateParlayEV(jointProb, decimal);
  const { correlationRisk, volatilityRisk, dataQualityRisk } = calculateParlayRisk(picks);
  const confidenceScore = calculateParlayConfidence(picks, correlationRisk);
  const strategy = classifyStrategy(picks, correlationRisk);

  const warnings: string[] = [];
  if (strategy === "same_game") warnings.push("Same Game Parlay: ajuste de correlación aplicado.");
  if (correlationRisk === "high") warnings.push("Correlación alta entre picks.");
  if (strategy === "player_props") warnings.push("Props de jugador: dependen de titularidad y minutos.");
  if (picks.some((p) => p.isDemo)) warnings.push("Incluye datos demo.");
  if (new Set(picks.map((p) => p.source)).size > 1)
    warnings.push("Combina fuentes con distinta confiabilidad.");
  if (picks.length >= 5) warnings.push("Parlay largo (5): alta volatilidad.");
  if (ev <= 0) warnings.push("EV estimado no positivo (anti-parlay).");

  const finalScore = Math.round(
    Math.max(-50, Math.min(2, ev)) * 22 +
      confidenceScore * 0.5 -
      RISK_RANK[correlationRisk] * 7 -
      RISK_RANK[volatilityRisk] * 4 -
      RISK_RANK[dataQualityRisk] * 3,
  );

  candidateSeq += 1;
  return {
    id: `pc-${candidateSeq}`,
    picks,
    strategy,
    combinedDecimalOdds: decimal,
    combinedAmericanOdds: american,
    estimatedJointProbability: jointProb,
    estimatedEV: ev,
    confidenceScore,
    correlationRisk,
    volatilityRisk,
    dataQualityRisk,
    finalScore,
    warnings,
    source: picks.some((p) => p.isDemo) ? "Demo" : "Model",
    isDemo: picks.some((p) => p.isDemo),
  };
}

/** Genera hasta `combinationCount` parleys de tamaños 2..maxPickCount. */
export function generateParlayCombinations(
  picks: BetSlipPick[],
  settings: ParlayGenerationSettings,
): ParlayCandidate[] {
  candidateSeq = 0;
  const eligible = filterEligiblePicks(picks, settings);
  // Pool acotado a las mejores 24 picks para evitar explosión combinatoria.
  const pool = [...eligible]
    .sort((a, b) => b.expectedValue - a.expectedValue || b.confidenceScore - a.confidenceScore)
    .slice(0, 24);
  if (pool.length < 2) return [];

  const maxK = Math.max(2, Math.min(5, settings.maxPickCount));
  const sizes: number[] = [];
  for (let s = 2; s <= maxK; s++) if (pool.length >= s) sizes.push(s);
  const perSize = Math.ceil(settings.combinationCount / sizes.length);

  const out: ParlayCandidate[] = [];
  for (const s of sizes) {
    let added = 0;
    for (const combo of combinations(pool, s)) {
      out.push(buildCandidate(combo));
      added += 1;
      if (added >= perSize || out.length >= settings.combinationCount) break;
    }
    if (out.length >= settings.combinationCount) break;
  }
  return out;
}

export type ParlaySort = "ev" | "balance" | "risk" | "confidence" | "odds";

export function rankParlays(parlays: ParlayCandidate[], sort: ParlaySort = "balance"): ParlayCandidate[] {
  const by: Record<ParlaySort, (a: ParlayCandidate, b: ParlayCandidate) => number> = {
    ev: (a, b) => b.estimatedEV - a.estimatedEV,
    balance: (a, b) => b.finalScore - a.finalScore,
    risk: (a, b) => RISK_RANK[a.correlationRisk] - RISK_RANK[b.correlationRisk] || b.finalScore - a.finalScore,
    confidence: (a, b) => b.confidenceScore - a.confidenceScore,
    odds: (a, b) => b.combinedDecimalOdds - a.combinedDecimalOdds,
  };
  return [...parlays].sort(by[sort]);
}

export function groupParlaysByStrategy(
  parlays: ParlayCandidate[],
): Record<ParlayStrategy, ParlayCandidate[]> {
  const groups: Record<ParlayStrategy, ParlayCandidate[]> = {
    conservative: [],
    balanced: [],
    aggressive: [],
    same_game: [],
    player_props: [],
  };
  for (const p of parlays) groups[p.strategy].push(p);
  return groups;
}
