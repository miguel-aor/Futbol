// =====================================================================
// playerPropsContext.ts — contexto reciente de JUGADOR para player props.
//
// Capa adicional (no reemplaza el modelo base). Usa los leaderboards 365Scores
// (playerRecentStats). sampleSize bajo → penaliza confianza; no convierte una
// captura en Strong Value por sí sola.
// =====================================================================

import { getGoalkeeperRecent, getPlayerRecentStats, type PlayerRecentStats } from "@/data/playerRecentStats";

export function getRecentStatsForPlayer(playerName: string): PlayerRecentStats | null {
  return getPlayerRecentStats(playerName);
}

export interface PlayerPropContextResult {
  player: PlayerRecentStats | null;
  notes: string[];
  sampleSize: number;
}

export function getPlayerPropContext(playerName: string): PlayerPropContextResult {
  const player = getPlayerRecentStats(playerName);
  const notes: string[] = [];
  if (player) {
    if (player.savesPerMatch != null) notes.push(`${player.playerName}: ${player.saves} atajadas recientes.`);
    if (player.goals != null) notes.push(`${player.playerName}: ${player.goals} gol(es) en el torneo.`);
    if (player.assists != null) notes.push(`${player.playerName}: ${player.assists} asistencia(s).`);
  }
  return { player, notes, sampleSize: player?.sampleSize ?? 0 };
}

/**
 * Lambda de atajadas del portero combinando contexto de equipo (tiros a puerta
 * que enfrentará) con las atajadas recientes del portero específico, si existen.
 */
export function calculateGoalkeeperSavesContext(
  selectionOrName: string,
  teamId: string,
  teamSavesLambda: number,
): { lambda: number; notes: string[] } {
  const gk = getPlayerRecentStats(selectionOrName) ?? getGoalkeeperRecent(teamId);
  if (gk?.savesPerMatch != null) {
    const lambda = teamSavesLambda * 0.5 + gk.savesPerMatch * 0.5;
    return { lambda, notes: [`${gk.playerName} viene de ${gk.saves} atajadas; contexto de tiros a puerta del rival λ≈${teamSavesLambda.toFixed(1)}.`] };
  }
  return { lambda: teamSavesLambda, notes: [`Atajadas esperadas λ≈${teamSavesLambda.toFixed(1)} (contexto de equipo).`] };
}

/** Contexto de goleador reciente (para anytime/first scorer). */
export function calculatePlayerScorerContext(playerName: string): { goals: number; notes: string[] } | null {
  const p = getPlayerRecentStats(playerName);
  if (!p || p.goals == null) return null;
  return { goals: p.goals, notes: [`${p.playerName} lleva ${p.goals} gol(es) en el torneo.`] };
}
