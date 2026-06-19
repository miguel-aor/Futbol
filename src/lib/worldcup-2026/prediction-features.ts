// =====================================================================
// Features de predicción del Mundial 2026, combinando CAPAS con pesos.
//
// Capas (de mayor a menor peso, ver worldcup-weights.ts):
//   1) Forma en este Mundial (partidos ya jugados) — DATO REAL, peso alto.
//   2) Forma reciente de la selección (pre-Mundial) — no disponible como dato
//      real para las 48 → se usa baseline de ranking (marcado hasReal=false).
//   3) Elo / ranking FIFA — baseline.
//   4) Forma de club de los jugadores — no disponible a nivel equipo → null.
//
// Nunca se inventa: las capas sin datos quedan con valor null y la mezcla
// renormaliza sobre las que sí tienen datos.
// =====================================================================

import { WORLD_CUP_TEAMS } from "@/data/worldcup-teams";
import {
  calculateMatchOutcomeProbabilities,
  generateScoreMatrix,
} from "@/lib/footballModels";
import { chooseWeights, weightedBlend } from "@/lib/prediction/worldcup-weights";
import {
  WC_SNAPSHOT_PROVENANCE,
  computeTournamentForm,
} from "./tournament-form";
import type {
  MatchupPrediction,
  StrengthLayer,
  TeamPredictionFeatures,
  TournamentTeamForm,
} from "./types";

const RANKING = new Map(WORLD_CUP_TEAMS.map((t) => [t.id, t.fifaRanking]));

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, v));
}

/** Fuerza baseline 0-100 a partir del ranking FIFA (1º ≈ 100). */
function rankingStrength(teamId: string): number {
  const r = RANKING.get(teamId) ?? 60;
  return clamp(100 - (r - 1) * 1.0, 25, 100);
}

/** Promedio de goles por partido del torneo (para normalizar índices WC). */
function leagueGoalsPerMatch(forms: TournamentTeamForm[]): number {
  let goals = 0;
  let matches = 0;
  for (const f of forms) {
    goals += f.goalsFor;
    matches += f.played;
  }
  return matches > 0 ? goals / matches : 1.35;
}

/** Construye las capas de fuerza de un equipo (ataque/defensa 0-100). */
function buildLayers(
  f: TournamentTeamForm,
  leagueGpm: number,
): StrengthLayer[] {
  const baseline = rankingStrength(f.teamId);

  // Capa 1: Mundial actual (real si jugó ≥1).
  const wcAttack =
    f.attackPerMatch != null ? clamp(50 * (f.attackPerMatch / leagueGpm)) : null;
  const wcDefense =
    f.defensePerMatch != null
      ? clamp(50 * (leagueGpm / Math.max(f.defensePerMatch, 0.2)))
      : null;

  const w = chooseWeights(f.played);

  return [
    {
      label: "Forma en este Mundial",
      attack: wcAttack,
      defense: wcDefense,
      weight: w.currentWorldCup,
      hasRealData: f.played > 0,
      note:
        f.played > 0
          ? `${f.played} partido(s) jugado(s): ${f.goalsFor} GF / ${f.goalsAgainst} GC`
          : "Aún no debuta — sin datos del Mundial",
    },
    {
      label: "Forma reciente (pre-Mundial)",
      // No hay resultados reales pre-Mundial para las 48 → baseline de ranking.
      attack: baseline,
      defense: baseline,
      weight: w.recentNationalTeam,
      hasRealData: false,
      note: "Sin feed real de amistosos/eliminatorias; se usa baseline de ranking",
    },
    {
      label: "Elo / ranking FIFA",
      attack: baseline,
      defense: baseline,
      weight: w.eloRanking,
      hasRealData: true,
      note: `Ranking FIFA aprox. #${RANKING.get(f.teamId) ?? "?"}`,
    },
    {
      label: "Forma de club (jugadores)",
      attack: null,
      defense: null,
      weight: w.clubPlayerForm,
      hasRealData: false,
      note: "Aplica a props individuales; a nivel equipo no se usa (null)",
    },
  ];
}

/** Features de predicción para todos los equipos del torneo. */
export function computePredictionFeatures(): TeamPredictionFeatures[] {
  const forms = computeTournamentForm();
  const leagueGpm = leagueGoalsPerMatch(forms);

  return forms.map((f) => {
    const layers = buildLayers(f, leagueGpm);
    const blendedAttack = weightedBlend(layers, "attack");
    const blendedDefense = weightedBlend(layers, "defense");
    // λ esperado por partido a partir del índice de ataque (50 ≈ media liga).
    const expectedGoalsFor = Number(
      Math.max(0.2, leagueGpm * (blendedAttack / 50)).toFixed(2),
    );
    return {
      teamId: f.teamId,
      teamName: f.teamName,
      group: f.group,
      matchesPlayedWC: f.played,
      weights: chooseWeights(f.played),
      layers,
      blendedAttack: Number(blendedAttack.toFixed(1)),
      blendedDefense: Number(blendedDefense.toFixed(1)),
      expectedGoalsFor,
      ...WC_SNAPSHOT_PROVENANCE,
    };
  });
}

/** Mapa teamId → features (para lookups rápidos). */
export function predictionFeaturesById(): Map<string, TeamPredictionFeatures> {
  return new Map(computePredictionFeatures().map((f) => [f.teamId, f]));
}

/**
 * Predicción de un enfrentamiento usando las features ponderadas. La forma en
 * el Mundial actual entra con peso alto (más aún si el equipo lleva 2+).
 */
export function predictMatchup(
  homeId: string,
  awayId: string,
  homeAdvantage = 1.1,
): MatchupPrediction | null {
  const feats = predictionFeaturesById();
  const home = feats.get(homeId);
  const away = feats.get(awayId);
  if (!home || !away) return null;

  const leagueGpm = leagueGoalsPerMatch(computeTournamentForm());
  // λ = ataque propio ajustado por la defensa rival (índice alto = mejor defensa).
  const homeXG = Number(
    Math.max(
      0.2,
      leagueGpm * (home.blendedAttack / 50) * ((100 - away.blendedDefense) / 50) * homeAdvantage,
    ).toFixed(2),
  );
  const awayXG = Number(
    Math.max(
      0.2,
      leagueGpm * (away.blendedAttack / 50) * ((100 - home.blendedDefense) / 50),
    ).toFixed(2),
  );
  const matrix = generateScoreMatrix(homeXG, awayXG, 6, -0.05);
  const out = calculateMatchOutcomeProbabilities(matrix);

  return {
    homeId,
    awayId,
    homeName: home.teamName,
    awayName: away.teamName,
    homeWin: out.homeWin,
    draw: out.draw,
    awayWin: out.awayWin,
    homeXG,
    awayXG,
    weightsHome: home.weights,
    weightsAway: away.weights,
  };
}
