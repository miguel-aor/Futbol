// =====================================================================
// playerRoleModel.ts — modelo de ROL para props Banca+.
//
// Banca+: si el jugador sale, el suplente que entra por su rol también suma. Se
// modela como volumen del ROL (no del individuo) → menor riesgo por sustitución.
// Combina el rol (benchPlus) con el contexto reciente del jugador titular.
// =====================================================================

import { BANCA_PLUS_ROLES, getPlayerPropContext as getBenchPlusContext } from "./benchPlus";
import { getPlayerRecentStats } from "@/data/playerRecentStats";

export interface RoleContext {
  hasBenchPlus: boolean;
  roleKey?: string;
  role?: string;
  /** Reducción de riesgo por sustitución (0-1; mayor = menos riesgo). */
  substitutionCover: number;
  notes: string[];
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Contexto de rol Banca+ para una prop de jugador. */
export function calculateBenchPlusRoleContext(
  playerName: string,
  teamId: string,
  propType: string,
  line: number,
  hasBenchPlus: boolean,
): RoleContext {
  const ctx = getBenchPlusContext(playerName, teamId, propType, line, hasBenchPlus);
  const role = BANCA_PLUS_ROLES[norm(playerName)];
  const player = getPlayerRecentStats(playerName);
  const notes: string[] = [];
  if (hasBenchPlus) {
    notes.push(
      role
        ? `Prop de rol (Banca+): ${role.role}. Si ${playerName} sale, el suplente del rol suma.`
        : `Banca+: si ${playerName} sale, el suplente suma; menor riesgo por sustitución.`,
    );
    if (player) notes.push(`Titular con contexto reciente (${player.sampleSize} partido[s]).`);
  }
  return {
    hasBenchPlus,
    roleKey: ctx.roleKey,
    role: role?.role,
    // Banca+ cubre la sustitución; sin Banca+ no hay cobertura.
    substitutionCover: hasBenchPlus ? 0.7 : 0,
    notes,
  };
}
