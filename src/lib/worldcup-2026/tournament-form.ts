// =====================================================================
// Cálculo de la "Forma en este Mundial" a partir de los partidos YA JUGADOS.
//
// Fuente: snapshot público en src/data/worldcup-fixtures.ts (calendario y
// resultados reales de la jornada 1, captura 18 jun 2026 de ESPN/Wikipedia/
// Milenio). NO se inventan stats: lo que el snapshot no trae por partido
// (xG, tiros, posesión, corners, tarjetas, etc.) queda en `null`.
//
// Funciones PURAS y deterministas → las usan tanto los scripts (para escribir
// JSON) como la API interna (en runtime). Sin fs, sin red.
// =====================================================================

import { DATA_CAPTURED_AT, VENUES, WORLD_CUP_FIXTURES } from "@/data/worldcup-fixtures";
import { WORLD_CUP_TEAMS } from "@/data/worldcup-teams";
import type { TournamentTeamForm, WorldCupMatch } from "./types";

const NAME = new Map(WORLD_CUP_TEAMS.map((t) => [t.id, t.name]));
const GROUP = new Map(WORLD_CUP_TEAMS.map((t) => [t.id, t.groupId]));

/** Procedencia común de estos datos (snapshot público del proyecto). */
export const WC_SNAPSHOT_PROVENANCE = {
  source: "Snapshot",
  sourceUrl:
    "in-repo:src/data/worldcup-fixtures.ts (snapshot público; J1 + J2 grupos A/B reales; Wikipedia/ESPN/World Soccer Talk, captura 2026-06-19)",
  collectedAt: DATA_CAPTURED_AT,
};

/** Jornada (1..3) a partir del sufijo numérico del id (wc-A-1 → 1). */
function roundOf(id: string): number {
  const n = Number(id.split("-").pop());
  return Number.isFinite(n) ? Math.ceil(n / 2) : 0;
}

/** Todos los partidos del Mundial como objetos normalizados. */
export function computeWorldCupMatches(): WorldCupMatch[] {
  return WORLD_CUP_FIXTURES.map((fx) => {
    const played = fx.homeScore != null && fx.awayScore != null;
    return {
      id: fx.id,
      round: roundOf(fx.id),
      group: fx.groupId,
      homeId: fx.homeId,
      awayId: fx.awayId,
      homeName: NAME.get(fx.homeId) ?? fx.homeId,
      awayName: NAME.get(fx.awayId) ?? fx.awayId,
      kickoff: fx.kickoff,
      venue: VENUES[fx.venueId]?.venue ?? "",
      homeScore: fx.homeScore,
      awayScore: fx.awayScore,
      status: played ? "played" : "scheduled",
      ...WC_SNAPSHOT_PROVENANCE,
    };
  });
}

function emptyForm(teamId: string): TournamentTeamForm {
  return {
    teamId,
    teamName: NAME.get(teamId) ?? teamId,
    group: GROUP.get(teamId) ?? "?",
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    xgFor: null,
    xgAgainst: null,
    shotsFor: null,
    shotsAgainst: null,
    shotsOnTargetFor: null,
    shotsOnTargetAgainst: null,
    possessionAvg: null,
    cornersFor: null,
    cornersAgainst: null,
    foulsCommitted: null,
    yellowCards: null,
    redCards: null,
    tacklesWon: null,
    interceptions: null,
    form: [],
    attackPerMatch: null,
    defensePerMatch: null,
    results: [],
    ...WC_SNAPSHOT_PROVENANCE,
  };
}

/**
 * Forma de cada equipo dentro del Mundial actual (solo partidos jugados).
 * Incluye TODOS los equipos del torneo; los que aún no juegan quedan en 0
 * partidos (played=0) y stats derivados null.
 */
export function computeTournamentForm(): TournamentTeamForm[] {
  const byTeam = new Map<string, TournamentTeamForm>();
  for (const t of WORLD_CUP_TEAMS) byTeam.set(t.id, emptyForm(t.id));

  const played = computeWorldCupMatches()
    .filter((m) => m.status === "played")
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));

  const apply = (
    f: TournamentTeamForm,
    matchId: string,
    oppId: string,
    oppName: string,
    gf: number,
    ga: number,
  ) => {
    f.played += 1;
    f.goalsFor += gf;
    f.goalsAgainst += ga;
    const result: "W" | "D" | "L" = gf > ga ? "W" : gf < ga ? "L" : "D";
    if (result === "W") {
      f.wins += 1;
      f.points += 3;
    } else if (result === "D") {
      f.draws += 1;
      f.points += 1;
    } else {
      f.losses += 1;
    }
    f.form.push(result);
    f.results.push({ matchId, opponentId: oppId, opponentName: oppName, gf, ga, result });
  };

  for (const m of played) {
    const hs = m.homeScore as number;
    const as = m.awayScore as number;
    apply(byTeam.get(m.homeId)!, m.id, m.awayId, m.awayName, hs, as);
    apply(byTeam.get(m.awayId)!, m.id, m.homeId, m.homeName, as, hs);
  }

  for (const f of byTeam.values()) {
    f.goalDifference = f.goalsFor - f.goalsAgainst;
    f.attackPerMatch = f.played ? Number((f.goalsFor / f.played).toFixed(2)) : null;
    f.defensePerMatch = f.played ? Number((f.goalsAgainst / f.played).toFixed(2)) : null;
  }

  return [...byTeam.values()].sort(
    (a, b) =>
      b.played - a.played ||
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      a.teamName.localeCompare(b.teamName),
  );
}

/** Texto corto de tendencia (defensa fuerte, ataque potente, etc.). */
export function tournamentTrend(f: TournamentTeamForm): string {
  if (f.played === 0) return "Aún no debuta en el Mundial.";
  const trends: string[] = [];
  if (f.defensePerMatch != null && f.defensePerMatch <= 0.5)
    trends.push("defensa fuerte, pocos goles concedidos");
  if (f.attackPerMatch != null && f.attackPerMatch >= 2)
    trends.push("ataque potente");
  if (f.goalsAgainst === 0 && f.played >= 1) trends.push("portería en cero");
  if (f.wins === f.played && f.played >= 1) trends.push("puntaje perfecto");
  if (f.losses === f.played && f.played >= 1) trends.push("aún sin sumar");
  return trends.length ? trends.join(" · ") : "rendimiento equilibrado";
}
