// =====================================================================
// teamStrength.ts — capa de FUERZA de selección para el modelo de Value Picks.
//
// Combina el ranking FIFA (prior) con los índices de ataque/defensa ya
// ponderados por la forma del Mundial (computePredictionFeatures). Da una
// medida 0-100 por equipo y la diferencia de nivel entre dos selecciones, que
// el motor usa para sanity checks (evitar unders irreales en mismatches,
// underdogs sin justificación, etc.). Memoizado: los datos son estáticos en
// runtime.
// =====================================================================

import { RANKING_NOTE } from "@/data/fifaRankings";
import { TEAM_SEED_BY_ID } from "@/data/worldcup-teams";
import { computePredictionFeatures } from "@/lib/worldcup-2026/prediction-features";

export interface TeamStrength {
  teamId: string;
  name: string;
  fifaRank: number | null;
  /** 0-100 derivado solo del ranking FIFA (1º ≈ 100). */
  rankingScore: number;
  /** Índices 0-100 (alto = mejor) ponderados con la forma del Mundial. */
  attack: number;
  defense: number;
  /** Fuerza global 0-100. */
  strength: number;
  matchesPlayedWC: number;
  hasForm: boolean;
}

export type MismatchLevel = "even" | "edge" | "clear" | "huge";

export interface StrengthContext {
  home: TeamStrength;
  away: TeamStrength;
  /** Diferencia con signo (positivo = local más fuerte), en puntos 0-100. */
  gap: number;
  /** Magnitud absoluta del desnivel. */
  absGap: number;
  level: MismatchLevel;
  favorite: "home" | "away" | "none";
  note: string;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Normaliza el ranking FIFA (1 = mejor) a un score 0-100. */
export function normalizeFifaRanking(rank: number | null | undefined): number {
  if (rank == null) return 55;
  return clamp(100 - (rank - 1) * 1.0, 8, 100);
}

// --- Memoización del mapa de fuerza ----------------------------------
let cache: Map<string, TeamStrength> | null = null;

function buildStrengthMap(): Map<string, TeamStrength> {
  const feats = computePredictionFeatures();
  const map = new Map<string, TeamStrength>();
  for (const f of feats) {
    const seed = TEAM_SEED_BY_ID[f.teamId];
    const rankingScore = normalizeFifaRanking(seed?.fifaRanking ?? null);
    const attack = clamp(f.blendedAttack, 0, 100);
    const defense = clamp(f.blendedDefense, 0, 100);
    // Fuerza global: mezcla del ranking (prior estable) con ataque/defensa
    // ponderados por la forma del Mundial.
    const strength = Number(clamp(rankingScore * 0.5 + attack * 0.25 + defense * 0.25, 0, 100).toFixed(1));
    map.set(f.teamId, {
      teamId: f.teamId,
      name: f.teamName,
      fifaRank: seed?.fifaRanking ?? null,
      rankingScore: Number(rankingScore.toFixed(1)),
      attack: Number(attack.toFixed(1)),
      defense: Number(defense.toFixed(1)),
      strength,
      matchesPlayedWC: f.matchesPlayedWC,
      hasForm: f.matchesPlayedWC > 0,
    });
  }
  return map;
}

function strengthMap(): Map<string, TeamStrength> {
  if (!cache) cache = buildStrengthMap();
  return cache;
}

/** Permite invalidar el cache (tests). */
export function resetTeamStrengthCache(): void {
  cache = null;
}

/** Fuerza de una selección. Si no se reconoce, devuelve un perfil neutral marcado. */
export function calculateTeamStrength(teamId: string): TeamStrength {
  const found = strengthMap().get(teamId);
  if (found) return found;
  const seed = TEAM_SEED_BY_ID[teamId];
  const rankingScore = normalizeFifaRanking(seed?.fifaRanking ?? null);
  return {
    teamId,
    name: seed?.name ?? teamId,
    fifaRank: seed?.fifaRanking ?? null,
    rankingScore: Number(rankingScore.toFixed(1)),
    attack: rankingScore,
    defense: rankingScore,
    strength: Number(rankingScore.toFixed(1)),
    matchesPlayedWC: 0,
    hasForm: false,
  };
}

function levelOf(absGap: number): MismatchLevel {
  if (absGap < 8) return "even";
  if (absGap < 20) return "edge";
  if (absGap < 35) return "clear";
  return "huge";
}

/** Diferencia de nivel con signo (local − visitante). */
export function calculateStrengthGap(homeId: string, awayId: string): number {
  return Number((calculateTeamStrength(homeId).strength - calculateTeamStrength(awayId).strength).toFixed(1));
}

/** Contexto de fuerza de un enfrentamiento para los sanity checks. */
export function getTeamStrengthContext(homeId: string, awayId: string): StrengthContext {
  const home = calculateTeamStrength(homeId);
  const away = calculateTeamStrength(awayId);
  const gap = Number((home.strength - away.strength).toFixed(1));
  const absGap = Math.abs(gap);
  const level = levelOf(absGap);
  const favorite = absGap < 8 ? "none" : gap > 0 ? "home" : "away";
  const favName = favorite === "home" ? home.name : favorite === "away" ? away.name : "ninguno";
  const note =
    level === "huge"
      ? `Desnivel muy grande a favor de ${favName} (gap ${absGap}).`
      : level === "clear"
        ? `Favorito claro: ${favName} (gap ${absGap}).`
        : level === "edge"
          ? `Ligera ventaja para ${favName} (gap ${absGap}).`
          : `Partido parejo (gap ${absGap}).`;
  return { home, away, gap, absGap, level, favorite, note };
}

export { RANKING_NOTE };
