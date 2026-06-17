// =====================================================================
// Motor de prediccion. Logica simple pero "realista": parte de fuerzas
// ofensivas/defensivas, forma reciente y contexto (neutral, importancia)
// para estimar probabilidades, cuota justa y edge contra una cuota de
// mercado mock. NO es consejo de apuestas: es analisis.
// =====================================================================

import type {
  ConfidenceLabel,
  Match,
  MatchPrediction,
  Player,
  PlayerPropType,
  Recommendation,
  Team,
} from "@/lib/data-providers/types";
import {
  bttsProbability,
  clamp,
  hashSeed,
  outcomeFromExpectedGoals,
  poissonAtLeast,
  poissonOverLine,
  round,
  seededRng,
} from "./math";

/** Probabilidad implicita de una cuota decimal. */
export function calculateImpliedProbability(odds: number): number {
  if (odds <= 1) return 1;
  return round(1 / odds, 4);
}

/** Cuota justa (sin margen) para una probabilidad. */
export function calculateFairOdds(probability: number): number {
  const p = clamp(probability, 0.001, 0.999);
  return round(1 / p, 2);
}

/**
 * Edge = valor esperado por unidad apostada = p_modelo * cuota_mercado - 1.
 * Positivo => el modelo ve valor; negativo => evitar.
 */
export function calculateEdge(modelProbability: number, marketOdds: number): number {
  return round(modelProbability * marketOdds - 1, 4);
}

/** Etiqueta de confianza segun edge, tamano de muestra y volatilidad. */
export function getConfidenceLabel(
  edge: number,
  sampleSize: number,
  volatility: number,
): ConfidenceLabel {
  // Score: edge alto + buena muestra + baja volatilidad => mas confianza.
  const sampleFactor = clamp(sampleSize / 20, 0, 1); // 20+ partidos = pleno
  const stability = 1 - clamp(volatility, 0, 1);
  const score = edge * 6 + sampleFactor * 0.4 + stability * 0.4;
  if (edge <= 0) return "baja";
  if (score >= 0.85) return "alta";
  if (score >= 0.45) return "media";
  return "baja";
}

/** Recomendacion cualitativa para un prop/pick. */
export function getRecommendation(edge: number, confidence: ConfidenceLabel): Recommendation {
  if (edge >= 0.06 && confidence !== "baja") return "buena";
  if (edge <= -0.02) return "evitar";
  return "neutral";
}

/** Score de ranking combinando edge, probabilidad y confianza. */
function opportunityScore(o: {
  edge: number;
  modelProbability: number;
  confidence: ConfidenceLabel;
}): number {
  const confWeight = o.confidence === "alta" ? 1 : o.confidence === "media" ? 0.7 : 0.4;
  return o.edge * 5 + o.modelProbability * 0.5 + confWeight * 0.5;
}

/** Ordena oportunidades de mejor a peor (edge ponderado). */
export function rankOpportunities<
  T extends { edge: number; modelProbability: number; confidence: ConfidenceLabel },
>(opportunities: T[]): T[] {
  return [...opportunities].sort((a, b) => opportunityScore(b) - opportunityScore(a));
}

// ---------------------------------------------------------------------
// Calculo base de la prediccion de un partido
// ---------------------------------------------------------------------

/** Goles esperados de cada lado a partir de fuerzas + contexto. */
export function expectedGoalsFor(
  home: Team,
  away: Team,
  neutralVenue: boolean,
): { lambdaHome: number; lambdaAway: number } {
  const homeAdvantage = neutralVenue ? 0 : 0.25;
  // Base de liga internacional ~1.35 goles por equipo.
  const lambdaHome = clamp(
    (home.attackStrength + away.defenseStrength) / 2 + homeAdvantage,
    0.2,
    4,
  );
  const lambdaAway = clamp((away.attackStrength + home.defenseStrength) / 2, 0.2, 4);
  return { lambdaHome: round(lambdaHome, 2), lambdaAway: round(lambdaAway, 2) };
}

/** Construye la MatchPrediction completa (usada por el mockProvider). */
export function computeMatchPrediction(
  home: Team,
  away: Team,
  neutralVenue: boolean,
): MatchPrediction {
  const { lambdaHome, lambdaAway } = expectedGoalsFor(home, away, neutralVenue);
  const outcome = outcomeFromExpectedGoals(lambdaHome, lambdaAway);
  const expectedGoals = round(lambdaHome + lambdaAway, 2);
  const expectedCorners = round(
    (home.recentForm.avgCorners + away.recentForm.avgCorners) * 0.95,
    1,
  );
  const expectedCards = round(
    (home.recentForm.avgCards + away.recentForm.avgCards) * 0.9,
    1,
  );
  return {
    homeWin: round(outcome.homeWin, 3),
    draw: round(outcome.draw, 3),
    awayWin: round(outcome.awayWin, 3),
    expectedGoals,
    over25: round(poissonOverLine(expectedGoals, 2.5), 3),
    bttsYes: round(bttsProbability(lambdaHome, lambdaAway), 3),
    expectedCorners,
    expectedCards,
  };
}

// ---------------------------------------------------------------------
// Estimadores de mercado -> producen un "estimate" que el builder
// convierte en Opportunity. La cuota de mercado es mock (fair odds con
// vig + ruido determinista) para poder calcular edge.
// ---------------------------------------------------------------------

export interface MarketEstimate {
  pick: string;
  modelProbability: number;
  fairOdds: number;
  marketOdds: number;
  edge: number;
  sampleSize: number;
  volatility: number;
  reason: string;
}

/** Cuota de mercado mock: fair odds con margen y ruido determinista. */
function mockMarketOdds(probability: number, seedKey: string): number {
  const rng = seededRng(hashSeed(seedKey));
  const fair = 1 / clamp(probability, 0.02, 0.98);
  // Margen de casa simulado 4-8% + desviacion -3%..+6% (a veces da edge).
  const vig = 1 + (0.04 + rng() * 0.04);
  const drift = 0.97 + rng() * 0.09;
  return round((fair / vig) * drift, 2);
}

function buildEstimate(
  pick: string,
  probability: number,
  seedKey: string,
  sampleSize: number,
  volatility: number,
  reason: string,
): MarketEstimate {
  const p = round(clamp(probability, 0.02, 0.98), 3);
  const marketOdds = mockMarketOdds(p, seedKey);
  return {
    pick,
    modelProbability: p,
    fairOdds: calculateFairOdds(p),
    marketOdds,
    edge: calculateEdge(p, marketOdds),
    sampleSize,
    volatility: round(volatility, 2),
    reason,
  };
}

/** Mejor pick del resultado 1X2. */
export function estimateMatchOutcome(match: Match, home?: Team, away?: Team): MarketEstimate {
  const { homeWin, draw, awayWin } = match.prediction;
  const options: Array<[string, number]> = [
    [home ? `Gana ${home.name}` : "Gana local", homeWin],
    ["Empate", draw],
    [away ? `Gana ${away.name}` : "Gana visitante", awayWin],
  ];
  options.sort((a, b) => b[1] - a[1]);
  const [pick, prob] = options[0];
  const volHome = home?.recentForm.volatility ?? 0.4;
  const volAway = away?.recentForm.volatility ?? 0.4;
  const vol = clamp((volHome + volAway) / 2, 0.2, 0.8);
  return buildEstimate(
    pick,
    prob,
    `${match.id}-1x2`,
    16,
    vol,
    `Modelo Poisson sobre fuerzas y forma: ${pick.toLowerCase()} es el resultado mas probable (${Math.round(prob * 100)}%).`,
  );
}

/** Mercado de goles over/under 2.5. */
export function estimateGoalMarket(match: Match): MarketEstimate {
  const eg = match.prediction.expectedGoals;
  const over = match.prediction.over25;
  const pickOver = over >= 0.5;
  const prob = pickOver ? over : 1 - over;
  const pick = pickOver ? "Over 2.5 goles" : "Under 2.5 goles";
  return buildEstimate(
    pick,
    prob,
    `${match.id}-goals`,
    14,
    clamp(Math.abs(eg - 2.5) < 0.4 ? 0.6 : 0.4, 0.2, 0.8),
    `Goles esperados ${eg.toFixed(2)}. ${pick} es la cara con mayor probabilidad.`,
  );
}

/** Mercado de corners (linea 9.5). */
export function estimateCornersMarket(match: Match): MarketEstimate {
  const ec = match.prediction.expectedCorners;
  const line = 9.5;
  const over = poissonOverLine(ec, line);
  const pickOver = over >= 0.5;
  const prob = pickOver ? over : 1 - over;
  const pick = pickOver ? `Over ${line} corners` : `Under ${line} corners`;
  return buildEstimate(
    pick,
    prob,
    `${match.id}-corners`,
    12,
    0.5,
    `Corners esperados ${ec.toFixed(1)} (linea ${line}).`,
  );
}

/** Mercado de tarjetas (linea 4.5). */
export function estimateCardsMarket(match: Match): MarketEstimate {
  const ec = match.prediction.expectedCards;
  const line = 4.5;
  const over = poissonOverLine(ec, line);
  const pickOver = over >= 0.5;
  const prob = pickOver ? over : 1 - over;
  const pick = pickOver ? `Over ${line} tarjetas` : `Under ${line} tarjetas`;
  return buildEstimate(
    pick,
    prob,
    `${match.id}-cards`,
    12,
    0.55,
    `Tarjetas esperadas ${ec.toFixed(1)} (linea ${line}). Mayor en partidos de alta tension.`,
  );
}

/** Mercado de tiros de un equipo (linea 11.5 tiros totales). */
export function estimateTeamShotsMarket(match: Match, team: Team): MarketEstimate {
  const lambda = team.recentForm.avgShots;
  const line = 11.5;
  const over = poissonOverLine(lambda, line);
  const pickOver = over >= 0.5;
  const prob = pickOver ? over : 1 - over;
  const pick = `${team.name}: ${pickOver ? "Over" : "Under"} ${line} tiros`;
  return buildEstimate(
    pick,
    prob,
    `${match.id}-shots-${team.id}`,
    10,
    team.recentForm.volatility,
    `${team.name} promedia ${lambda.toFixed(1)} tiros por partido (linea ${line}).`,
  );
}

// ---------------------------------------------------------------------
// Props de jugador
// ---------------------------------------------------------------------

export interface PlayerPropEstimate extends MarketEstimate {
  hitRateLast5: number;
  hitRateLast10: number;
  hitRateSeason: number;
  recommendation: Recommendation;
}

const PROP_LABELS: Record<PlayerPropType, string> = {
  shots_1plus: "1+ tiro",
  shots_2plus: "2+ tiros",
  shots_on_target_1plus: "1+ tiro a puerta",
  goal: "Gol",
  assist: "Asistencia",
  card: "Tarjeta",
  fouls: "2+ faltas",
};

/** Estima un prop de jugador con probabilidad, hit rates y edge. */
export function estimatePlayerProp(player: Player, propType: PlayerPropType): PlayerPropEstimate {
  const s = player.stats;
  // Factor de minutos esperados y titularidad.
  const minutesFactor = clamp(s.avgMinutes / 90, 0.3, 1) * (player.likelyStarter ? 1 : 0.6);

  let probability: number;
  switch (propType) {
    case "shots_1plus":
      probability = poissonAtLeast(s.avgShots * minutesFactor, 1);
      break;
    case "shots_2plus":
      probability = poissonAtLeast(s.avgShots * minutesFactor, 2);
      break;
    case "shots_on_target_1plus":
      probability = poissonAtLeast(s.avgShotsOnTarget * minutesFactor, 1);
      break;
    case "goal":
      probability = poissonAtLeast(s.avgGoals * minutesFactor, 1);
      break;
    case "assist":
      probability = poissonAtLeast(s.avgAssists * minutesFactor, 1);
      break;
    case "card":
      probability = clamp(s.avgCards * minutesFactor, 0.03, 0.6);
      break;
    case "fouls":
      probability = poissonAtLeast(s.avgFouls * minutesFactor, 2);
      break;
    default:
      probability = 0.1;
  }

  const seedKey = `${player.id}-${propType}`;
  const rng = seededRng(hashSeed(seedKey));
  const base = buildEstimate(
    PROP_LABELS[propType],
    probability,
    seedKey,
    player.likelyStarter ? 12 : 7,
    clamp(0.35 + rng() * 0.4, 0.2, 0.85),
    `Basado en ${s.avgMinutes.toFixed(0)} min promedio y forma reciente${player.likelyStarter ? " (titular probable)" : " (rol rotacion)"}.`,
  );

  // Hit rates: derivados de la probabilidad con ruido determinista.
  const jitter = (k: number) => clamp(base.modelProbability + (rng() - 0.5) * k, 0.02, 0.98);
  const hitRateLast5 = round(jitter(0.2), 2);
  const hitRateLast10 = round(jitter(0.14), 2);
  const hitRateSeason = round(jitter(0.1), 2);

  const confidence = getConfidenceLabel(base.edge, base.sampleSize, base.volatility);
  return {
    ...base,
    hitRateLast5,
    hitRateLast10,
    hitRateSeason,
    recommendation: getRecommendation(base.edge, confidence),
  };
}

/** Lista de todos los props disponibles para un jugador. */
export const ALL_PLAYER_PROP_TYPES: PlayerPropType[] = [
  "shots_1plus",
  "shots_2plus",
  "shots_on_target_1plus",
  "goal",
  "assist",
  "card",
  "fouls",
];
