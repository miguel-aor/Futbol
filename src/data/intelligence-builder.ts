// =====================================================================
// Generador DETERMINISTA de los datos base de Intelligence:
//   - Coach[]            (entrenadores + metricas modeladas)
//   - Referee[]          (arbitros + metricas modeladas)
//   - HistoricalMatch[]  (partidos anteriores relevantes por seleccion)
//
// Sin Math.random / new Date() en runtime: todo deriva de semillas y del
// timestamp fijo MOCK_TIMESTAMP. Identidades (nombres) de conocimiento
// publico; metricas estimadas -> source "mock".
// =====================================================================

import type {
  Coach,
  HistoricalMatch,
  HistoricalMatchEvent,
  Referee,
  Team,
  CompetitionType,
} from "@/lib/data-providers/types";
import { clamp, hashSeed, round, seededRng } from "@/lib/prediction/math";
import { WORLD_CUP_COACHES } from "./worldcup-coaches";
import { CONFIRMED_REFEREE_ASSIGNMENTS, WORLD_CUP_REFEREES } from "./worldcup-referees";
import { DATA_CAPTURED_AT } from "./worldcup-fixtures";

const TS = DATA_CAPTURED_AT;

function qualityFromRanking(ranking: number): number {
  return clamp(1 - (ranking - 1) / 85, 0, 1);
}

function isoMinusDays(baseIso: string, days: number): string {
  const base = new Date(baseIso);
  const d = new Date(base.getTime() - days * 86400000);
  d.setUTCHours(19, 30, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------------
// Entrenadores
// ---------------------------------------------------------------------

export function buildCoaches(teams: Team[]): Coach[] {
  return teams.map((team) => {
    const seed = WORLD_CUP_COACHES[team.id];
    const rng = seededRng(hashSeed("coach-" + team.id));
    const q = qualityFromRanking(team.fifaRanking);
    const style = seed?.style ?? "Bloque equilibrado";
    const bias = seed?.attackingBias ?? 0;

    // winRate correlaciona con calidad del equipo + ligero ruido.
    const winRate = round(clamp(0.32 + q * 0.4 + (rng() - 0.5) * 0.1, 0.1, 0.9), 2);
    const matchesManaged = 12 + (hashSeed("mm-" + team.id) % 60);
    const gfBase = team.attackStrength * (1 + bias * 0.18);
    const gaBase = team.defenseStrength * (1 - bias * 0.12);
    const appointed = seed && seed.name.startsWith("Director")
      ? null
      : isoMinusDays(TS, 120 + (hashSeed("ap-" + team.id) % 1200));

    return {
      id: `coach-${team.id}`,
      name: seed?.name ?? "Director tecnico (por confirmar)",
      nationality: seed?.nationality ?? "—",
      teamId: team.id,
      appointedDate: appointed,
      preferredFormation: seed?.formation ?? "4-3-3",
      tacticalStyle: style,
      matchesManaged,
      winRate,
      goalsForPerMatch: round(clamp(gfBase + rng() * 0.2, 0.4, 3.2), 2),
      goalsAgainstPerMatch: round(clamp(gaBase + rng() * 0.2, 0.4, 2.6), 2),
      cardsPerMatch: round(clamp(1.6 + (1 - (seed?.press ?? 0.5)) * 0.6 + rng() * 0.6, 1, 3.4), 2),
      cornersPerMatch: round(clamp(team.recentForm.avgCorners * (1 + bias * 0.1), 2.5, 8.5), 2),
      notes: seed && !seed.name.startsWith("Director")
        ? `${style}. Identidad de referencia (conocimiento publico); metricas estimadas por el modelo.`
        : "Cuerpo tecnico por confirmar; metricas estimadas por el modelo.",
      source: "mock",
      lastUpdated: TS,
    };
  });
}

// ---------------------------------------------------------------------
// Arbitros
// ---------------------------------------------------------------------

export function buildReferees(): Referee[] {
  return WORLD_CUP_REFEREES.map((seed) => {
    const rng = seededRng(hashSeed("ref-" + seed.id));
    const t = seed.cardTendency;
    const yellow = round(clamp(3.2 * t + (rng() - 0.5) * 0.6, 2, 6.5), 2);
    const red = round(clamp(0.12 * t + rng() * 0.06, 0.04, 0.5), 2);
    const fouls = round(clamp(22 + (t - 1) * 14 + (rng() - 0.5) * 4, 16, 34), 1);
    const pens = round(clamp(0.18 * t + rng() * 0.08, 0.06, 0.45), 2);
    return {
      id: seed.id,
      name: seed.name,
      nationality: seed.nationality,
      matchesCount: 40 + (hashSeed(seed.id) % 90),
      yellowCardsPerMatch: yellow,
      redCardsPerMatch: red,
      foulsPerMatch: fouls,
      penaltiesPerMatch: pens,
      // Sede neutral en el Mundial: sesgo local ~0 (placeholder).
      homeBiasIndex: round((rng() - 0.5) * 0.1, 2),
      gameFlowStyle: seed.style,
      source: "mock",
      lastUpdated: TS,
      // El pool es REFERENCIA demo; sus métricas no son de un árbitro designado.
      isConfirmed: false,
      reliability: "demo",
    };
  });
}

/**
 * Devuelve el árbitro de un partido SOLO si hay designación oficial confirmada.
 * Sin fuente confiable → null (la app muestra "Árbitro no confirmado"). No se
 * inventa ni se asigna por hash/nacionalidad. `_refereeCount` se ignora.
 */
export function assignRefereeId(matchId: string, _refereeCount?: number): string | null {
  return CONFIRMED_REFEREE_ASSIGNMENTS[matchId]?.refereeId ?? null;
}

// ---------------------------------------------------------------------
// Partidos historicos relevantes
// ---------------------------------------------------------------------

const MATCH_TYPE_CYCLE: CompetitionType[] = [
  "eliminatoria",
  "amistoso",
  "eliminatoria",
  "continental",
  "nations_league",
  "amistoso",
  "eliminatoria",
  "continental",
];

const COMPETITION_BY_TYPE: Record<CompetitionType, (conf: Team["confederation"]) => string> = {
  mundial: () => "Mundial",
  eliminatoria: () => "Clasificatorio Mundial",
  amistoso: () => "Amistoso internacional",
  nations_league: () => "Nations League",
  continental: (conf) => {
    switch (conf) {
      case "UEFA": return "Eurocopa / clasif.";
      case "CONMEBOL": return "Copa America";
      case "CONCACAF": return "Copa Oro / Nations";
      case "CAF": return "Copa Africana";
      case "AFC": return "Copa Asiatica";
      default: return "Torneo continental";
    }
  },
};

const HISTORY_PER_TEAM = 18;

function buildEvents(
  seedKey: string,
  homeId: string,
  awayId: string,
  homeScore: number,
  awayScore: number,
  homeCards: number,
  awayCards: number,
): HistoricalMatchEvent[] {
  const rng = seededRng(hashSeed("ev-" + seedKey));
  const events: HistoricalMatchEvent[] = [];
  const pushGoals = (teamId: string, n: number) => {
    for (let i = 0; i < n; i++) {
      events.push({ minute: 1 + Math.floor(rng() * 89), type: "goal", teamId, player: "Anotador" });
    }
  };
  pushGoals(homeId, homeScore);
  pushGoals(awayId, awayScore);
  for (let i = 0; i < Math.round(homeCards); i++) {
    events.push({ minute: 1 + Math.floor(rng() * 89), type: "yellow", teamId: homeId, player: "Jugador" });
  }
  for (let i = 0; i < Math.round(awayCards); i++) {
    events.push({ minute: 1 + Math.floor(rng() * 89), type: "yellow", teamId: awayId, player: "Jugador" });
  }
  return events.sort((a, b) => a.minute - b.minute);
}

export function buildHistoricalMatches(teams: Team[]): HistoricalMatch[] {
  const out: HistoricalMatch[] = [];
  const refCount = WORLD_CUP_REFEREES.length;
  const strongIds = new Set(
    [...teams].sort((a, b) => a.fifaRanking - b.fifaRanking).slice(0, 16).map((t) => t.id),
  );

  for (const team of teams) {
    const q = qualityFromRanking(team.fifaRanking);
    for (let j = 0; j < HISTORY_PER_TEAM; j++) {
      const seedKey = `hist-${team.id}-${j}`;
      const rng = seededRng(hashSeed(seedKey));
      // Rival deterministico (otra seleccion del Mundial).
      let oppIdx = hashSeed(seedKey + "-opp") % teams.length;
      if (teams[oppIdx].id === team.id) oppIdx = (oppIdx + 1) % teams.length;
      const opp = teams[oppIdx];
      const oq = qualityFromRanking(opp.fifaRanking);

      const matchType = MATCH_TYPE_CYCLE[(hashSeed(seedKey + "-mt") + j) % MATCH_TYPE_CYCLE.length];
      const isFriendly = matchType === "amistoso";
      // Local/visitante alterna (en amistosos a veces neutral).
      const teamIsHome = j % 2 === 0;
      const homeTeam = teamIsHome ? team : opp;
      const awayTeam = teamIsHome ? opp : team;
      const homeQ = teamIsHome ? q : oq;
      const awayQ = teamIsHome ? oq : q;

      // Goles: base por calidad + ventaja local leve + ruido.
      const homeLambda = clamp(0.8 + homeQ * 1.8 - awayQ * 0.6 + 0.15, 0.2, 3.6);
      const awayLambda = clamp(0.8 + awayQ * 1.8 - homeQ * 0.6, 0.2, 3.4);
      const homeScore = Math.min(6, Math.round(homeLambda + (rng() - 0.45) * 1.4));
      const awayScore = Math.min(6, Math.round(awayLambda + (rng() - 0.5) * 1.3));

      const homeCorners = round(clamp(3.5 + homeQ * 3 + rng() * 2, 1, 12), 0);
      const awayCorners = round(clamp(3.5 + awayQ * 3 + rng() * 2, 1, 12), 0);
      const baseCards = isFriendly ? 1.4 : 2.4;
      const homeCards = round(clamp(baseCards + rng() * 1.6, 0, 6), 0);
      const awayCards = round(clamp(baseCards + rng() * 1.6, 0, 6), 0);
      const homeShots = round(clamp(8 + homeQ * 8 + rng() * 4, 3, 26), 0);
      const awayShots = round(clamp(8 + awayQ * 8 + rng() * 4, 3, 26), 0);
      const homePoss = round(clamp(50 + (homeQ - awayQ) * 30 + (rng() - 0.5) * 10, 28, 72), 0);

      const refereeId = WORLD_CUP_REFEREES[hashSeed(seedKey + "-ref") % refCount]?.id ?? null;
      const daysAgo = 14 + j * 26 + (hashSeed(seedKey + "-d") % 10);
      const relevant = strongIds.has(opp.id) || !isFriendly;

      out.push({
        id: `h-${team.id}-${j}`,
        date: isoMinusDays(TS, daysAgo),
        homeTeam: homeTeam.id,
        awayTeam: awayTeam.id,
        competition: COMPETITION_BY_TYPE[matchType](team.confederation),
        matchType,
        isRelevantToWorldCupTeam: relevant,
        homeScore,
        awayScore,
        stats: {
          homeCorners,
          awayCorners,
          homeCards,
          awayCards,
          homeShots,
          awayShots,
          homeShotsOnTarget: round(clamp(homeShots * (0.32 + rng() * 0.12), 1, homeShots), 0),
          awayShotsOnTarget: round(clamp(awayShots * (0.32 + rng() * 0.12), 1, awayShots), 0),
          homeFouls: round(clamp(10 + rng() * 8, 6, 22), 0),
          awayFouls: round(clamp(10 + rng() * 8, 6, 22), 0),
          homePossession: homePoss,
          homeXg: round(clamp(homeLambda + (rng() - 0.5) * 0.5, 0.2, 3.8), 2),
          awayXg: round(clamp(awayLambda + (rng() - 0.5) * 0.5, 0.2, 3.6), 2),
        },
        lineups: null,
        events: buildEvents(seedKey, homeTeam.id, awayTeam.id, homeScore, awayScore, homeCards, awayCards),
        odds: {
          home: round(clamp(1 / clamp(0.2 + homeQ * 0.5, 0.05, 0.95), 1.1, 9), 2),
          draw: round(clamp(3 + (rng() - 0.5), 2.6, 4.2), 2),
          away: round(clamp(1 / clamp(0.2 + awayQ * 0.5, 0.05, 0.95), 1.1, 9), 2),
        },
        refereeId,
        venue: isFriendly && rng() > 0.6 ? "Sede neutral" : `Estadio de ${homeTeam.name}`,
        source: "mock",
        sourceUrl: null,
        ingestedAt: TS,
      });
    }
  }
  return out;
}
