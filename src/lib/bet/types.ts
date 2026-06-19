// =====================================================================
// Tipos del motor de Value Picks / Bet Builder.
//
// Producto: Partido → análisis estadístico → picks con valor → ticket/parley →
// confianza/riesgo. Los modelos (Elo/Poisson/Monte Carlo/xG/VAEP/scouting)
// son el MOTOR interno; el usuario ve pick, prob., edge, EV, confianza, riesgo.
//
// Lenguaje responsable: "valor estadístico", "probabilidad estimada", "EV
// estimado". Nunca "pick garantizada" ni promesas de ganancia.
// =====================================================================

export type RiskLevel = "low" | "medium" | "high";

export type PickRating =
  | "strong_value"
  | "positive_value"
  | "fair_line"
  | "risky"
  | "avoid";

export type MarketCategory = "match" | "team" | "player";

export type MarketType =
  // Partido
  | "match_result"
  | "double_chance"
  | "total_goals"
  | "both_teams_score"
  | "asian_handicap"
  | "team_total_goals"
  | "corners"
  | "cards"
  | "offsides"
  | "penalty_awarded"
  // Equipo
  | "team_shots"
  | "team_shots_on_target"
  | "team_total_corners"
  | "team_total_cards"
  | "team_total_fouls"
  | "team_win_either_half"
  // Jugador
  | "anytime_goalscorer"
  | "first_goalscorer"
  | "player_shots"
  | "player_shots_on_target"
  | "player_assists"
  | "player_cards"
  | "player_fouls"
  | "player_fouls_drawn"
  | "player_passes"
  | "goalkeeper_saves";

export type BetSource =
  | "Demo"
  | "Manual input"
  | "Manual screenshot"
  | "Imported CSV"
  | "Imported JSON"
  | "365Scores"
  | "Model"
  | "Fallback";
export type Reliability = "high" | "medium" | "low" | "demo";

/** Parámetros del modelo para estimar la probabilidad de un mercado. */
export interface MatchModelParams {
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  /** Goles esperados (Poisson) por equipo. */
  homeXG: number;
  awayXG: number;
  /** Lambdas de conteo del partido. */
  cornersLambda: number;
  cardsLambda: number;
  offsidesLambda: number;
  /** Tasa de penal en el encuentro (prob). */
  penaltyProb: number;
}

/** Un mercado capturado/ofertado (línea + momio). */
export interface BetMarket {
  id: string;
  matchId: string;
  category: MarketCategory;
  marketType: MarketType;
  label: string;
  /** Selección concreta (ej "Más de 2.5", "Estados Unidos", nombre jugador). */
  selection: string;
  /** Línea numérica si aplica (2.5, 0.5…); null para 1x2/BTTS. */
  line: number | null;
  americanOdds: number;
  /** Lado opuesto (para no-vig) si se conoce. */
  oppositeAmericanOdds?: number | null;
  /** Expectativa del modelo (lambda de conteo / xG del equipo / goles jugador). */
  modelLambda?: number | null;
  /** Para player props / team props. */
  playerId?: string;
  teamId?: string;
  source: BetSource;
  reliability: Reliability;
  isDemo: boolean;
  lastUpdated: string;
}

/** Una selección ya evaluada por el motor (lo que ve el usuario). */
export interface BetSelection {
  id: string;
  marketId: string;
  matchId: string;
  matchName: string;
  /** ID original del proveedor cuando la pick viene de momios importados. */
  externalMatchId?: string | null;
  category: MarketCategory;
  marketType: MarketType;
  label: string;
  selection: string;
  line: number | null;
  americanOdds: number;
  decimalOdds: number;
  impliedProbability: number;
  noVigProbability: number | null;
  modelProbability: number;
  edge: number;
  expectedValue: number;
  confidenceScore: number;
  rating: PickRating;
  riskLevel: RiskLevel;
  /** Etiquetas para detectar correlación en parleys. */
  correlationTags: string[];
  source: BetSource;
  reliability: Reliability;
  isDemo: boolean;
  /** Modelos que alimentaron la estimación (para "fuente/motor"). */
  models: string[];
}

export interface BetSlipPick {
  id: string;
  selectionId: string;
  matchId: string;
  matchName: string;
  externalMatchId?: string | null;
  marketType: MarketType;
  selection: string;
  line: number | null;
  americanOdds: number;
  decimalOdds: number;
  modelProbability: number;
  edge: number;
  expectedValue: number;
  confidenceScore: number;
  riskLevel: RiskLevel;
  correlationTags: string[];
  isDemo: boolean;
  source: BetSource;
}

export interface BetSlipSummary {
  pickCount: number;
  combinedDecimalOdds: number;
  combinedAmericanOdds: number;
  estimatedProbability: number;
  estimatedEV: number;
  confidenceScore: number;
  correlationRisk: RiskLevel;
  /** Misma-partido detectado. */
  isSameGame: boolean;
  warnings: string[];
  finalRecommendation: string;
}

// ---------------------------------------------------------------------
// Parleys
// ---------------------------------------------------------------------
export type ParlayStrategy =
  | "conservative"
  | "balanced"
  | "aggressive"
  | "same_game"
  | "player_props";

export interface ParlayCandidate {
  id: string;
  picks: BetSlipPick[];
  strategy: ParlayStrategy;
  combinedDecimalOdds: number;
  combinedAmericanOdds: number;
  estimatedJointProbability: number;
  estimatedEV: number;
  confidenceScore: number;
  correlationRisk: RiskLevel;
  volatilityRisk: RiskLevel;
  dataQualityRisk: RiskLevel;
  finalScore: number;
  warnings: string[];
  source: BetSource;
  isDemo: boolean;
}

export interface ParlayGenerationSettings {
  combinationCount: 100 | 250 | 500 | 1000;
  maxPickCount: number;
  minConfidence: number;
  maxRisk: RiskLevel;
  includeDemo: boolean;
  strategy: ParlayStrategy | "all";
}

// ---------------------------------------------------------------------
// AI advisor
// ---------------------------------------------------------------------
export interface AIRecommendedParlay {
  id: string;
  strategy: ParlayStrategy;
  confidence: number;
  risk: RiskLevel;
  reasoning: string;
  warnings: string[];
  recommendation: string;
}

export interface AIParlayAdvice {
  recommendedParlays: AIRecommendedParlay[];
  rejectedParlays: Array<{ id: string; reason: string }>;
  riskWarnings: string[];
  explanation: string;
  userFriendlySummary: string;
  finalRecommendation: string;
  /** true si vino de la IA; false si es ranking local de fallback. */
  fromAI: boolean;
}
