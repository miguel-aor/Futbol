// =====================================================================
// Pesos de capas para la predicción del Mundial 2026.
//
// Idea central (pedido del usuario): los partidos YA JUGADOS del Mundial
// actual deben pesar MÁS que el historial viejo / rankings / Elo. Si un
// equipo ya disputó 2+ partidos en el torneo, su forma actual domina aún más.
// =====================================================================

import type { PredictionWeights, StrengthLayer } from "@/lib/worldcup-2026/types";

/** Pesos base: hay poca muestra del Mundial (0-1 partidos jugados). */
export const BASE_WEIGHTS: PredictionWeights = {
  currentWorldCup: 0.5,
  recentNationalTeam: 0.3,
  eloRanking: 0.15,
  clubPlayerForm: 0.05,
};

/** Pesos cuando hay muestra suficiente (2+ partidos en el Mundial). */
export const HIGH_WC_WEIGHTS: PredictionWeights = {
  currentWorldCup: 0.65,
  recentNationalTeam: 0.2,
  eloRanking: 0.1,
  clubPlayerForm: 0.05,
};

/** Elige los pesos según cuántos partidos lleva el equipo en el Mundial. */
export function chooseWeights(matchesPlayedWC: number): PredictionWeights {
  return matchesPlayedWC >= 2 ? HIGH_WC_WEIGHTS : BASE_WEIGHTS;
}

/**
 * Mezcla ponderada de capas para un atributo (attack/defense). Ignora capas
 * sin dato (valor null) y renormaliza los pesos restantes — así nunca se
 * inventa un valor: si la única capa con datos es el Mundial, manda esa.
 */
export function weightedBlend(
  layers: StrengthLayer[],
  attribute: "attack" | "defense",
): number {
  let sum = 0;
  let wsum = 0;
  for (const l of layers) {
    const v = l[attribute];
    if (v == null) continue;
    sum += v * l.weight;
    wsum += l.weight;
  }
  if (wsum === 0) return 50; // baseline neutro si no hay ninguna capa con datos
  return sum / wsum;
}
