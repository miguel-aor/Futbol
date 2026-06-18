// =====================================================================
// Generador DETERMINISTA de todo el dataset mock (sin Math.random ni
// new Date() en runtime de UI: todo se deriva de semillas y de un
// timestamp fijo de build) para evitar mismatches de hidratacion.
//
// Produce un DataBundle completo a partir de WORLD_CUP_TEAMS.
// =====================================================================

import type {
  DataBundle,
  Group,
  GroupStanding,
  Match,
  Opportunity,
  Player,
  PlayerPosition,
  PlayerProp,
  Team,
  TeamRecentForm,
} from "@/lib/data-providers/types";
import { GROUP_IDS, WORLD_CUP_TEAMS, type TeamSeed } from "./worldcup-teams";
import { DATA_CAPTURED_AT, VENUES, WORLD_CUP_FIXTURES } from "./worldcup-fixtures";
import { WORLD_CUP_PLAYERS } from "./worldcup-players";
import { MARKETS } from "./markets";
import { FIRST_NAMES, LAST_NAMES } from "./names";
import { WORLD_CUP_REFEREES } from "./worldcup-referees";
import { assignRefereeId, buildCoaches, buildHistoricalMatches, buildReferees } from "./intelligence-builder";
import { clamp, hashSeed, round, seededRng } from "@/lib/prediction/math";
import {
  ALL_PLAYER_PROP_TYPES,
  computeMatchPrediction,
  estimateCardsMarket,
  estimateCornersMarket,
  estimateGoalMarket,
  estimateMatchOutcome,
  estimatePlayerProp,
  estimateTeamShotsMarket,
  getConfidenceLabel,
} from "@/lib/prediction";

/** Timestamp de captura de los datos reales (mantiene SSR determinista). */
export const MOCK_TIMESTAMP = DATA_CAPTURED_AT;

function qualityFromRanking(ranking: number): number {
  return clamp(1 - (ranking - 1) / 85, 0, 1);
}

function buildRecentForm(seed: number, quality: number): TeamRecentForm {
  const rng = seededRng(seed);
  const last5: Array<"W" | "D" | "L"> = [];
  for (let i = 0; i < 5; i++) {
    const r = rng();
    const winThreshold = 0.3 + quality * 0.45;
    const drawThreshold = winThreshold + 0.25;
    last5.push(r < winThreshold ? "W" : r < drawThreshold ? "D" : "L");
  }
  return {
    last5,
    goalsFor: round(0.7 + quality * 1.8 + rng() * 0.3, 1),
    goalsAgainst: round(1.6 - quality * 1.0 + rng() * 0.3, 1),
    avgCorners: round(3.5 + quality * 3 + rng() * 1.2, 1),
    avgCards: round(1.4 + rng() * 1.4, 1),
    avgShots: round(8 + quality * 7 + rng() * 2, 1),
    avgShotsOnTarget: round(2.8 + quality * 3 + rng() * 0.8, 1),
    volatility: round(0.25 + (1 - quality) * 0.4 + rng() * 0.2, 2),
  };
}

function buildTeam(seed: TeamSeed): Team {
  const q = qualityFromRanking(seed.fifaRanking);
  const rng = seededRng(hashSeed("team-" + seed.id));
  const recentForm = buildRecentForm(hashSeed("form-" + seed.id), q);
  return {
    id: seed.id,
    name: seed.name,
    code: seed.code,
    flag: seed.flag,
    confederation: seed.confederation,
    groupId: seed.groupId,
    fifaRanking: seed.fifaRanking,
    recentForm,
    attackStrength: round(0.9 + q * 1.3 + (rng() - 0.5) * 0.2, 2),
    defenseStrength: round(1.7 - q * 1.0 + (rng() - 0.5) * 0.2, 2),
    // Identidad/grupo/ranking reales (publicos); las fuerzas son del modelo.
    source: "manual",
    updatedAt: MOCK_TIMESTAMP,
  };
}

const POSITION_PLAN: PlayerPosition[][] = [
  ["POR", "DEF", "MED", "DEL"],
  ["DEF", "MED", "DEL"],
  ["MED", "DEL", "DEF"],
];

function statsForPosition(pos: PlayerPosition, quality: number, rng: () => number): Player["stats"] {
  const q = quality;
  switch (pos) {
    case "DEL":
      return {
        avgGoals: round(0.28 + q * 0.45 + rng() * 0.15, 2),
        avgAssists: round(0.1 + q * 0.2 + rng() * 0.1, 2),
        avgShots: round(2.4 + q * 2.2 + rng() * 0.8, 1),
        avgShotsOnTarget: round(1 + q * 1.3 + rng() * 0.4, 1),
        avgCards: round(0.1 + rng() * 0.15, 2),
        avgFouls: round(0.8 + rng() * 0.8, 1),
        avgMinutes: round(70 + rng() * 20, 0),
      };
    case "MED":
      return {
        avgGoals: round(0.1 + q * 0.2 + rng() * 0.1, 2),
        avgAssists: round(0.18 + q * 0.3 + rng() * 0.12, 2),
        avgShots: round(1.4 + q * 1.4 + rng() * 0.6, 1),
        avgShotsOnTarget: round(0.5 + q * 0.8 + rng() * 0.3, 1),
        avgCards: round(0.18 + rng() * 0.2, 2),
        avgFouls: round(1.2 + rng() * 1.0, 1),
        avgMinutes: round(68 + rng() * 22, 0),
      };
    case "DEF":
      return {
        avgGoals: round(0.04 + q * 0.08 + rng() * 0.05, 2),
        avgAssists: round(0.05 + q * 0.12 + rng() * 0.06, 2),
        avgShots: round(0.5 + rng() * 0.9, 1),
        avgShotsOnTarget: round(0.2 + rng() * 0.4, 1),
        avgCards: round(0.25 + rng() * 0.3, 2),
        avgFouls: round(1.4 + rng() * 1.2, 1),
        avgMinutes: round(75 + rng() * 15, 0),
      };
    case "POR":
    default:
      return {
        avgGoals: 0,
        avgAssists: round(rng() * 0.04, 2),
        avgShots: 0,
        avgShotsOnTarget: 0,
        avgCards: round(0.05 + rng() * 0.1, 2),
        avgFouls: round(0.1 + rng() * 0.2, 1),
        avgMinutes: round(85 + rng() * 5, 0),
      };
  }
}

function buildPlayers(teams: Team[]): Player[] {
  const players: Player[] = [];
  teams.forEach((team, tIdx) => {
    const q = qualityFromRanking(team.fifaRanking);
    // Plantilla real destacada si existe; si no, se generan nombres mock.
    const roster = WORLD_CUP_PLAYERS[team.id];
    if (roster && roster.length > 0) {
      roster.forEach((seed, i) => {
        const seedKey = `player-${team.id}-${i}`;
        const rng = seededRng(hashSeed(seedKey));
        players.push({
          id: `${team.id}-p${i + 1}`,
          name: seed.name, // nombre REAL
          teamId: team.id,
          position: seed.position, // posicion REAL
          shirtNumber: seed.number ?? (hashSeed(seedKey) % 23) + 1, // dorsal REAL si existe
          club: seed.club ?? "", // club REAL
          likelyStarter: i < 11, // heuristica: los primeros ~XI
          stats: statsForPosition(seed.position, q, rng), // stats del modelo
          imageUrl: null, // avatar de iniciales por defecto
          imageSource: "",
          imageUpdatedAt: null,
          source: "manual", // identidad real; stats estimadas
          updatedAt: MOCK_TIMESTAMP,
        });
      });
      return;
    }

    // Fallback: jugadores generados (no deberia ocurrir con el dataset actual).
    const plan = POSITION_PLAN[tIdx % POSITION_PLAN.length];
    plan.forEach((pos, i) => {
      const seedKey = `player-${team.id}-${i}`;
      const rng = seededRng(hashSeed(seedKey));
      const fn = FIRST_NAMES[hashSeed(seedKey + "f") % FIRST_NAMES.length];
      const ln = LAST_NAMES[hashSeed(seedKey + "l") % LAST_NAMES.length];
      players.push({
        id: `${team.id}-p${i + 1}`,
        name: `${fn} ${ln}`,
        teamId: team.id,
        position: pos,
        shirtNumber: (hashSeed(seedKey) % 23) + 1,
        club: "",
        likelyStarter: i < 2 || rng() > 0.4,
        stats: statsForPosition(pos, q, rng),
        imageUrl: null,
        imageSource: "",
        imageUpdatedAt: null,
        source: "mock",
        updatedAt: MOCK_TIMESTAMP,
      });
    });
  });
  return players;
}

function isoPlusDays(baseIso: string, days: number, hour: number): string {
  const base = new Date(baseIso);
  const d = new Date(base.getTime() + days * 86400000);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

function buildMatches(teamsById: Record<string, Team>): Match[] {
  // Construye los partidos desde el CALENDARIO REAL del Mundial 2026.
  return WORLD_CUP_FIXTURES.map((fx) => {
    const home = teamsById[fx.homeId];
    const away = teamsById[fx.awayId];
    const venue = VENUES[fx.venueId];
    return buildMatch({
      id: fx.id,
      groupId: fx.groupId,
      home,
      away,
      kickoff: fx.kickoff,
      venue,
      homeScore: fx.homeScore,
      awayScore: fx.awayScore,
    });
  });
}

function buildMatch(args: {
  id: string;
  groupId: string;
  home: Team;
  away: Team;
  kickoff: string;
  venue: { venue: string; city: string };
  homeScore: number | null;
  awayScore: number | null;
}): Match {
  const { id, home, away, kickoff } = args;
  // En el Mundial todos los partidos son en sede neutral.
  const prediction = computeMatchPrediction(home, away, true);

  // El resultado proviene del calendario real (null si no se ha jugado).
  const hasResult = args.homeScore != null && args.awayScore != null;
  const isPast = new Date(kickoff).getTime() < new Date(MOCK_TIMESTAMP).getTime();
  const homeScore = args.homeScore;
  const awayScore = args.awayScore;
  const status: Match["status"] = hasResult ? "finished" : isPast ? "live" : "scheduled";

  const mkTrend = (t: Team) => ({
    teamId: t.id,
    formGoals: Array.from({ length: 5 }, (_, i) =>
      round(t.recentForm.goalsFor + (seededRng(hashSeed(id + t.id + "g" + i))() - 0.5), 1),
    ),
    formCorners: Array.from({ length: 5 }, (_, i) =>
      round(t.recentForm.avgCorners + (seededRng(hashSeed(id + t.id + "c" + i))() - 0.5) * 2, 1),
    ),
    formCards: Array.from({ length: 5 }, (_, i) =>
      round(t.recentForm.avgCards + (seededRng(hashSeed(id + t.id + "k" + i))() - 0.5), 1),
    ),
  });

  // Head-to-head mock (3 enfrentamientos previos).
  const headToHead = Array.from({ length: 3 }, (_, i) => {
    const r = seededRng(hashSeed(id + "h2h" + i));
    return {
      date: isoPlusDays("2024-01-01T00:00:00.000Z", i * 130, 20),
      homeTeamId: home.id,
      awayTeamId: away.id,
      homeScore: Math.floor(r() * 4),
      awayScore: Math.floor(r() * 3),
      competition: i % 2 === 0 ? "Amistoso" : "Clasificatorio",
    };
  });

  return {
    id,
    fixtureType: "mundial",
    competition: "Mundial 2026",
    groupId: args.groupId,
    homeTeamId: home.id,
    awayTeamId: away.id,
    kickoff,
    venue: args.venue.venue,
    city: args.venue.city,
    neutralVenue: true,
    status,
    homeScore,
    awayScore,
    refereeId: assignRefereeId(id, WORLD_CUP_REFEREES.length),
    prediction,
    trends: [mkTrend(home), mkTrend(away)],
    headToHead,
    // Calendario y resultados reales (fuentes publicas), capturados.
    source: "manual",
    updatedAt: MOCK_TIMESTAMP,
  };
}

function buildOpportunities(matches: Match[], teamsById: Record<string, Team>, players: Player[]): Opportunity[] {
  const opportunities: Opportunity[] = [];
  const playersByTeam: Record<string, Player[]> = {};
  for (const p of players) (playersByTeam[p.teamId] ||= []).push(p);

  for (const match of matches) {
    if (match.status !== "scheduled") continue; // solo proximos generan picks
    const home = teamsById[match.homeTeamId];
    const away = teamsById[match.awayTeamId];

    const teamEstimates = [
      { e: estimateMatchOutcome(match, home, away), key: "match_result" as const, pid: null },
      { e: estimateGoalMarket(match), key: "over_under_goals" as const, pid: null },
      { e: estimateCornersMarket(match), key: "total_corners" as const, pid: null },
      { e: estimateCardsMarket(match), key: "total_cards" as const, pid: null },
      { e: estimateTeamShotsMarket(match, home), key: "team_total_shots" as const, pid: null },
      { e: estimateTeamShotsMarket(match, away), key: "team_total_shots" as const, pid: null },
    ];

    for (const { e, key } of teamEstimates) {
      const confidence = getConfidenceLabel(e.edge, e.sampleSize, e.volatility);
      opportunities.push({
        id: `op-${match.id}-${key}-${opportunities.length}`,
        matchId: match.id,
        marketKey: key,
        playerId: null,
        pick: e.pick,
        modelProbability: e.modelProbability,
        fairOdds: e.fairOdds,
        marketOdds: e.marketOdds,
        edge: e.edge,
        confidence,
        sampleSize: e.sampleSize,
        volatility: e.volatility,
        reason: e.reason,
        source: "mock",
        updatedAt: MOCK_TIMESTAMP,
      });
    }

    // Un par de props destacados de jugadores ofensivos de cada equipo.
    const candidates = [...(playersByTeam[match.homeTeamId] || []), ...(playersByTeam[match.awayTeamId] || [])]
      .filter((p) => p.position === "DEL" || p.position === "MED")
      .slice(0, 4);
    for (const player of candidates) {
      const propType = player.position === "DEL" ? "shots_on_target_1plus" : "shots_1plus";
      const est = estimatePlayerProp(player, propType);
      const confidence = getConfidenceLabel(est.edge, est.sampleSize, est.volatility);
      opportunities.push({
        id: `op-${match.id}-${player.id}-${propType}`,
        matchId: match.id,
        marketKey: propType === "shots_on_target_1plus" ? "player_shots_on_target" : "player_total_shots",
        playerId: player.id,
        pick: `${player.name}: ${est.pick}`,
        modelProbability: est.modelProbability,
        fairOdds: est.fairOdds,
        marketOdds: est.marketOdds,
        edge: est.edge,
        confidence,
        sampleSize: est.sampleSize,
        volatility: est.volatility,
        reason: est.reason,
        source: "mock",
        updatedAt: MOCK_TIMESTAMP,
      });
    }
  }
  return opportunities;
}

function buildPlayerProps(players: Player[]): PlayerProp[] {
  const props: PlayerProp[] = [];
  for (const player of players) {
    if (player.position === "POR") continue;
    for (const type of ALL_PLAYER_PROP_TYPES) {
      const est = estimatePlayerProp(player, type);
      props.push({
        playerId: player.id,
        type,
        label: est.pick,
        hitRateLast5: est.hitRateLast5,
        hitRateLast10: est.hitRateLast10,
        hitRateSeason: est.hitRateSeason,
        modelProbability: est.modelProbability,
        fairOdds: est.fairOdds,
        marketOdds: est.marketOdds,
        edge: est.edge,
        recommendation: est.recommendation,
        source: "mock",
        updatedAt: MOCK_TIMESTAMP,
      });
    }
  }
  return props;
}

function buildStandings(matches: Match[]): Record<string, GroupStanding[]> {
  const standings: Record<string, GroupStanding[]> = {};
  for (const groupId of GROUP_IDS) {
    const teamIds = WORLD_CUP_TEAMS.filter((t) => t.groupId === groupId).map((t) => t.id);
    const rows: Record<string, GroupStanding> = {};
    for (const id of teamIds) {
      rows[id] = {
        teamId: id,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      };
    }
    for (const m of matches) {
      if (m.groupId !== groupId || m.status !== "finished" || m.homeScore == null || m.awayScore == null) continue;
      const h = rows[m.homeTeamId];
      const a = rows[m.awayTeamId];
      if (!h || !a) continue;
      h.played++;
      a.played++;
      h.goalsFor += m.homeScore;
      h.goalsAgainst += m.awayScore;
      a.goalsFor += m.awayScore;
      a.goalsAgainst += m.homeScore;
      if (m.homeScore > m.awayScore) {
        h.won++; h.points += 3; a.lost++;
      } else if (m.homeScore < m.awayScore) {
        a.won++; a.points += 3; h.lost++;
      } else {
        h.drawn++; a.drawn++; h.points++; a.points++;
      }
    }
    standings[groupId] = Object.values(rows)
      .map((r) => ({ ...r, goalDifference: r.goalsFor - r.goalsAgainst }))
      .sort((x, y) => y.points - x.points || y.goalDifference - x.goalDifference);
  }
  return standings;
}

/** Construye el DataBundle completo desde mock. */
export function buildMockBundle(): DataBundle {
  const teams = WORLD_CUP_TEAMS.map(buildTeam);
  const teamsById: Record<string, Team> = Object.fromEntries(teams.map((t) => [t.id, t]));
  const groups: Group[] = GROUP_IDS.map((id) => ({
    id,
    name: `Grupo ${id}`,
    teamIds: WORLD_CUP_TEAMS.filter((t) => t.groupId === id).map((t) => t.id),
  }));
  const players = buildPlayers(teams);
  const matches = buildMatches(teamsById);
  const opportunities = buildOpportunities(matches, teamsById, players);
  const playerProps = buildPlayerProps(players);
  const standings = buildStandings(matches);
  const coaches = buildCoaches(teams);
  const referees = buildReferees();
  const historicalMatches = buildHistoricalMatches(teams);

  return {
    meta: {
      id: "mock",
      label: "Mundial 2026 (real + modelo)",
      description:
        "Grupos, calendario y resultados reales (fuentes publicas, captura 18 jun 2026; jornada 1 completa); jugadores y predicciones generados por el modelo.",
      available: true,
      lastUpdated: MOCK_TIMESTAMP,
    },
    groups,
    teams,
    matches,
    players,
    opportunities,
    playerProps,
    markets: MARKETS,
    standings,
    coaches,
    referees,
    historicalMatches,
  };
}
