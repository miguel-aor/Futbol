// =====================================================================
// footballAnalyticsMock.ts — datos DEMO del módulo Football Analytics.
//
// ⚠️ Todos los datos aquí son de ejemplo: source = "Demo", reliability =
// "demo". NO representan datos reales. La arquitectura está lista para
// reemplazar estos arrays por importaciones reales (365Scores prioritario,
// fallback a StatsBomb/Understat/FBref/Football-Data) vía CSV/JSON o API.
//
// Prioridad de fuentes documentada en METRIC_AVAILABILITY.
// =====================================================================

import {
  buildPlayerRiskReport,
  calculateHiddenGemScore,
  calculatePlayerRiskScore,
  calculateRecruitmentFit,
  calculateScoutingScore,
  findSimilarPlayers,
} from "@/lib/scoutingModels";
import { runMonteCarloSimulation } from "@/lib/footballModels";
import type {
  HiddenGemResult,
  Match,
  MetricAvailability,
  Player,
  PlayerRiskReport,
  RecruitmentShortlistItem,
  ScoutingPlayer,
  Shot,
  SimilarPlayerResult,
  SimulationResult,
  Team,
  VAEPAction,
  VAEPPlayerSummary,
} from "@/lib/analytics/types";

export const ANALYTICS_LAST_UPDATED = "2026-06-19";
const DEMO = { source: "Demo" as const, reliability: "demo" as const };

// --------------------------------------------------------------------- //
// Disponibilidad de métricas por fuente (prioridad 365Scores → fallback)
// --------------------------------------------------------------------- //
export const METRIC_AVAILABILITY: MetricAvailability[] = [
  {
    metric: "Elo / SPI",
    available365: false,
    fallbackSource: "Football-Data",
    note: "365Scores no publica un rating Elo; se calcula a partir de resultados (fallback: Football-Data.co.uk).",
  },
  {
    metric: "Resultados / marcadores",
    available365: true,
    note: "Cobertura amplia en 365Scores para la mayoría de ligas.",
  },
  {
    metric: "xG (equipo/partido)",
    available365: true,
    fallbackSource: "Understat",
    note: "Disponible en ligas top; fallback a Understat/FBref donde no exista.",
  },
  {
    metric: "xG por tiro / shot map",
    available365: true,
    fallbackSource: "Understat",
    note: "Requiere datos de tiros con ubicación; no en todas las ligas.",
  },
  {
    metric: "VAEP",
    available365: false,
    fallbackSource: "StatsBomb",
    note: "Requiere eventos jugada por jugada (StatsBomb Open Data / Wyscout).",
  },
  {
    metric: "Métricas defensivas (entradas, intercep.)",
    available365: true,
    fallbackSource: "FBref",
    note: "365Scores publica varias; FBref/Opta como fallback detallado.",
  },
  {
    metric: "Valor de mercado",
    available365: false,
    fallbackSource: "Fallback",
    note: "No es métrica deportiva; usar fuente externa confiable si se requiere.",
  },
];

// --------------------------------------------------------------------- //
// Equipos (ratings Elo/SPI demo)
// --------------------------------------------------------------------- //
export const MOCK_TEAMS: Team[] = [
  {
    id: "fra",
    name: "Francia",
    country: "Francia",
    league: "Selecciones",
    eloRating: 2085,
    offensiveRating: 89,
    defensiveRating: 86,
    recentForm: ["W", "W", "D", "W", "W"],
    ratingHistory: [2010, 2025, 2040, 2052, 2061, 2070, 2078, 2085],
    goalsForAvg: 2.3,
    goalsAgainstAvg: 0.8,
    ...DEMO,
  },
  {
    id: "bra",
    name: "Brasil",
    country: "Brasil",
    league: "Selecciones",
    eloRating: 2065,
    offensiveRating: 90,
    defensiveRating: 83,
    recentForm: ["W", "D", "W", "W", "L"],
    ratingHistory: [2030, 2038, 2049, 2055, 2058, 2061, 2068, 2065],
    goalsForAvg: 2.4,
    goalsAgainstAvg: 1.0,
    ...DEMO,
  },
  {
    id: "arg",
    name: "Argentina",
    country: "Argentina",
    league: "Selecciones",
    eloRating: 2095,
    offensiveRating: 88,
    defensiveRating: 87,
    recentForm: ["W", "W", "W", "D", "W"],
    ratingHistory: [2050, 2060, 2068, 2075, 2082, 2088, 2092, 2095],
    goalsForAvg: 2.2,
    goalsAgainstAvg: 0.7,
    ...DEMO,
  },
  {
    id: "esp",
    name: "España",
    country: "España",
    league: "Selecciones",
    eloRating: 2050,
    offensiveRating: 87,
    defensiveRating: 84,
    recentForm: ["W", "W", "D", "W", "D"],
    ratingHistory: [2000, 2012, 2024, 2031, 2038, 2044, 2048, 2050],
    goalsForAvg: 2.1,
    goalsAgainstAvg: 0.9,
    ...DEMO,
  },
  {
    id: "eng",
    name: "Inglaterra",
    country: "Inglaterra",
    league: "Selecciones",
    eloRating: 2030,
    offensiveRating: 85,
    defensiveRating: 85,
    recentForm: ["D", "W", "W", "D", "W"],
    ratingHistory: [1995, 2004, 2012, 2018, 2022, 2026, 2029, 2030],
    goalsForAvg: 2.0,
    goalsAgainstAvg: 0.9,
    ...DEMO,
  },
  {
    id: "ger",
    name: "Alemania",
    country: "Alemania",
    league: "Selecciones",
    eloRating: 2010,
    offensiveRating: 86,
    defensiveRating: 80,
    recentForm: ["W", "L", "W", "D", "W"],
    ratingHistory: [1960, 1972, 1985, 1992, 1998, 2003, 2008, 2010],
    goalsForAvg: 2.2,
    goalsAgainstAvg: 1.1,
    ...DEMO,
  },
  {
    id: "por",
    name: "Portugal",
    country: "Portugal",
    league: "Selecciones",
    eloRating: 2025,
    offensiveRating: 86,
    defensiveRating: 82,
    recentForm: ["W", "W", "L", "W", "D"],
    ratingHistory: [1980, 1990, 2000, 2008, 2014, 2019, 2023, 2025],
    goalsForAvg: 2.1,
    goalsAgainstAvg: 1.0,
    ...DEMO,
  },
  {
    id: "mex",
    name: "México",
    country: "México",
    league: "Selecciones",
    eloRating: 1905,
    offensiveRating: 80,
    defensiveRating: 78,
    recentForm: ["W", "D", "L", "W", "D"],
    ratingHistory: [1880, 1886, 1892, 1896, 1899, 1902, 1904, 1905],
    goalsForAvg: 1.7,
    goalsAgainstAvg: 1.2,
    ...DEMO,
  },
];

export function getTeam(id: string): Team | undefined {
  return MOCK_TEAMS.find((t) => t.id === id);
}

// --------------------------------------------------------------------- //
// Partidos
// --------------------------------------------------------------------- //
export const MOCK_MATCHES: Match[] = [
  {
    id: "m-arg-bra",
    homeTeamId: "arg",
    awayTeamId: "bra",
    homeTeamName: "Argentina",
    awayTeamName: "Brasil",
    date: "2026-06-16",
    competition: "Amistoso",
    homeGoals: 2,
    awayGoals: 1,
    homeXG: 1.9,
    awayXG: 1.4,
    ...DEMO,
  },
  {
    id: "m-fra-esp",
    homeTeamId: "fra",
    awayTeamId: "esp",
    homeTeamName: "Francia",
    awayTeamName: "España",
    date: "2026-06-15",
    competition: "Amistoso",
    homeGoals: 1,
    awayGoals: 1,
    homeXG: 1.6,
    awayXG: 1.5,
    ...DEMO,
  },
  {
    id: "m-eng-ger",
    homeTeamId: "eng",
    awayTeamId: "ger",
    homeTeamName: "Inglaterra",
    awayTeamName: "Alemania",
    date: "2026-06-14",
    competition: "Amistoso",
    homeGoals: 2,
    awayGoals: 2,
    homeXG: 1.8,
    awayXG: 2.1,
    ...DEMO,
  },
];

export const FEATURED_MATCH_ID = "m-arg-bra";

// --------------------------------------------------------------------- //
// Tiros del partido destacado (Argentina vs Brasil) — shot map / xG
// --------------------------------------------------------------------- //
function shot(
  id: string,
  teamId: string,
  playerId: string,
  playerName: string,
  minute: number,
  x: number,
  y: number,
  xg: number,
  isGoal: boolean,
  bodyPart: Shot["bodyPart"],
  situation: Shot["situation"],
): Shot {
  return {
    id,
    matchId: FEATURED_MATCH_ID,
    teamId,
    playerId,
    playerName,
    minute,
    x,
    y,
    xg,
    isGoal,
    bodyPart,
    situation,
    ...DEMO,
  };
}

export const MOCK_SHOTS: Shot[] = [
  shot("s1", "arg", "p-messi", "L. Messi", 7, 84, 56, 0.09, false, "left", "open_play"),
  shot("s2", "arg", "p-alvarez", "J. Álvarez", 12, 90, 48, 0.22, false, "right", "open_play"),
  shot("s3", "arg", "p-messi", "L. Messi", 23, 88, 40, 0.14, true, "left", "open_play"),
  shot("s4", "arg", "p-mac", "A. Mac Allister", 31, 78, 52, 0.05, false, "right", "open_play"),
  shot("s5", "arg", "p-alvarez", "J. Álvarez", 45, 93, 50, 0.36, false, "left", "fast_break"),
  shot("s6", "arg", "p-messi", "L. Messi", 58, 80, 62, 0.07, false, "right", "set_piece"),
  shot("s7", "arg", "p-alvarez", "J. Álvarez", 66, 95, 47, 0.74, true, "right", "penalty"),
  shot("s8", "arg", "p-nico", "N. González", 74, 82, 36, 0.11, false, "left", "open_play"),
  shot("s9", "arg", "p-lautaro", "L. Martínez", 88, 91, 53, 0.28, false, "right", "open_play"),
  shot("s10", "bra", "p-vini", "Vinícius Jr.", 9, 85, 44, 0.12, false, "right", "open_play"),
  shot("s11", "bra", "p-rodry", "Raphinha", 19, 79, 58, 0.06, false, "right", "open_play"),
  shot("s12", "bra", "p-vini", "Vinícius Jr.", 27, 90, 52, 0.31, false, "left", "fast_break"),
  shot("s13", "bra", "p-neymar", "Neymar", 38, 86, 38, 0.13, false, "left", "set_piece"),
  shot("s14", "bra", "p-rodry", "Raphinha", 49, 92, 49, 0.45, true, "right", "open_play"),
  shot("s15", "bra", "p-vini", "Vinícius Jr.", 61, 83, 60, 0.08, false, "left", "open_play"),
  shot("s16", "bra", "p-paqueta", "L. Paquetá", 70, 77, 47, 0.04, false, "right", "open_play"),
  shot("s17", "bra", "p-neymar", "Neymar", 79, 88, 45, 0.18, false, "left", "open_play"),
  shot("s18", "bra", "p-vini", "Vinícius Jr.", 90, 94, 51, 0.41, false, "right", "fast_break"),
];

// --------------------------------------------------------------------- //
// Jugadores (xG por jugador / equipo)
// --------------------------------------------------------------------- //
export const MOCK_PLAYERS: Player[] = [
  { id: "p-messi", name: "L. Messi", age: 38, position: "FW", team: "Argentina", league: "Selecciones", minutes: 540, goals: 4, assists: 3, xG: 3.1, xA: 2.6, rating: 8.4, ...DEMO },
  { id: "p-alvarez", name: "J. Álvarez", age: 26, position: "FW", team: "Argentina", league: "Selecciones", minutes: 510, goals: 5, assists: 1, xG: 4.2, xA: 1.1, rating: 7.9, ...DEMO },
  { id: "p-lautaro", name: "L. Martínez", age: 28, position: "FW", team: "Argentina", league: "Selecciones", minutes: 360, goals: 3, assists: 0, xG: 3.4, xA: 0.6, rating: 7.5, ...DEMO },
  { id: "p-mac", name: "A. Mac Allister", age: 27, position: "MF", team: "Argentina", league: "Selecciones", minutes: 540, goals: 1, assists: 2, xG: 0.9, xA: 1.8, rating: 7.6, ...DEMO },
  { id: "p-vini", name: "Vinícius Jr.", age: 25, position: "FW", team: "Brasil", league: "Selecciones", minutes: 520, goals: 3, assists: 4, xG: 3.8, xA: 2.9, rating: 8.1, ...DEMO },
  { id: "p-rodry", name: "Raphinha", age: 29, position: "FW", team: "Brasil", league: "Selecciones", minutes: 500, goals: 4, assists: 2, xG: 3.0, xA: 2.2, rating: 7.8, ...DEMO },
  { id: "p-neymar", name: "Neymar", age: 34, position: "FW", team: "Brasil", league: "Selecciones", minutes: 410, goals: 2, assists: 3, xG: 2.2, xA: 3.1, rating: 7.7, ...DEMO },
  { id: "p-paqueta", name: "L. Paquetá", age: 28, position: "MF", team: "Brasil", league: "Selecciones", minutes: 480, goals: 1, assists: 2, xG: 1.3, xA: 1.6, rating: 7.3, ...DEMO },
  { id: "p-mbappe", name: "K. Mbappé", age: 27, position: "FW", team: "Francia", league: "Selecciones", minutes: 540, goals: 6, assists: 2, xG: 4.9, xA: 1.7, rating: 8.3, ...DEMO },
  { id: "p-yamal", name: "L. Yamal", age: 18, position: "FW", team: "España", league: "Selecciones", minutes: 470, goals: 2, assists: 5, xG: 2.1, xA: 3.6, rating: 7.9, ...DEMO },
];

// --------------------------------------------------------------------- //
// Momentum del partido destacado (− = Brasil, + = Argentina)
// --------------------------------------------------------------------- //
export interface MomentumPoint {
  minute: number;
  value: number; // -100..100
}
export const MOCK_MOMENTUM: MomentumPoint[] = [
  { minute: 0, value: 0 },
  { minute: 10, value: 25 },
  { minute: 20, value: 40 },
  { minute: 25, value: 55 },
  { minute: 30, value: 30 },
  { minute: 40, value: -10 },
  { minute: 45, value: 35 },
  { minute: 50, value: -45 },
  { minute: 55, value: -20 },
  { minute: 66, value: 60 },
  { minute: 70, value: 35 },
  { minute: 80, value: -25 },
  { minute: 90, value: -40 },
];

// --------------------------------------------------------------------- //
// VAEP — acciones de un jugador destacado (timeline) + resúmenes
// --------------------------------------------------------------------- //
function vaep(
  id: string,
  minute: number,
  actionType: VAEPAction["actionType"],
  dScore: number,
  dConcede: number,
  success: boolean,
  coords: [number, number, number, number],
): VAEPAction {
  return {
    id,
    playerId: "p-mac",
    matchId: FEATURED_MATCH_ID,
    minute,
    actionType,
    startX: coords[0],
    startY: coords[1],
    endX: coords[2],
    endY: coords[3],
    deltaScoreProbability: dScore,
    deltaConcedeProbability: dConcede,
    vaepValue: +(dScore - dConcede).toFixed(3),
    success,
    ...DEMO,
  };
}

export const MOCK_VAEP_ACTIONS: VAEPAction[] = [
  vaep("v1", 6, "pass", 0.012, 0.001, true, [45, 50, 62, 40]),
  vaep("v2", 14, "recovery", 0.018, -0.022, true, [38, 55, 38, 55]),
  vaep("v3", 22, "carry", 0.031, 0.002, true, [55, 48, 72, 44]),
  vaep("v4", 23, "pass", 0.067, 0.003, true, [72, 44, 86, 40]),
  vaep("v5", 30, "tackle", 0.004, -0.028, true, [40, 60, 40, 60]),
  vaep("v6", 37, "pass", -0.024, 0.041, false, [60, 30, 75, 20]),
  vaep("v7", 44, "cross", 0.038, 0.004, false, [80, 12, 90, 45]),
  vaep("v8", 52, "interception", 0.006, -0.035, true, [30, 45, 30, 45]),
  vaep("v9", 60, "dribble", 0.027, 0.003, true, [58, 52, 70, 58]),
  vaep("v10", 65, "pass", 0.081, 0.002, true, [70, 58, 88, 48]),
  vaep("v11", 73, "foul", -0.005, 0.019, false, [52, 40, 52, 40]),
  vaep("v12", 81, "carry", 0.022, 0.001, true, [50, 50, 66, 46]),
  vaep("v13", 86, "pass", 0.014, 0.001, true, [66, 46, 78, 40]),
  vaep("v14", 90, "recovery", 0.011, -0.018, true, [42, 48, 42, 48]),
];

export const MOCK_VAEP_SUMMARIES: VAEPPlayerSummary[] = [
  { playerId: "p-messi", name: "L. Messi", position: "FW", team: "Argentina", league: "Selecciones", minutes: 540, vaepTotal: 8.9, vaepOffensive: 8.1, vaepDefensive: 0.8, vaepPer90: 1.48, positiveActions: 142, negativeActions: 23, progressivePasses: 61, recoveries: 18, dangerousLosses: 7, successfulCarries: 44, ...DEMO },
  { playerId: "p-vini", name: "Vinícius Jr.", position: "FW", team: "Brasil", league: "Selecciones", minutes: 520, vaepTotal: 7.6, vaepOffensive: 7.0, vaepDefensive: 0.6, vaepPer90: 1.32, positiveActions: 128, negativeActions: 31, progressivePasses: 38, recoveries: 14, dangerousLosses: 11, successfulCarries: 58, ...DEMO },
  { playerId: "p-mbappe", name: "K. Mbappé", position: "FW", team: "Francia", league: "Selecciones", minutes: 540, vaepTotal: 8.2, vaepOffensive: 7.8, vaepDefensive: 0.4, vaepPer90: 1.37, positiveActions: 119, negativeActions: 26, progressivePasses: 33, recoveries: 12, dangerousLosses: 9, successfulCarries: 49, ...DEMO },
  { playerId: "p-mac", name: "A. Mac Allister", position: "MF", team: "Argentina", league: "Selecciones", minutes: 540, vaepTotal: 6.4, vaepOffensive: 4.1, vaepDefensive: 2.3, vaepPer90: 1.07, positiveActions: 156, negativeActions: 19, progressivePasses: 88, recoveries: 41, dangerousLosses: 5, successfulCarries: 37, ...DEMO },
  { playerId: "p-yamal", name: "L. Yamal", position: "FW", team: "España", league: "Selecciones", minutes: 470, vaepTotal: 6.9, vaepOffensive: 6.2, vaepDefensive: 0.7, vaepPer90: 1.32, positiveActions: 124, negativeActions: 28, progressivePasses: 47, recoveries: 16, dangerousLosses: 8, successfulCarries: 51, ...DEMO },
  { playerId: "p-rodry", name: "Raphinha", position: "FW", team: "Brasil", league: "Selecciones", minutes: 500, vaepTotal: 6.1, vaepOffensive: 5.5, vaepDefensive: 0.6, vaepPer90: 1.10, positiveActions: 112, negativeActions: 25, progressivePasses: 41, recoveries: 15, dangerousLosses: 9, successfulCarries: 40, ...DEMO },
  { playerId: "p-neymar", name: "Neymar", position: "FW", team: "Brasil", league: "Selecciones", minutes: 410, vaepTotal: 5.4, vaepOffensive: 5.0, vaepDefensive: 0.4, vaepPer90: 1.19, positiveActions: 103, negativeActions: 30, progressivePasses: 52, recoveries: 11, dangerousLosses: 12, successfulCarries: 33, ...DEMO },
  { playerId: "p-paqueta", name: "L. Paquetá", position: "MF", team: "Brasil", league: "Selecciones", minutes: 480, vaepTotal: 4.7, vaepOffensive: 3.0, vaepDefensive: 1.7, vaepPer90: 0.88, positiveActions: 134, negativeActions: 21, progressivePasses: 74, recoveries: 33, dangerousLosses: 6, successfulCarries: 29, ...DEMO },
];

// --------------------------------------------------------------------- //
// Simulación Monte Carlo (precomputada con semilla fija → reproducible)
// --------------------------------------------------------------------- //
export const MOCK_SIMULATIONS: SimulationResult[] = runMonteCarloSimulation(
  MOCK_TEAMS,
  { iterations: 5000, seed: 20260618 },
);

// --------------------------------------------------------------------- //
// Scouting — jugadores (stats demo) enriquecidos con los modelos
// --------------------------------------------------------------------- //
type RawScout = Omit<
  ScoutingPlayer,
  "scoutingScore" | "hiddenGemScore" | "riskScore" | "source" | "reliability"
>;

const RAW_SCOUTS: RawScout[] = [
  { id: "sc-okafor", name: "D. Okafor", age: 21, position: "FW", team: "Salzburg", league: "Bundesliga AUT", minutes: 1980, goals: 14, assists: 6, xG: 11.8, xA: 5.2, rating365: 7.6, tacklesWon: 18, interceptions: 9, savesPerGame: 0, progressivePasses: 96, estimatedMarketValue: 18, popularity: 32, tags: ["High upside", "Finisher profile"] },
  { id: "sc-baleba", name: "C. Baleba", age: 20, position: "MF", team: "Brighton", league: "Premier League", minutes: 2240, goals: 2, assists: 3, xG: 1.8, xA: 3.4, rating365: 7.4, tacklesWon: 78, interceptions: 54, savesPerGame: 0, progressivePasses: 188, estimatedMarketValue: 45, popularity: 48, tags: ["Strong defensive profile", "Ball progression profile"] },
  { id: "sc-nusa", name: "A. Nusa", age: 20, position: "FW", team: "RB Leipzig", league: "Bundesliga", minutes: 1560, goals: 7, assists: 9, xG: 5.9, xA: 7.1, rating365: 7.5, tacklesWon: 22, interceptions: 12, savesPerGame: 0, progressivePasses: 124, estimatedMarketValue: 30, popularity: 38, tags: ["Creative profile", "High upside"] },
  { id: "sc-gittens", name: "J. Gittens", age: 21, position: "FW", team: "Dortmund", league: "Bundesliga", minutes: 1720, goals: 9, assists: 5, xG: 7.8, xA: 4.6, rating365: 7.3, tacklesWon: 17, interceptions: 8, savesPerGame: 0, progressivePasses: 88, estimatedMarketValue: 40, popularity: 44, tags: ["High upside", "Finisher profile"] },
  { id: "sc-thiaw", name: "M. Thiaw", age: 24, position: "DF", team: "Milan", league: "Serie A", minutes: 2610, goals: 1, assists: 1, xG: 1.2, xA: 0.8, rating365: 7.1, tacklesWon: 64, interceptions: 71, savesPerGame: 0, progressivePasses: 142, estimatedMarketValue: 35, popularity: 41, tags: ["Strong defensive profile", "Low risk"] },
  { id: "sc-bah", name: "A. Bah", age: 23, position: "DF", team: "Benfica", league: "Liga POR", minutes: 2480, goals: 2, assists: 4, xG: 1.6, xA: 3.1, rating365: 7.0, tacklesWon: 58, interceptions: 47, savesPerGame: 0, progressivePasses: 119, estimatedMarketValue: 22, popularity: 28, tags: ["Undervalued", "Ball progression profile"] },
  { id: "sc-sorloth", name: "A. Sørloth", age: 30, position: "FW", team: "Atlético", league: "LaLiga", minutes: 2380, goals: 19, assists: 4, xG: 14.1, xA: 3.0, rating365: 7.7, tacklesWon: 12, interceptions: 6, savesPerGame: 0, progressivePasses: 41, estimatedMarketValue: 28, popularity: 55, tags: ["Finisher profile", "Small sample warning"] },
  { id: "sc-bernardo", name: "Bernardo (POR)", age: 24, position: "MF", team: "Porto", league: "Liga POR", minutes: 720, goals: 3, assists: 5, xG: 2.4, xA: 4.0, rating365: 7.2, tacklesWon: 22, interceptions: 18, savesPerGame: 0, progressivePasses: 71, estimatedMarketValue: 16, popularity: 24, tags: ["Creative profile", "Small sample warning", "Needs video review"] },
  { id: "sc-hato", name: "J. Hato", age: 19, position: "DF", team: "Ajax", league: "Eredivisie", minutes: 2050, goals: 1, assists: 2, xG: 0.9, xA: 1.7, rating365: 7.2, tacklesWon: 61, interceptions: 58, savesPerGame: 0, progressivePasses: 167, estimatedMarketValue: 38, popularity: 36, tags: ["High upside", "Strong defensive profile", "Ball progression profile"] },
  { id: "sc-stiller", name: "A. Stiller", age: 24, position: "MF", team: "Stuttgart", league: "Bundesliga", minutes: 2520, goals: 3, assists: 7, xG: 2.6, xA: 6.2, rating365: 7.4, tacklesWon: 69, interceptions: 49, savesPerGame: 0, progressivePasses: 211, estimatedMarketValue: 32, popularity: 39, tags: ["Ball progression profile", "Low risk"] },
  { id: "sc-fofana", name: "M. Fofana", age: 20, position: "FW", team: "Lyon", league: "Ligue 1", minutes: 1840, goals: 11, assists: 4, xG: 8.9, xA: 3.7, rating365: 7.5, tacklesWon: 19, interceptions: 11, savesPerGame: 0, progressivePasses: 102, estimatedMarketValue: 42, popularity: 47, tags: ["High upside", "Finisher profile"] },
  { id: "sc-gomez", name: "S. Gómez", age: 22, position: "MF", team: "Pumas", league: "Liga MX", minutes: 2210, goals: 5, assists: 8, xG: 4.1, xA: 6.8, rating365: 7.1, tacklesWon: 44, interceptions: 33, savesPerGame: 0, progressivePasses: 156, estimatedMarketValue: 9, popularity: 19, tags: ["Undervalued", "Creative profile", "Needs video review"] },
  { id: "sc-lainez", name: "T. Esquivel", age: 21, position: "FW", team: "Tigres", league: "Liga MX", minutes: 1450, goals: 8, assists: 6, xG: 6.2, xA: 4.9, rating365: 7.2, tacklesWon: 21, interceptions: 14, savesPerGame: 0, progressivePasses: 97, estimatedMarketValue: 11, popularity: 22, tags: ["Undervalued", "High upside"] },
  { id: "sc-kelle", name: "K. Roos", age: 23, position: "GK", team: "Genk", league: "Pro League", minutes: 2700, goals: 0, assists: 0, xG: 0, xA: 0, rating365: 7.3, tacklesWon: 2, interceptions: 4, savesPerGame: 3.4, progressivePasses: 0, estimatedMarketValue: 14, popularity: 21, tags: ["Low risk", "Strong defensive profile"] },
  { id: "sc-svensson", name: "E. Svensson", age: 22, position: "GK", team: "Malmö", league: "Allsvenskan", minutes: 1620, goals: 0, assists: 0, xG: 0, xA: 0, rating365: 7.0, tacklesWon: 1, interceptions: 3, savesPerGame: 3.9, progressivePasses: 0, estimatedMarketValue: 6, popularity: 14, tags: ["Undervalued", "Small sample warning"] },
  { id: "sc-veiga", name: "G. Veiga", age: 22, position: "DF", team: "Al-Ahli", league: "Saudi Pro League", minutes: 1980, goals: 3, assists: 2, xG: 2.1, xA: 1.4, rating365: 6.9, tacklesWon: 47, interceptions: 39, savesPerGame: 0, progressivePasses: 124, estimatedMarketValue: 17, popularity: 26, tags: ["Ball progression profile", "Needs video review"] },
];

const WEAK_LEAGUES = new Set([
  "Liga MX",
  "Saudi Pro League",
  "Allsvenskan",
  "Bundesliga AUT",
  "Pro League",
]);

export const MOCK_SCOUTING_PLAYERS: ScoutingPlayer[] = RAW_SCOUTS.map((r) => {
  const enriched: ScoutingPlayer = {
    ...r,
    scoutingScore: 0,
    hiddenGemScore: 0,
    riskScore: 0,
    ...DEMO,
  };
  enriched.scoutingScore = calculateScoutingScore(enriched);
  enriched.hiddenGemScore = calculateHiddenGemScore(enriched);
  enriched.riskScore = calculatePlayerRiskScore(enriched);
  return enriched;
});

export function getScoutingPlayer(id: string): ScoutingPlayer | undefined {
  return MOCK_SCOUTING_PLAYERS.find((p) => p.id === id);
}

// Jugadores similares (precomputado para un jugador base de ejemplo).
const SIMILAR_BASE =
  MOCK_SCOUTING_PLAYERS.find((p) => p.id === "sc-nusa") ?? MOCK_SCOUTING_PLAYERS[0];
export const MOCK_SIMILAR_PLAYERS: SimilarPlayerResult[] = findSimilarPlayers(
  SIMILAR_BASE,
  MOCK_SCOUTING_PLAYERS,
  5,
);

// Hidden gems (jugadores <24, buen score, baja exposición).
export const MOCK_HIDDEN_GEMS: HiddenGemResult[] = MOCK_SCOUTING_PLAYERS.filter(
  (p) => p.age < 24 && p.hiddenGemScore >= 45,
)
  .sort((a, b) => b.hiddenGemScore - a.hiddenGemScore)
  .map((p) => {
    const reasons: string[] = [];
    if (p.age <= 21) reasons.push(`Solo ${p.age} años`);
    if (p.popularity < 35) reasons.push("Baja exposición mediática");
    if (WEAK_LEAGUES.has(p.league)) reasons.push("Liga menos visible");
    if (p.minutes >= 1500) reasons.push("Muestra de minutos suficiente");
    if ((p.estimatedMarketValue ?? 99) < 25) reasons.push("Valor estimado bajo");
    return { player: p, hiddenGemScore: p.hiddenGemScore, reasons, tags: p.tags };
  });

// Shortlist de reclutamiento inicial (ejemplo).
export const MOCK_RECRUITMENT: RecruitmentShortlistItem[] = ["sc-hato", "sc-nusa", "sc-stiller"]
  .map((id) => MOCK_SCOUTING_PLAYERS.find((p) => p.id === id))
  .filter((p): p is ScoutingPlayer => Boolean(p))
  .map((p) => {
    const fit = calculateRecruitmentFit(p);
    return {
      id: p.id,
      name: p.name,
      position: p.position,
      team: p.team,
      league: p.league,
      age: p.age,
      overallScore: fit.overallScore,
      offensiveScore: fit.offensiveScore,
      defensiveScore: fit.defensiveScore,
      riskScore: fit.riskScore,
      source: p.source,
      comment: fit.comment,
    };
  });

// Reportes de riesgo (precomputados para varios jugadores).
export const MOCK_RISK_REPORTS: PlayerRiskReport[] = MOCK_SCOUTING_PLAYERS.map((p) =>
  buildPlayerRiskReport(p, {
    weakLeague: WEAK_LEAGUES.has(p.league),
    recentTransfer: p.id === "sc-veiga",
  }),
);
