// =====================================================================
// todayContextModel.ts — capa de CONTEXTO RECIENTE para Value Picks.
//
// Convierte las stats del último partido (365Scores) en probabilidades por
// mercado (corners, tiros, atajadas, tarjetas, portería a cero, goles, BTTS).
// NO reemplaza el modelo base: evaluateMarket mezcla base*0.85 + contexto*0.15
// (+ pequeño ajuste por escenario de grupo) y penaliza por sampleSize=1.
// =====================================================================

import { getTodayMatchContext } from "./statScreenshotContext";
import { getMatchScenario } from "@/lib/worldcup/scenarios";
import type { BetMarket, MatchModelParams } from "@/lib/bet/types";
import type { TeamRecentMatchStats } from "@/data/todayMatchContextStats";

// --- Poisson helpers (locales, sin dependencias) ---------------------
function fact(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}
function pmf(k: number, lambda: number): number {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / fact(k);
}
/** P(X > line) si over; P(X <= line) si under. line tipo 7.5 / 4.5. */
function poissonOver(lambda: number, line: number, over: boolean): number {
  const threshold = Math.floor(line); // over 7.5 → k>=8
  let cum = 0;
  for (let k = 0; k <= threshold; k++) cum += pmf(k, lambda);
  const pOver = 1 - cum;
  return over ? pOver : cum;
}
const avg = (a: number, b: number) => (a + b) / 2;
const clamp01 = (v: number) => Math.max(0.01, Math.min(0.99, v));
const isOverSel = (s: string) => /\b(over|m[áa]s)\b/i.test(s) || s.includes("+");

// --- Lambdas de contexto por partido ---------------------------------
export interface ContextLambdas {
  cornersHome: number;
  cornersAway: number;
  cornersTotal: number;
  shotsHome: number;
  shotsAway: number;
  sotHome: number;
  sotAway: number;
  savesHome: number; // atajadas esperadas del portero local
  savesAway: number;
  cardsTotal: number;
  xgHome: number;
  xgAway: number;
}

function lambdasFrom(home: TeamRecentMatchStats | null, away: TeamRecentMatchStats | null, baseCards: number): ContextLambdas {
  const h = home;
  const a = away;
  const cornersHome = h ? avg(h.corners, a?.cornersAgainst ?? h.corners) : 5;
  const cornersAway = a ? avg(a.corners, h?.cornersAgainst ?? a.corners) : 5;
  const shotsHome = h?.shots ?? 11;
  const shotsAway = a?.shots ?? 11;
  const sotHome = h?.shotsOnTarget ?? 4;
  const sotAway = a?.shotsOnTarget ?? 4;
  // Atajadas del portero = tiros a puerta que enfrenta (genera el rival) menos goles.
  const savesHome = h ? avg(a?.shotsOnTarget ?? sotAway, h.shotsOnTargetAgainst) : 3;
  const savesAway = a ? avg(h?.shotsOnTarget ?? sotHome, a.shotsOnTargetAgainst) : 3;
  // Tarjetas: mezcla de amarillas recientes (1 partido, peso 60%) con la base
  // del torneo (40%). Partidos recientes limpios → mercado de tarjetas moderado.
  const recentCards = (h?.yellowCards ?? 0) + (h?.redCards ?? 0) + (a?.yellowCards ?? 0) + (a?.redCards ?? 0);
  const cardsTotal = h || a ? recentCards * 0.6 + baseCards * 0.4 : baseCards;
  const xgHome = h ? avg(h.xg, a?.xgAgainst ?? h.xg) : 1.3;
  const xgAway = a ? avg(a.xg, h?.xgAgainst ?? a.xg) : 1.1;
  return { cornersHome, cornersAway, cornersTotal: cornersHome + cornersAway, shotsHome, shotsAway, sotHome, sotAway, savesHome, savesAway, cardsTotal, xgHome, xgAway };
}

// --- API por mercado (para UI / boosts) ------------------------------
export interface ContextResult {
  lambdas: ContextLambdas;
  notes: string[];
  hasContext: boolean;
  sampleSize: number;
}

export function calculateRecentContextBoosts(matchId: string): ContextResult | null {
  const ctx = getTodayMatchContext(matchId);
  if (!ctx || !ctx.hasContext) return null;
  const lambdas = lambdasFrom(ctx.homeStats, ctx.awayStats, 4.6);
  const notes: string[] = [];
  const h = ctx.homeStats;
  const a = ctx.awayStats;
  if (h) notes.push(`${h.teamName}: ${h.shots} remates, ${h.shotsOnTarget} a puerta, ${h.corners} corners, ${h.xg} xG (vs ${h.opponentName}).`);
  if (a) notes.push(`${a.teamName}: ${a.shots} remates, ${a.corners} corners${a.cornersAgainst != null ? `, ${a.cornersAgainst} corners concedidos` : ""}, ${a.gkSaves} atajadas (vs ${a.opponentName}).`);
  return { lambdas, notes, hasContext: true, sampleSize: ctx.sampleSize };
}

export const calculateCornerContext = (matchId: string) => calculateRecentContextBoosts(matchId)?.lambdas ?? null;
export const calculateShotVolumeContext = (matchId: string) => calculateRecentContextBoosts(matchId)?.lambdas ?? null;
export const calculateCardsContext = (matchId: string) => calculateRecentContextBoosts(matchId)?.lambdas.cardsTotal ?? null;
export const calculateGoalkeeperSavesContext = (matchId: string) => {
  const l = calculateRecentContextBoosts(matchId)?.lambdas;
  return l ? { savesHome: l.savesHome, savesAway: l.savesAway } : null;
};
export function calculateCleanSheetContext(matchId: string): { home: number; away: number } | null {
  const l = calculateRecentContextBoosts(matchId)?.lambdas;
  if (!l) return null;
  return { home: clamp01(Math.exp(-l.xgAway)), away: clamp01(Math.exp(-l.xgHome)) };
}
export const calculatePlayerPropsContext = (matchId: string) => calculateRecentContextBoosts(matchId)?.lambdas ?? null;

// --- Probabilidad de contexto para un mercado concreto ---------------
/**
 * Probabilidad que el contexto reciente asigna a la selección del mercado, o
 * null si el mercado no es sensible al contexto / no hay datos. evaluateMarket
 * la mezcla con la base.
 */
export function recentContextProbability(
  market: BetMarket,
  params: MatchModelParams,
): { prob: number; notes: string[] } | null {
  const boosts = calculateRecentContextBoosts(market.matchId);
  if (!boosts) return null;
  const l = boosts.lambdas;
  const sel = market.selection.toLowerCase();
  const over = isOverSel(sel);
  const line = market.line ?? 0;
  const isAway = market.teamId === params.awayId;

  switch (market.marketType) {
    case "corners":
    case "team_total_corners": {
      const lambda = market.marketType === "team_total_corners" ? (isAway ? l.cornersAway : l.cornersHome) : l.cornersTotal;
      return { prob: clamp01(poissonOver(lambda, line || (market.marketType === "corners" ? 9.5 : 4.5), over)), notes: [`Corners λ≈${lambda.toFixed(1)} (contexto reciente).`] };
    }
    case "team_shots": {
      const lambda = isAway ? l.shotsAway : l.shotsHome;
      return { prob: clamp01(poissonOver(lambda, line || 10.5, over)), notes: [`Remates λ≈${lambda.toFixed(1)}.`] };
    }
    case "team_shots_on_target": {
      const lambda = isAway ? l.sotAway : l.sotHome;
      return { prob: clamp01(poissonOver(lambda, line || 4.5, over)), notes: [`Tiros a puerta λ≈${lambda.toFixed(1)}.`] };
    }
    case "goalkeeper_saves": {
      const lambda = isAway ? l.savesAway : l.savesHome;
      return { prob: clamp01(poissonOver(lambda, line || 3.5, over || market.line == null)), notes: [`Atajadas λ≈${lambda.toFixed(1)}.`] };
    }
    case "cards":
    case "team_total_cards": {
      const lambda = market.marketType === "team_total_cards" ? l.cardsTotal / 2 : l.cardsTotal;
      return { prob: clamp01(poissonOver(lambda, line || 4.5, over)), notes: [`Tarjetas λ≈${lambda.toFixed(1)} (recientes bajas → mercado moderado).`] };
    }
    case "total_goals": {
      const lambda = l.xgHome + l.xgAway;
      return { prob: clamp01(poissonOver(lambda, line || 2.5, over)), notes: [`Goles esperados (contexto) ≈${lambda.toFixed(2)}.`] };
    }
    case "both_teams_score": {
      const yes = clamp01((1 - Math.exp(-l.xgHome)) * (1 - Math.exp(-l.xgAway)));
      const wantsYes = /^s|s[íi]|yes/i.test(sel);
      return { prob: wantsYes ? yes : 1 - yes, notes: [`BTTS desde xG contexto (${l.xgHome.toFixed(2)}/${l.xgAway.toFixed(2)}).`] };
    }
    case "team_total_goals": {
      const lambda = isAway ? l.xgAway : l.xgHome;
      return { prob: clamp01(poissonOver(lambda, line || 1.5, over)), notes: [`xG equipo (contexto) ≈${lambda.toFixed(2)}.`] };
    }
    default:
      return null;
  }
}

/** Pequeño ajuste por escenario de grupo en mercados de volumen ofensivo. */
export function scenarioVolumeNudge(market: BetMarket, params: MatchModelParams): number {
  const volume = ["corners", "team_total_corners", "team_shots", "team_shots_on_target", "total_goals", "team_total_goals"];
  if (!volume.includes(market.marketType)) return 0;
  const sc = getMatchScenario(params.homeId, params.awayId);
  const side = market.teamId === params.awayId ? sc.away : sc.home;
  if (!side) return 0;
  // Un favorito motivado / que debe ganar empuja volumen ofensivo hacia arriba.
  const push = (side.motivationScore - 0.5) * 0.04 + side.mustWinPressure * 0.02;
  return isOverSel(market.selection) ? push : -push;
}
