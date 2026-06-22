// Utilidades matematicas deterministas para el motor de prediccion.
// Sin Math.random: todo se deriva de semillas para evitar mismatches
// de hidratacion entre servidor y cliente.

/** PRNG determinista (mulberry32). */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash estable de un string a entero (para semillas reproducibles). */
export function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

export function round(x: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(x * f) / f;
}

/** Funcion de masa de Poisson: P(X = k). */
export function poissonPmf(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

/** P(X <= k). */
export function poissonCdf(lambda: number, k: number): number {
  let sum = 0;
  for (let i = 0; i <= k; i++) sum += poissonPmf(lambda, i);
  return clamp(sum, 0, 1);
}

/** P(X >= k). */
export function poissonAtLeast(lambda: number, k: number): number {
  if (k <= 0) return 1;
  return clamp(1 - poissonCdf(lambda, k - 1), 0, 1);
}

/** P(total > linea) para un total con media lambda y linea .5. */
export function poissonOverLine(lambda: number, line: number): number {
  // line tipo 2.5 -> over = P(X >= 3) = P(X >= ceil(line))
  const k = Math.ceil(line);
  return poissonAtLeast(lambda, k);
}

/** Distribucion 1X2 a partir de goles esperados de cada lado (Poisson). */
export function outcomeFromExpectedGoals(
  lambdaHome: number,
  lambdaAway: number,
  maxGoals = 8,
): { homeWin: number; draw: number; awayWin: number } {
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let h = 0; h <= maxGoals; h++) {
    const ph = poissonPmf(lambdaHome, h);
    for (let a = 0; a <= maxGoals; a++) {
      const pa = poissonPmf(lambdaAway, a);
      const p = ph * pa;
      if (h > a) home += p;
      else if (h === a) draw += p;
      else away += p;
    }
  }
  const total = home + draw + away || 1;
  return { homeWin: home / total, draw: draw / total, awayWin: away / total };
}

/** P(ambos anotan) con goles esperados de cada lado. */
export function bttsProbability(lambdaHome: number, lambdaAway: number): number {
  const pHome0 = poissonPmf(lambdaHome, 0);
  const pAway0 = poissonPmf(lambdaAway, 0);
  return clamp(1 - pHome0 - pAway0 + pHome0 * pAway0, 0, 1);
}

/**
 * Ajuste tau de Dixon-Coles (Dixon & Coles, 1997): corrige la dependencia en
 * marcadores bajos (0-0, 1-0, 0-1, 1-1) que la Poisson independiente estima mal.
 * rho < 0 sube empates 0-0/1-1 y baja 1-0/0-1. Con rho = 0, tau = 1 (sin efecto).
 */
function dcTau(
  h: number,
  a: number,
  lambda: number,
  mu: number,
  rho: number,
): number {
  if (h === 0 && a === 0) return 1 - lambda * mu * rho;
  if (h === 0 && a === 1) return 1 + lambda * rho;
  if (h === 1 && a === 0) return 1 + mu * rho;
  if (h === 1 && a === 1) return 1 - rho;
  return 1;
}

/**
 * Distribución 1X2 con corrección Dixon-Coles. Idéntica a
 * `outcomeFromExpectedGoals` cuando rho = 0 (default), por lo que es un superset
 * seguro: ningún caller existente cambia de comportamiento.
 */
export function dcOutcomeFromExpectedGoals(
  lambdaHome: number,
  lambdaAway: number,
  opts: { maxGoals?: number; rho?: number } = {},
): { homeWin: number; draw: number; awayWin: number } {
  const maxGoals = opts.maxGoals ?? 8;
  const rho = opts.rho ?? 0;
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let h = 0; h <= maxGoals; h++) {
    const ph = poissonPmf(lambdaHome, h);
    for (let a = 0; a <= maxGoals; a++) {
      const pa = poissonPmf(lambdaAway, a);
      const p = ph * pa * dcTau(h, a, lambdaHome, lambdaAway, rho);
      if (h > a) home += p;
      else if (h === a) draw += p;
      else away += p;
    }
  }
  const total = home + draw + away || 1;
  return { homeWin: home / total, draw: draw / total, awayWin: away / total };
}
