// =====================================================================
// bracketProjection.ts — proyección de llaves (Ronda de 32 → Final).
//
// Con 48 selecciones avanzan: 1º y 2º de cada grupo (24) + los 8 mejores
// terceros = 32. Mientras la fase de grupos no termine, la llave es PROYECTADA
// (provisional): se arma con un sembrado transparente por puntos/diferencia y
// se marca cada cruce como "projected" con su confianza. NO se presenta como
// oficial ni confirmada mientras dependa de resultados.
// =====================================================================

import { getAllStandings } from "./standings";
import type { GroupId, GroupStanding } from "@/data/worldcup2026Standings";

export type BracketStage = "round_of_32" | "round_of_16" | "quarterfinal" | "semifinal" | "final";

export interface BracketSlot {
  slotId: string;
  stage: BracketStage;
  teamA?: string;
  teamB?: string;
  teamAName?: string;
  teamBName?: string;
  source: "confirmed" | "projected";
  confidence: number;
  notes?: string;
}

const GROUP_MATCHES = 3;

function bySportingOrder(a: GroupStanding, b: GroupStanding): number {
  return b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor;
}

/** ¿La fase de grupos de este equipo ya está decidida (3 jugados)? */
function isDecided(row: GroupStanding): boolean {
  return row.played >= GROUP_MATCHES || row.status !== "active";
}

export interface QualifierSet {
  winners: GroupStanding[];
  runnersUp: GroupStanding[];
  bestThirds: GroupStanding[];
  /** 32 clasificados sembrados (winners, runners, mejores terceros). */
  seeded: GroupStanding[];
  groupStageComplete: boolean;
}

/** Determina clasificados proyectados a partir de las posiciones. */
export function assignTeamsToBracketSlots(standings: GroupStanding[] = getAllStandings()): QualifierSet {
  const groups = new Map<GroupId, GroupStanding[]>();
  for (const r of standings) {
    const arr = groups.get(r.group) ?? [];
    arr.push(r);
    groups.set(r.group, arr);
  }
  const winners: GroupStanding[] = [];
  const runnersUp: GroupStanding[] = [];
  const thirds: GroupStanding[] = [];
  for (const arr of groups.values()) {
    const sorted = [...arr].sort(bySportingOrder);
    if (sorted[0]) winners.push(sorted[0]);
    if (sorted[1]) runnersUp.push(sorted[1]);
    if (sorted[2]) thirds.push(sorted[2]);
  }
  const bestThirds = [...thirds].sort(bySportingOrder).slice(0, 8);
  const seeded = [
    ...winners.sort(bySportingOrder),
    ...runnersUp.sort(bySportingOrder),
    ...bestThirds.sort(bySportingOrder),
  ];
  const groupStageComplete = standings.every(isDecided);
  return { winners, runnersUp, bestThirds, seeded, groupStageComplete };
}

/** Cruces proyectados de la Ronda de 32 (sembrado 1v32, 2v31, …). */
export function projectRoundOf32Bracket(standings: GroupStanding[] = getAllStandings()): BracketSlot[] {
  const { seeded, groupStageComplete } = assignTeamsToBracketSlots(standings);
  const slots: BracketSlot[] = [];
  const n = seeded.length; // típicamente 32
  const pairs = Math.floor(n / 2);
  for (let i = 0; i < pairs; i++) {
    const a = seeded[i];
    const b = seeded[n - 1 - i];
    const decided = (a ? isDecided(a) : false) && (b ? isDecided(b) : false);
    const confidence = Number(
      ((a && isDecided(a) ? 0.5 : 0.2) + (b && isDecided(b) ? 0.5 : 0.2)).toFixed(2),
    );
    slots.push({
      slotId: `R32-${i + 1}`,
      stage: "round_of_32",
      teamA: a?.teamId,
      teamB: b?.teamId,
      teamAName: a?.teamName,
      teamBName: b?.teamName,
      source: groupStageComplete && decided ? "confirmed" : "projected",
      confidence,
      notes: groupStageComplete ? undefined : "Provisional: depende de resultados de la fase de grupos.",
    });
  }
  return slots;
}

/** Lista de cruces proyectados (alias legible). */
export function calculateProjectedMatchups(standings: GroupStanding[] = getAllStandings()): BracketSlot[] {
  return projectRoundOf32Bracket(standings);
}

/** Estructura vacía de slots por ronda (para UI). */
export function getBracketSlots(): Record<BracketStage, number> {
  return { round_of_32: 16, round_of_16: 8, quarterfinal: 4, semifinal: 2, final: 1 };
}

/** Camino proyectado de un equipo por la llave (ronda y rival inicial). */
export function calculateBracketPath(
  teamId: string,
  standings: GroupStanding[] = getAllStandings(),
): { stage: BracketStage; slotId: string; opponent?: string; opponentName?: string } | null {
  const r32 = projectRoundOf32Bracket(standings);
  const slot = r32.find((s) => s.teamA === teamId || s.teamB === teamId);
  if (!slot) return null;
  const isA = slot.teamA === teamId;
  return {
    stage: "round_of_32",
    slotId: slot.slotId,
    opponent: isA ? slot.teamB : slot.teamA,
    opponentName: isA ? slot.teamBName : slot.teamAName,
  };
}

/** Posibles rivales de un equipo en su cruce proyectado. */
export function calculateLikelyOpponents(
  teamId: string,
  standings: GroupStanding[] = getAllStandings(),
): { teamId?: string; teamName?: string; confidence: number; source: BracketSlot["source"] } | null {
  const r32 = projectRoundOf32Bracket(standings);
  const slot = r32.find((s) => s.teamA === teamId || s.teamB === teamId);
  if (!slot) return null;
  const isA = slot.teamA === teamId;
  return {
    teamId: isA ? slot.teamB : slot.teamA,
    teamName: isA ? slot.teamBName : slot.teamAName,
    confidence: slot.confidence,
    source: slot.source,
  };
}
