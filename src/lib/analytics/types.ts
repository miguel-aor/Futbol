// =====================================================================
// Football Analytics — tipos centrales del módulo de modelos estadísticos.
//
// Módulo AUTOCONTENIDO: no reutiliza los tipos del dominio Mundial
// (src/lib/data-providers/types.ts) para no acoplarse a ellos. Todo lo de
// "Football Analytics" vive bajo @/lib/analytics y @/components/analytics.
//
// Regla transversal de fuentes:
//  - `source`      → de dónde viene el dato (365Scores prioritario; fallback
//                    a fuentes confiables; "Demo" para datos de ejemplo).
//  - `reliability` → qué tan confiable/completo es el dato.
//  - Nunca presentar datos "Demo" como reales.
// =====================================================================

/** Fuente de un dato. 365Scores es la fuente prioritaria. */
export type MetricSource =
  | "365Scores"
  | "StatsBomb"
  | "Understat"
  | "FBref"
  | "Football-Data"
  | "Opta"
  | "StatsPerform"
  | "Wyscout"
  | "Sportradar"
  | "openfootball"
  | "PlayerStats.Football"
  | "Snapshot"
  | "Fallback"
  | "Demo";

/** Nivel de confiabilidad/completitud del dato. */
export type Reliability = "high" | "medium" | "low" | "demo";

/** Campos comunes de procedencia para cualquier entidad/métrica. */
export interface Sourced {
  source: MetricSource;
  reliability: Reliability;
  /** ISO date string. Cuándo se capturó/actualizó el dato. */
  lastUpdated?: string;
}

/**
 * Disponibilidad de una métrica por fuente. Permite a la UI explicar si una
 * métrica existe en 365Scores o requiere fallback (p. ej. VAEP → StatsBomb).
 */
export interface MetricAvailability {
  metric: string;
  /** ¿Está disponible (de forma realista) en 365Scores? */
  available365: boolean;
  /** Fuente de fallback recomendada si 365Scores no la tiene. */
  fallbackSource?: MetricSource;
  note?: string;
}

// --------------------------------------------------------------------- //
// Equipos
// --------------------------------------------------------------------- //
export interface Team {
  id: string;
  name: string;
  country: string;
  league: string;
  /** Rating Elo/SPI total (fuerza dinámica). */
  eloRating: number;
  /** Sub-rating ofensivo (0-100 aprox.). */
  offensiveRating: number;
  /** Sub-rating defensivo (0-100 aprox., más alto = mejor defensa). */
  defensiveRating: number;
  /** Forma reciente, más reciente al final. */
  recentForm: MatchOutcome[];
  /** Evolución del rating en el tiempo (para la gráfica de línea). */
  ratingHistory: number[];
  goalsForAvg: number;
  goalsAgainstAvg: number;
  source: MetricSource;
  reliability: Reliability;
}

export type MatchOutcome = "W" | "D" | "L";

export type Position = "GK" | "DF" | "MF" | "FW";

// --------------------------------------------------------------------- //
// Jugadores
// --------------------------------------------------------------------- //
export interface Player {
  id: string;
  name: string;
  age: number;
  position: Position;
  team: string;
  league: string;
  minutes: number;
  goals: number;
  assists: number;
  xG: number;
  xA: number;
  rating: number;
  source: MetricSource;
  reliability: Reliability;
}

// --------------------------------------------------------------------- //
// Partidos
// --------------------------------------------------------------------- //
export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  date: string;
  competition: string;
  homeGoals?: number;
  awayGoals?: number;
  homeXG?: number;
  awayXG?: number;
  source: MetricSource;
  reliability: Reliability;
}

// --------------------------------------------------------------------- //
// Tiros (xG / shot map)
// --------------------------------------------------------------------- //
export type ShotBodyPart = "left" | "right" | "head" | "other";
export type ShotSituation =
  | "open_play"
  | "set_piece"
  | "penalty"
  | "corner"
  | "fast_break";

export interface Shot {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string;
  playerName: string;
  minute: number;
  /** Coordenada a lo largo (0 = portería propia, 100 = portería rival). */
  x: number;
  /** Coordenada a lo ancho (0-100, 50 = centro). */
  y: number;
  /** Expected goals del tiro (0-1). */
  xg: number;
  isGoal: boolean;
  bodyPart: ShotBodyPart;
  situation: ShotSituation;
  source: MetricSource;
  reliability: Reliability;
}

// --------------------------------------------------------------------- //
// VAEP — Valuing Actions by Estimating Probabilities
// --------------------------------------------------------------------- //
export type VAEPActionType =
  | "pass"
  | "cross"
  | "dribble"
  | "carry"
  | "shot"
  | "tackle"
  | "interception"
  | "recovery"
  | "foul"
  | "clearance"
  | "take_on";

export interface VAEPAction {
  id: string;
  playerId: string;
  matchId: string;
  minute: number;
  actionType: VAEPActionType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  /** Δ probabilidad de que el equipo anote tras la acción. */
  deltaScoreProbability: number;
  /** Δ probabilidad de que el equipo conceda tras la acción. */
  deltaConcedeProbability: number;
  /** VAEP = ΔP(anotar) − ΔP(conceder). */
  vaepValue: number;
  success: boolean;
  source: MetricSource;
  reliability: Reliability;
}

/** Resumen VAEP agregado por jugador. */
export interface VAEPPlayerSummary {
  playerId: string;
  name: string;
  position: Position;
  team: string;
  league: string;
  minutes: number;
  vaepTotal: number;
  vaepOffensive: number;
  vaepDefensive: number;
  vaepPer90: number;
  positiveActions: number;
  negativeActions: number;
  progressivePasses: number;
  recoveries: number;
  dangerousLosses: number;
  successfulCarries: number;
  source: MetricSource;
  reliability: Reliability;
}

// --------------------------------------------------------------------- //
// Simulación Monte Carlo
// --------------------------------------------------------------------- //
export interface SimulationResult {
  teamId: string;
  teamName: string;
  qualify: number;
  firstPlace: number;
  semifinal: number;
  final: number;
  champion: number;
  expectedPoints: number;
  /** Probabilidad por posición final del grupo (índice 0 = 1°). */
  positionDistribution: number[];
  source: MetricSource;
  reliability: Reliability;
}

// --------------------------------------------------------------------- //
// Scouting estadístico
// --------------------------------------------------------------------- //
export type RiskLevel = "low" | "medium" | "high";

export interface ScoutingPlayer {
  id: string;
  name: string;
  age: number;
  position: Position;
  team: string;
  league: string;
  minutes: number;
  goals: number;
  assists: number;
  xG: number;
  xA: number;
  rating365: number;
  tacklesWon: number;
  interceptions: number;
  /** Atajadas por partido (porteros). 0 para jugadores de campo. */
  savesPerGame: number;
  progressivePasses: number;
  scoutingScore: number;
  hiddenGemScore: number;
  riskScore: number;
  /** Valor de mercado estimado en M€ si existe en una fuente confiable. */
  estimatedMarketValue?: number;
  /** Exposición mediática 0-100 (más alto = más conocido). */
  popularity: number;
  source: MetricSource;
  reliability: Reliability;
  tags: string[];
}

export interface SimilarPlayerResult {
  basePlayerId: string;
  playerId: string;
  name: string;
  team: string;
  league: string;
  position: Position;
  age: number;
  similarityScore: number; // 0-100
  keyDifferences: string[];
  source: MetricSource;
  reliability: Reliability;
}

export interface HiddenGemResult {
  player: ScoutingPlayer;
  hiddenGemScore: number;
  reasons: string[];
  tags: string[];
}

export interface RecruitmentShortlistItem {
  id: string;
  name: string;
  position: Position;
  team: string;
  league: string;
  age: number;
  overallScore: number;
  offensiveScore: number;
  defensiveScore: number;
  riskScore: number;
  source: MetricSource;
  comment: string;
}

export interface PlayerRiskReport {
  playerId: string;
  name: string;
  overallRisk: RiskLevel;
  minutesRisk: RiskLevel;
  overperformanceRisk: RiskLevel;
  injuryRisk: RiskLevel;
  leagueAdjustmentRisk: RiskLevel;
  consistencyRisk: RiskLevel;
  explanation: string;
  source: MetricSource;
  reliability: Reliability;
}

export interface ScoutingFilters {
  query: string;
  league: string; // "" = todas
  position: Position | "ALL";
  maxAge: number;
  minMinutes: number;
  minRating: number;
  risk: RiskLevel | "ALL";
}

// --------------------------------------------------------------------- //
// Poisson / Dixon-Coles
// --------------------------------------------------------------------- //
export interface PoissonInputs {
  /** Fuerza ofensiva local relativa (1.0 = media de liga). */
  homeAttack: number;
  /** Fuerza defensiva local relativa (1.0 = media; <1 mejor defensa). */
  homeDefense: number;
  awayAttack: number;
  awayDefense: number;
  /** Multiplicador de ventaja de localía (≈1.1-1.4). */
  homeAdvantage: number;
  /** Promedio de goles de local en la liga. */
  leagueHomeGoals: number;
  /** Promedio de goles de visita en la liga. */
  leagueAwayGoals: number;
}

export interface MatchScore {
  home: number;
  away: number;
  prob: number;
}

export interface PoissonOutputs {
  homeXG: number;
  awayXG: number;
  homeWin: number;
  draw: number;
  awayWin: number;
  over25: number;
  under25: number;
  bttsYes: number;
  bttsNo: number;
  mostLikelyScore: MatchScore;
  /** matrix[h][a] = probabilidad de ese marcador exacto. */
  matrix: number[][];
}
