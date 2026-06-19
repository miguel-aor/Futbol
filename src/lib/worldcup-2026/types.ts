// =====================================================================
// Tipos del pipeline de datos del Mundial 2026 (capa "current tournament").
//
// Regla transversal: si un stat NO está disponible en la fuente, va `null`,
// nunca 0. Cada bloque guarda su procedencia (source / sourceUrl / collectedAt).
// =====================================================================

export type Reliability = "high" | "medium" | "low" | "demo";

/** Procedencia de un dato/bloque. */
export interface Provenance {
  source: string;
  sourceUrl: string | null;
  collectedAt: string; // ISO
}

export type WCMatchStatus = "scheduled" | "played";

export interface WorldCupMatch extends Provenance {
  id: string;
  round: number; // jornada 1..3 (fase de grupos)
  group: string; // "A".."L"
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  kickoff: string; // ISO UTC
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
  status: WCMatchStatus;
}

export interface WCResultLine {
  matchId: string;
  opponentId: string;
  opponentName: string;
  gf: number;
  ga: number;
  result: "W" | "D" | "L";
}

/** Forma de un equipo DENTRO del Mundial actual (solo partidos ya jugados). */
export interface TournamentTeamForm extends Provenance {
  teamId: string;
  teamName: string;
  group: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  // Stats avanzados: null si la fuente (snapshot) no los publica por partido.
  xgFor: number | null;
  xgAgainst: number | null;
  shotsFor: number | null;
  shotsAgainst: number | null;
  shotsOnTargetFor: number | null;
  shotsOnTargetAgainst: number | null;
  possessionAvg: number | null;
  cornersFor: number | null;
  cornersAgainst: number | null;
  foulsCommitted: number | null;
  yellowCards: number | null;
  redCards: number | null;
  tacklesWon: number | null;
  interceptions: number | null;
  /** Forma reciente DENTRO del Mundial (cronológica). */
  form: Array<"W" | "D" | "L">;
  attackPerMatch: number | null; // goalsFor / played
  defensePerMatch: number | null; // goalsAgainst / played
  results: WCResultLine[];
}

/** Pesos de las capas de información para una predicción. */
export interface PredictionWeights {
  currentWorldCup: number;
  recentNationalTeam: number;
  eloRanking: number;
  clubPlayerForm: number;
}

/** Una capa de fuerza con su disponibilidad de datos. */
export interface StrengthLayer {
  label: string;
  attack: number | null; // 0-100
  defense: number | null; // 0-100
  weight: number;
  hasRealData: boolean;
  note: string;
}

/** Features de predicción por equipo (mezcla ponderada de capas). */
export interface TeamPredictionFeatures extends Provenance {
  teamId: string;
  teamName: string;
  group: string;
  matchesPlayedWC: number;
  weights: PredictionWeights;
  layers: StrengthLayer[];
  blendedAttack: number; // 0-100
  blendedDefense: number; // 0-100
  expectedGoalsFor: number; // λ esperado por partido
}

/** Predicción de un enfrentamiento concreto. */
export interface MatchupPrediction {
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  homeXG: number;
  awayXG: number;
  weightsHome: PredictionWeights;
  weightsAway: PredictionWeights;
}
