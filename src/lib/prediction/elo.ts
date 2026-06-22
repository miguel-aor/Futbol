// =====================================================================
// Puente Elo → λ (goles esperados) → 1X2 con Dixon-Coles.
//
// ÚNICA FUENTE DE VERDAD de la predicción basada en Elo: la usan TANTO el
// backtest (scripts/backtest.ts) como la app en vivo, para que el número
// reportado por el backtest sea exactamente la matemática que corre la app.
//
// Referencias: World Football Elo; Maher (1982); Dixon & Coles (1997).
// Determinista: sin Math.random ni Date.now.
// =====================================================================

import { clamp, dcOutcomeFromExpectedGoals } from "./math";

/** Corrección Dixon-Coles (empíricamente ~ -0.13 en fútbol internacional). */
export const DC_RHO = -0.13;
/** λ base (media de goles por equipo en partido parejo). */
export const ELO_LAMBDA_BASE = 1.35;
/** Ventaja de localía en puntos de Elo (0 en cancha neutral). */
export const ELO_HOME_ADV = 65;

/**
 * Convierte una diferencia de rating Elo en goles esperados (λ) de cada lado.
 * Denominador plano (400) que mantiene la varianza de un partido cerca de la
 * frecuencia real de sorpresas. Clamp [0.3, 3.5].
 */
export function lambdasFromElo(
  ratingHome: number,
  ratingAway: number,
  neutral = false,
): { lambdaHome: number; lambdaAway: number } {
  const homeAdv = neutral ? 0 : ELO_HOME_ADV;
  const diff = ratingHome + homeAdv - ratingAway;
  return {
    lambdaHome: clamp(ELO_LAMBDA_BASE + diff / 400, 0.3, 3.5),
    lambdaAway: clamp(ELO_LAMBDA_BASE - diff / 400, 0.3, 3.5),
  };
}

/**
 * Probabilidades 1X2 a partir de los ratings Elo, vía Poisson + Dixon-Coles.
 * Es la función que comparten backtest y app.
 */
export function predictFromElo(
  ratingHome: number,
  ratingAway: number,
  opts: { neutral?: boolean; rho?: number; maxGoals?: number } = {},
): { homeWin: number; draw: number; awayWin: number; lambdaHome: number; lambdaAway: number } {
  const { lambdaHome, lambdaAway } = lambdasFromElo(
    ratingHome,
    ratingAway,
    opts.neutral ?? false,
  );
  const out = dcOutcomeFromExpectedGoals(lambdaHome, lambdaAway, {
    rho: opts.rho ?? DC_RHO,
    maxGoals: opts.maxGoals ?? 8,
  });
  return { ...out, lambdaHome, lambdaAway };
}
