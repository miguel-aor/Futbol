// =====================================================================
// exactScoreModel.ts — marcadores exactos probables por partido.
//
// Sale de una MATRIZ de probabilidades Poisson/Dixon-Coles con xG proyectado
// (predictMatchup) AJUSTADO por el contexto reciente (stats 365Scores). No se
// inventan marcadores: todo deriva de la matriz. La misma matriz alimenta 1X2,
// goles, BTTS, team totals, hándicap y portería a cero. Correct score se marca
// de ALTA VARIANZA (no Strong Value automático).
// =====================================================================

import { computeWorldCupMatches } from "@/lib/worldcup-2026/tournament-form";
import { predictMatchup } from "@/lib/worldcup-2026/prediction-features";
import { calculateMatchOutcomeProbabilities, generateScoreMatrix } from "@/lib/footballModels";
import { calculateRecentContextBoosts } from "./todayContextModel";
import { getTodayMatchContext } from "./statScreenshotContext";

export interface ExactScoreProbability {
  homeGoals: number;
  awayGoals: number;
  scoreline: string;
  probability: number;
  fairOddsDecimal: number;
  fairOddsAmerican: number;
  modelNotes: string[];
}

export interface ExactScoreResult {
  matchId: string;
  homeName: string;
  awayName: string;
  xgHome: number;
  xgAway: number;
  expectedGoals: number;
  homeWin: number;
  draw: number;
  awayWin: number;
  bttsYes: number;
  over25: number;
  homeCleanSheet: number;
  awayCleanSheet: number;
  topScores: ExactScoreProbability[];
  notes: string[];
  hasRecentContext: boolean;
}

function fairAmerican(p: number): number {
  const d = 1 / Math.max(0.0001, p);
  return d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1));
}

let fixtures: ReturnType<typeof computeWorldCupMatches> | null = null;
function allFixtures() {
  if (!fixtures) fixtures = computeWorldCupMatches();
  return fixtures;
}

/** Matriz de marcadores exactos + mercados derivados para un partido. */
export function calculateExactScoreMatrix(matchId: string): ExactScoreResult | null {
  const m = allFixtures().find((f) => f.id === matchId);
  if (!m) return null;

  const pred = predictMatchup(m.homeId, m.awayId);
  let xgHome = pred?.homeXG ?? 1.3;
  let xgAway = pred?.awayXG ?? 1.1;

  const notes: string[] = [];
  const boosts = calculateRecentContextBoosts(matchId);
  const ctx = getTodayMatchContext(matchId);
  const hasRecentContext = Boolean(boosts);
  if (boosts && ctx) {
    // Ajusta el xG base con el xG de contexto reciente (peso 50%). Se usa el xG y
    // el VOLUMEN, no los goles reales: un 0-0 con xG alto no debe bajar el lambda.
    xgHome = Number((xgHome * 0.5 + boosts.lambdas.xgHome * 0.5).toFixed(2));
    xgAway = Number((xgAway * 0.5 + boosts.lambdas.xgAway * 0.5).toFixed(2));
    // Regresión de definición: si un equipo generó mucho xG pero anotó por debajo
    // (mala definición / varianza), se espera regresión AL ALZA, no a la baja.
    const bump = (s: { xg: number; scoreFor: number } | null) =>
      s && s.xg - s.scoreFor >= 1 ? Math.min(0.15, (s.xg - s.scoreFor) * 0.06) : 0;
    xgHome = Number((xgHome * (1 + bump(ctx.homeStats))).toFixed(2));
    xgAway = Number((xgAway * (1 + bump(ctx.awayStats))).toFixed(2));
    notes.push(`xG ajustado por contexto reciente (365Scores, usa xG/volumen no goles): ${m.homeName} ${xgHome} / ${m.awayName} ${xgAway}.`);
  } else {
    notes.push(`xG del modelo base: ${m.homeName} ${xgHome} / ${m.awayName} ${xgAway}.`);
  }

  const maxGoals = 8; // cubre goleadas (6-0, 7-0) en mismatches
  const matrix = generateScoreMatrix(xgHome, xgAway, maxGoals, -0.05);
  const outcome = calculateMatchOutcomeProbabilities(matrix);

  const scores: ExactScoreProbability[] = [];
  let bttsYes = 0;
  let over25 = 0;
  let homeCleanSheet = 0;
  let awayCleanSheet = 0;
  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      const p = matrix[h][a];
      if (a === 0) awayCleanSheet += p; // visitante no recibe → … (ver abajo)
      if (h === 0) homeCleanSheet += p;
      if (h >= 1 && a >= 1) bttsYes += p;
      if (h + a > 2.5) over25 += p;
      scores.push({
        homeGoals: h,
        awayGoals: a,
        scoreline: `${h}-${a}`,
        probability: p,
        fairOddsDecimal: Number((1 / Math.max(0.0001, p)).toFixed(2)),
        fairOddsAmerican: fairAmerican(p),
        modelNotes: [],
      });
    }
  }
  // Portería a cero: equipo local mantiene el cero ⇒ visitante marca 0 (a===0).
  // Recalcular correctamente:
  homeCleanSheet = 0;
  awayCleanSheet = 0;
  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      if (a === 0) homeCleanSheet += matrix[h][a]; // visitante no anota
      if (h === 0) awayCleanSheet += matrix[h][a]; // local no anota
    }
  }

  const topScores = [...scores].sort((x, y) => y.probability - x.probability).slice(0, 8);

  return {
    matchId,
    homeName: m.homeName,
    awayName: m.awayName,
    xgHome,
    xgAway,
    expectedGoals: Number((xgHome + xgAway).toFixed(2)),
    homeWin: outcome.homeWin,
    draw: outcome.draw,
    awayWin: outcome.awayWin,
    bttsYes,
    over25,
    homeCleanSheet,
    awayCleanSheet,
    topScores,
    notes,
    hasRecentContext,
  };
}

/** Partidos del calendario en una fecha dada (ISO yyyy-mm-dd, UTC del fixture). */
export function getMatchesOnDate(dateIso: string): { id: string; homeName: string; awayName: string }[] {
  return allFixtures()
    .filter((f) => f.kickoff.slice(0, 10) === dateIso)
    .map((f) => ({ id: f.id, homeName: f.homeName, awayName: f.awayName }));
}
