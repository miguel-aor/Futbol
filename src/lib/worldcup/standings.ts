// =====================================================================
// standings.ts — motor de posiciones de grupo.
//
// Lee el snapshot manual (WORLD_CUP_STANDINGS) y/o calcula la tabla a partir de
// resultados confirmados. Reglas: V=3, E=1, D=0; orden por puntos → diferencia
// de goles → goles a favor → nombre (desempates avanzados FIFA pendientes).
// =====================================================================

import {
  STANDINGS_WARNINGS,
  WORLD_CUP_STANDINGS,
  type GroupId,
  type GroupStanding,
  type GroupTeamStatus,
} from "@/data/worldcup2026Standings";
import { computeWorldCupMatches } from "@/lib/worldcup-2026/tournament-form";

export interface WorldCupMatchResult {
  matchId: string;
  externalMatchId?: string;
  group: GroupId;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  status: "finished";
  kickoffTime: string;
  timezone: "America/Mexico_City";
  source: string;
  reliability: "confirmed" | "reported" | "manual" | "demo";
  lastUpdated: string;
}

const GROUP_IDS: GroupId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

/** Ordena equipos de un grupo por los criterios base. */
function sortGroup(rows: GroupStanding[]): GroupStanding[] {
  return [...rows]
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        // Último criterio: posición original del snapshot (respeta el desempate
        // oficial de la captura cuando todo lo demás empata).
        a.position - b.position ||
        a.teamName.localeCompare(b.teamName),
    )
    .map((r, i) => ({ ...r, position: i + 1 }));
}

/**
 * Calcula las posiciones de todos los grupos a partir de resultados confirmados.
 * `status` (clasificado/eliminado) se deja "active" salvo que se pase
 * `decided` (los cálculos de escenario lo refinan).
 */
export function calculateGroupStandings(results: WorldCupMatchResult[]): GroupStanding[] {
  const acc = new Map<string, GroupStanding>();
  const key = (g: GroupId, id: string) => `${g}:${id}`;
  const ensure = (g: GroupId, id: string, name: string): GroupStanding => {
    const k = key(g, id);
    let row = acc.get(k);
    if (!row) {
      row = {
        group: g, teamId: id, teamName: name, played: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, position: 0,
        status: "active", source: "Computed from confirmed results", reliability: "computed",
        lastUpdated: new Date().toISOString(),
      };
      acc.set(k, row);
    }
    return row;
  };

  for (const r of results) {
    if (r.status !== "finished") continue;
    const h = ensure(r.group, r.homeTeamId, r.homeTeamName);
    const a = ensure(r.group, r.awayTeamId, r.awayTeamName);
    h.played++; a.played++;
    h.goalsFor += r.homeScore; h.goalsAgainst += r.awayScore;
    a.goalsFor += r.awayScore; a.goalsAgainst += r.homeScore;
    if (r.homeScore > r.awayScore) { h.wins++; h.points += 3; a.losses++; }
    else if (r.homeScore < r.awayScore) { a.wins++; a.points += 3; h.losses++; }
    else { h.draws++; a.draws++; h.points++; a.points++; }
  }
  for (const row of acc.values()) row.goalDifference = row.goalsFor - row.goalsAgainst;

  const out: GroupStanding[] = [];
  for (const g of GROUP_IDS) {
    const rows = [...acc.values()].filter((r) => r.group === g);
    out.push(...sortGroup(rows));
  }
  return out;
}

const GROUP_GAMES = 3;

/** Deriva clasificado/eliminado de una tabla de grupo ya ordenada. */
function deriveStatus(team: GroupStanding, sorted: GroupStanding[]): GroupTeamStatus {
  const remaining = Math.max(0, GROUP_GAMES - team.played);
  const maxPts = team.points + remaining * 3;
  // Eliminado: ≥2 equipos ya superan el máximo alcanzable por este equipo.
  const better = sorted.filter((t) => t.teamId !== team.teamId && t.points > maxPts).length;
  if (better >= 2) return "eliminated";
  if (remaining === 0 && team.position >= 4) return "eliminated";
  const third = sorted[2];
  const thirdMax = third ? third.points + Math.max(0, GROUP_GAMES - third.played) * 3 : 0;
  if (team.position <= 2 && (team.points >= thirdMax || remaining === 0)) return "qualified";
  return "active";
}

// Standings COMPUTADOS desde los resultados confirmados (fixtures). Sustituyen al
// snapshot manual de screenshots para mantener coherencia con el calendario.
let computedCache: GroupStanding[] | null = null;
function buildStandingsFromResults(): GroupStanding[] {
  const wc = computeWorldCupMatches();
  const results: WorldCupMatchResult[] = wc
    .filter((m) => m.homeScore != null && m.awayScore != null)
    .map((m) => ({
      matchId: m.id,
      group: m.group as GroupId,
      homeTeamId: m.homeId,
      homeTeamName: m.homeName,
      awayTeamId: m.awayId,
      awayTeamName: m.awayName,
      homeScore: m.homeScore as number,
      awayScore: m.awayScore as number,
      status: "finished",
      kickoffTime: m.kickoff,
      timezone: "America/Mexico_City",
      source: "Computed from confirmed results (fixtures)",
      reliability: "confirmed",
      lastUpdated: m.kickoff,
    }));
  const table = calculateGroupStandings(results);
  // Deriva estado por grupo.
  const out: GroupStanding[] = [];
  for (const g of GROUP_IDS) {
    const rows = table.filter((r) => r.group === g);
    out.push(...rows.map((r) => ({ ...r, status: deriveStatus(r, rows) })));
  }
  return out;
}

/** Todas las posiciones, COMPUTADAS desde resultados confirmados (memoizado). */
export function getAllStandings(): GroupStanding[] {
  if (!computedCache) computedCache = buildStandingsFromResults();
  return computedCache;
}

/** Snapshot manual de screenshots (referencia; ya no es la fuente principal). */
export function getSnapshotStandings(): GroupStanding[] {
  return WORLD_CUP_STANDINGS;
}

export function getStandingsByGroup(group: GroupId): GroupStanding[] {
  return sortGroup(getAllStandings().filter((r) => r.group === group));
}

export function getTeamStanding(teamId: string): GroupStanding | null {
  return getAllStandings().find((r) => r.teamId === teamId) ?? null;
}

export function getQualifiedTeams(): GroupStanding[] {
  return getAllStandings().filter((r) => r.status === "qualified");
}

export function getEliminatedTeams(): GroupStanding[] {
  return getAllStandings().filter((r) => r.status === "eliminated");
}

export interface GroupScenarioContext {
  group: GroupId;
  table: GroupStanding[];
  matchesPlayedMax: number;
  leader: GroupStanding | null;
  warnings: string[];
}

/** Contexto de un grupo (tabla ordenada + metadatos para escenarios/UI). */
export function getGroupScenarioContext(group: GroupId): GroupScenarioContext {
  const table = getStandingsByGroup(group);
  return {
    group,
    table,
    matchesPlayedMax: table.reduce((m, r) => Math.max(m, r.played), 0),
    leader: table[0] ?? null,
    warnings: STANDINGS_WARNINGS,
  };
}
