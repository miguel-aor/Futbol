// =====================================================================
// footballModels.ts — modelos matemáticos/estadísticos aplicados al fútbol.
//
// Funciones PURAS y DETERMINISTAS. La aleatoriedad del Monte Carlo usa un
// PRNG con semilla (mulberry32), no Math.random, para que el resultado sea
// reproducible y seguro durante el render del servidor (sin desajustes de
// hidratación). Todas las visualizaciones consumen estas funciones.
// =====================================================================

import type {
  PoissonInputs,
  PoissonOutputs,
  SimulationResult,
  Team,
  VAEPPlayerSummary,
} from "@/lib/analytics/types";

// --------------------------------------------------------------------- //
// Utilidades numéricas
// --------------------------------------------------------------------- //
function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** PRNG determinista con semilla (mulberry32). Devuelve floats en [0,1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Muestrea una Poisson(lambda) con el algoritmo de Knuth usando un rng dado. */
function samplePoisson(lambda: number, rng: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

// --------------------------------------------------------------------- //
// Elo / SPI
// --------------------------------------------------------------------- //

/**
 * Probabilidad esperada (resultado esperado) del equipo A frente a B.
 * Curva logística estándar de Elo; homeAdvantage suma puntos de rating a A.
 */
export function eloExpectedScore(
  ratingA: number,
  ratingB: number,
  homeAdvantage = 0,
): number {
  return 1 / (1 + Math.pow(10, (ratingB - (ratingA + homeAdvantage)) / 400));
}

export interface EloChange {
  newRatingA: number;
  newRatingB: number;
  /** Cambio aplicado al equipo A (+ gana rating, − pierde). */
  delta: number;
  expectedA: number;
}

/**
 * Cambio de rating Elo tras un partido (modelo World Football Elo).
 * @param resultA 1 = gana A, 0.5 = empate, 0 = pierde A.
 * @param opts.goalDiff diferencia de goles (amplifica el cambio).
 */
export function calculateEloChange(
  ratingA: number,
  ratingB: number,
  resultA: 0 | 0.5 | 1,
  opts: { k?: number; homeAdvantage?: number; goalDiff?: number } = {},
): EloChange {
  const k = opts.k ?? 20;
  const homeAdvantage = opts.homeAdvantage ?? 0;
  const goalDiff = Math.abs(opts.goalDiff ?? 0);
  const expectedA = eloExpectedScore(ratingA, ratingB, homeAdvantage);
  // Multiplicador por margen de victoria (g): 1 si diferencia ≤1, 1.5 si =2,
  // y crece suavemente para goleadas.
  const g =
    goalDiff <= 1 ? 1 : goalDiff === 2 ? 1.5 : (11 + goalDiff) / 8;
  const delta = k * g * (resultA - expectedA);
  return {
    newRatingA: ratingA + delta,
    newRatingB: ratingB - delta,
    delta,
    expectedA,
  };
}

/** Probabilidades 1X2 derivadas solo del Elo (incluye margen de empate). */
export function eloMatchProbabilities(
  ratingHome: number,
  ratingAway: number,
  homeAdvantage = 65,
): { homeWin: number; draw: number; awayWin: number } {
  const exp = eloExpectedScore(ratingHome, ratingAway, homeAdvantage);
  // El "resultado esperado" reparte empates; aproximamos la fracción de
  // empate con una campana centrada en partidos parejos.
  const draw = clamp(0.32 - 0.42 * Math.abs(exp - 0.5), 0.12, 0.32);
  const homeWin = exp * (1 - draw);
  const awayWin = (1 - exp) * (1 - draw);
  const total = homeWin + draw + awayWin;
  return {
    homeWin: homeWin / total,
    draw: draw / total,
    awayWin: awayWin / total,
  };
}

// --------------------------------------------------------------------- //
// Poisson / Dixon-Coles
// --------------------------------------------------------------------- //

/** Probabilidad puntual de la Poisson: P(X = k | lambda). */
export function poissonProbability(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

/**
 * Goles esperados (xG) de cada equipo a partir de fuerzas relativas.
 * homeXG = mediaLocalLiga · ataqueLocal · defensaVisita · ventajaLocalía.
 */
export function calculateExpectedGoalsPoisson(
  inputs: PoissonInputs,
): { homeXG: number; awayXG: number } {
  const homeXG =
    inputs.leagueHomeGoals *
    inputs.homeAttack *
    inputs.awayDefense *
    inputs.homeAdvantage;
  const awayXG =
    inputs.leagueAwayGoals * inputs.awayAttack * inputs.homeDefense;
  return { homeXG: clamp(homeXG, 0.05, 6), awayXG: clamp(awayXG, 0.05, 6) };
}

/**
 * Ajuste tau de Dixon-Coles: corrige la dependencia en marcadores bajos
 * (0-0, 1-0, 0-1, 1-1), que la Poisson independiente subestima/sobreestima.
 * rho < 0 sube empates 0-0/1-1 y baja 1-0/0-1.
 */
function dixonColesTau(
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
 * Matriz de probabilidades de marcador exacto (0..maxGoals por lado) con
 * ajuste Dixon-Coles. Se normaliza para que sume 1 tras truncar y aplicar tau.
 */
export function generateScoreMatrix(
  homeXG: number,
  awayXG: number,
  maxGoals = 5,
  rho = -0.05,
): number[][] {
  const m: number[][] = [];
  let sum = 0;
  for (let h = 0; h <= maxGoals; h++) {
    m[h] = [];
    for (let a = 0; a <= maxGoals; a++) {
      const p =
        poissonProbability(homeXG, h) *
        poissonProbability(awayXG, a) *
        dixonColesTau(h, a, homeXG, awayXG, rho);
      m[h][a] = p;
      sum += p;
    }
  }
  if (sum > 0) {
    for (let h = 0; h <= maxGoals; h++) {
      for (let a = 0; a <= maxGoals; a++) m[h][a] /= sum;
    }
  }
  return m;
}

/** Agrega una matriz de marcadores en probabilidades 1X2, O/U 2.5 y BTTS. */
export function calculateMatchOutcomeProbabilities(matrix: number[][]): Omit<
  PoissonOutputs,
  "homeXG" | "awayXG" | "matrix"
> {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  let over25 = 0;
  let bttsYes = 0;
  let best = { home: 0, away: 0, prob: 0 };
  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      const p = matrix[h][a];
      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;
      if (h + a >= 3) over25 += p;
      if (h > 0 && a > 0) bttsYes += p;
      if (p > best.prob) best = { home: h, away: a, prob: p };
    }
  }
  return {
    homeWin,
    draw,
    awayWin,
    over25,
    under25: 1 - over25,
    bttsYes,
    bttsNo: 1 - bttsYes,
    mostLikelyScore: best,
  };
}

/** Pipeline completo Poisson/Dixon-Coles: inputs → todas las salidas. */
export function predictPoisson(
  inputs: PoissonInputs,
  maxGoals = 5,
  rho = -0.05,
): PoissonOutputs {
  const { homeXG, awayXG } = calculateExpectedGoalsPoisson(inputs);
  const matrix = generateScoreMatrix(homeXG, awayXG, maxGoals, rho);
  const outcomes = calculateMatchOutcomeProbabilities(matrix);
  return { homeXG, awayXG, matrix, ...outcomes };
}

// --------------------------------------------------------------------- //
// Monte Carlo
// --------------------------------------------------------------------- //
export interface MonteCarloOptions {
  iterations?: number;
  seed?: number;
  /** Cuántos clasifican del grupo (por defecto 2). */
  qualifyTop?: number;
}

/** Convierte una diferencia de ratings ofensivo/defensivo en goles esperados. */
function lambdaFromRatings(attack: number, oppDefense: number): number {
  // base 1.35 goles, escalado logarítmico por diferencia ataque-defensa.
  return clamp(1.35 * Math.pow(10, (attack - oppDefense) / 40), 0.2, 5);
}

/**
 * Simula N veces una fase de grupos (round-robin) + llave de eliminación
 * directa sembrada por la tabla, usando marcadores Poisson basados en los
 * ratings de cada equipo. Devuelve probabilidades agregadas por equipo.
 *
 * Reproducible: misma semilla → mismo resultado (sin Math.random).
 */
export function runMonteCarloSimulation(
  teams: Team[],
  options: MonteCarloOptions = {},
): SimulationResult[] {
  const iterations = options.iterations ?? 10000;
  const qualifyTop = options.qualifyTop ?? 2;
  const rng = mulberry32(options.seed ?? 0x9e3779b9);
  const n = teams.length;

  const positions: number[][] = teams.map(() => new Array(n).fill(0));
  const qualify = new Array(n).fill(0);
  const first = new Array(n).fill(0);
  const semi = new Array(n).fill(0);
  const fin = new Array(n).fill(0);
  const champ = new Array(n).fill(0);
  const pointsSum = new Array(n).fill(0);

  const canKnockout = n === 8; // llave estándar de 8 solo si hay 8 equipos.

  for (let it = 0; it < iterations; it++) {
    const pts = new Array(n).fill(0);
    const gf = new Array(n).fill(0);
    const ga = new Array(n).fill(0);

    // Round-robin simple (cada par una vez, campo neutral).
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const li = lambdaFromRatings(
          teams[i].offensiveRating,
          teams[j].defensiveRating,
        );
        const lj = lambdaFromRatings(
          teams[j].offensiveRating,
          teams[i].defensiveRating,
        );
        const gi = samplePoisson(li, rng);
        const gj = samplePoisson(lj, rng);
        gf[i] += gi;
        ga[i] += gj;
        gf[j] += gj;
        ga[j] += gi;
        if (gi > gj) pts[i] += 3;
        else if (gi < gj) pts[j] += 3;
        else {
          pts[i] += 1;
          pts[j] += 1;
        }
      }
    }

    // Orden final: puntos, dif. de gol, goles a favor, desempate aleatorio.
    const order = [...Array(n).keys()].sort(
      (a, b) =>
        pts[b] - pts[a] ||
        gf[b] - ga[b] - (gf[a] - ga[a]) ||
        gf[b] - gf[a] ||
        rng() - 0.5,
    );
    order.forEach((teamIdx, pos) => {
      positions[teamIdx][pos] += 1;
      pointsSum[teamIdx] += pts[teamIdx];
    });
    for (let pos = 0; pos < qualifyTop && pos < n; pos++) qualify[order[pos]] += 1;
    first[order[0]] += 1;

    // Llave de eliminación directa (8 equipos sembrados 1-8).
    if (canKnockout) {
      const playKO = (a: number, b: number): number => {
        const pHome = eloExpectedScore(teams[a].eloRating, teams[b].eloRating);
        return rng() < pHome ? a : b;
      };
      const qf: Array<[number, number]> = [
        [order[0], order[7]],
        [order[3], order[4]],
        [order[2], order[5]],
        [order[1], order[6]],
      ];
      const semifinalists = qf.map(([a, b]) => playKO(a, b));
      semifinalists.forEach((w) => (semi[w] += 1));
      const finalists = [
        playKO(semifinalists[0], semifinalists[1]),
        playKO(semifinalists[2], semifinalists[3]),
      ];
      finalists.forEach((w) => (fin[w] += 1));
      const winner = playKO(finalists[0], finalists[1]);
      champ[winner] += 1;
    }
  }

  return teams
    .map((t, i) => ({
      teamId: t.id,
      teamName: t.name,
      qualify: qualify[i] / iterations,
      firstPlace: first[i] / iterations,
      semifinal: canKnockout ? semi[i] / iterations : 0,
      final: canKnockout ? fin[i] / iterations : 0,
      champion: canKnockout ? champ[i] / iterations : 0,
      expectedPoints: pointsSum[i] / iterations,
      positionDistribution: positions[i].map((c) => c / iterations),
      source: t.source,
      reliability: t.reliability,
    }))
    .sort((a, b) => b.champion - a.champion || b.qualify - a.qualify);
}

// --------------------------------------------------------------------- //
// VAEP
// --------------------------------------------------------------------- //

/**
 * Valor VAEP de una acción: cuánto sube la probabilidad de anotar menos
 * cuánto sube la de conceder. VAEP = ΔP(anotar) − ΔP(conceder).
 */
export function calculateVAEP(
  deltaScoreProbability: number,
  deltaConcedeProbability: number,
): number {
  return deltaScoreProbability - deltaConcedeProbability;
}

/** Ordena jugadores por VAEP total (descendente). */
export function rankPlayersByVAEP(
  players: VAEPPlayerSummary[],
): VAEPPlayerSummary[] {
  return [...players].sort((a, b) => b.vaepTotal - a.vaepTotal);
}
