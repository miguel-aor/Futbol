// =====================================================================
// benchPlus.ts — soporte para props "Banca+".
//
// Banca+: si el jugador sale, el suplente que entra por él TAMBIÉN suma a la
// cuenta. Por eso se modela como prop de ROL (volumen del puesto completo), no
// de un jugador individual → menor riesgo por sustitución/alineación.
// =====================================================================

export interface PlayerPropContext {
  playerName: string;
  teamId: string;
  propType: string;
  line: number;
  hasBenchPlus: boolean;
  roleKey?: string;
  likelySubstitutionRole?: string;
  expectedRoleMinutes?: number;
}

/** Roles conocidos para props Banca+ (se amplía conforme lleguen alineaciones). */
export const BANCA_PLUS_ROLES: Record<string, { teamId: string; roleKey: string; role: string }> = {
  yamal: { teamId: "esp", roleKey: "esp-rw", role: "Extremo derecho de España" },
  oyarzabal: { teamId: "esp", roleKey: "esp-st", role: "Delantero centro de España" },
  "ferran torres": { teamId: "esp", roleKey: "esp-fw", role: "Ofensivo/extremo de España" },
  ferran: { teamId: "esp", roleKey: "esp-fw", role: "Ofensivo/extremo de España" },
};

function normalize(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Contexto de una prop, marcando si es de rol (Banca+). */
export function getPlayerPropContext(
  playerName: string,
  teamId: string,
  propType: string,
  line: number,
  hasBenchPlus: boolean,
): PlayerPropContext {
  const role = hasBenchPlus ? BANCA_PLUS_ROLES[normalize(playerName)] : undefined;
  return {
    playerName,
    teamId,
    propType,
    line,
    hasBenchPlus,
    roleKey: role?.roleKey,
    likelySubstitutionRole: role?.role,
  };
}
