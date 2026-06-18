// =====================================================================
// Capa de acceso a datos para API y server components. Construye view
// models serializables a partir del bundle del provider activo.
// Nunca toca mock data directamente: siempre via getActiveBundle().
// =====================================================================
import "server-only";
import { getActiveBundle } from "./data-providers/providerRegistry";
import { rankOpportunities, estimatePlayerProp, ALL_PLAYER_PROP_TYPES } from "./prediction";
import {
  buildMatchIntelligenceReport,
  buildTeamIntelligenceProfile,
  calculateOpponentSimilarity,
  getRelevantHistoricalMatches,
  type IntelligenceContext,
} from "./prediction/intelligence";
import type {
  DataBundle,
  GroupStanding,
  HistoricalMatch,
  HistoricalMatchQuery,
  Match,
  MatchIntelligenceReport,
  Opportunity,
  Player,
  PlayerProp,
  QualityLevel,
  Team,
  TeamIntelligenceProfile,
} from "./data-providers/types";

export interface MatchSummary {
  id: string;
  fixtureType: Match["fixtureType"];
  competition: string;
  groupId: string | null;
  kickoff: string;
  status: Match["status"];
  venue: string;
  city: string;
  homeScore: number | null;
  awayScore: number | null;
  home: TeamMini;
  away: TeamMini;
  source: Match["source"];
  updatedAt: string;
}

export interface TeamMini {
  id: string;
  name: string;
  code: string;
  flag: string;
  groupId: string | null;
  confederation: Team["confederation"];
}

/** Flags de inteligencia para filtros avanzados del dashboard. */
export interface OpportunityIntel {
  refereeKnown: boolean;
  dataQuality: QualityLevel;
  backedByLast10: boolean;
  modelTrendAgree: boolean;
  neutralVenue: boolean;
  official: boolean;
  evenMatchup: boolean;
}

export interface OpportunityView extends Opportunity {
  match: MatchSummary | null;
  player: { id: string; name: string; teamId: string } | null;
  /** Metadatos de inteligencia (presentes en getOpportunityViews). */
  intel?: OpportunityIntel;
}

function opportunityQuality(sampleSize: number, confidence: Opportunity["confidence"]): QualityLevel {
  if (sampleSize >= 12 && confidence === "alta") return "alta";
  if (sampleSize >= 8 && confidence !== "baja") return "media";
  return "baja";
}

function teamMini(t: Team): TeamMini {
  return { id: t.id, name: t.name, code: t.code, flag: t.flag, groupId: t.groupId, confederation: t.confederation };
}

function toMatchSummary(m: Match, byId: Map<string, Team>): MatchSummary {
  const home = byId.get(m.homeTeamId);
  const away = byId.get(m.awayTeamId);
  return {
    id: m.id,
    fixtureType: m.fixtureType,
    competition: m.competition,
    groupId: m.groupId,
    kickoff: m.kickoff,
    status: m.status,
    venue: m.venue,
    city: m.city,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    home: home ? teamMini(home) : fallbackTeam(m.homeTeamId),
    away: away ? teamMini(away) : fallbackTeam(m.awayTeamId),
    source: m.source,
    updatedAt: m.updatedAt,
  };
}

function fallbackTeam(id: string): TeamMini {
  return { id, name: id, code: id.slice(0, 3).toUpperCase(), flag: "🏳️", groupId: null, confederation: "UEFA" };
}

async function ctx(): Promise<{ bundle: DataBundle; teamsById: Map<string, Team>; playersById: Map<string, Player> }> {
  const bundle = await getActiveBundle();
  return {
    bundle,
    teamsById: new Map(bundle.teams.map((t) => [t.id, t])),
    playersById: new Map(bundle.players.map((p) => [p.id, p])),
  };
}

// ---------------------------------------------------------------------
// Partidos
// ---------------------------------------------------------------------

export async function getMatchSummaries(): Promise<MatchSummary[]> {
  const { bundle, teamsById } = await ctx();
  return [...bundle.matches]
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
    .map((m) => toMatchSummary(m, teamsById));
}

export async function getUpcomingMatches(limit?: number): Promise<MatchSummary[]> {
  const all = (await getMatchSummaries()).filter((m) => m.status !== "finished");
  return typeof limit === "number" ? all.slice(0, limit) : all;
}

export interface MatchDetail {
  match: Match;
  home: Team | null;
  away: Team | null;
  opportunities: Opportunity[];
  keyPlayers: Player[];
}

export async function getMatchDetail(id: string): Promise<MatchDetail | null> {
  const { bundle, teamsById } = await ctx();
  const match = bundle.matches.find((m) => m.id === id);
  if (!match) return null;
  const opportunities = rankOpportunities(bundle.opportunities.filter((o) => o.matchId === id));
  const keyPlayers = bundle.players
    .filter((p) => p.teamId === match.homeTeamId || p.teamId === match.awayTeamId)
    .filter((p) => p.position === "DEL" || p.position === "MED")
    .slice(0, 6);
  return {
    match,
    home: teamsById.get(match.homeTeamId) ?? null,
    away: teamsById.get(match.awayTeamId) ?? null,
    opportunities,
    keyPlayers,
  };
}

// ---------------------------------------------------------------------
// Oportunidades
// ---------------------------------------------------------------------

export async function getOpportunityViews(): Promise<OpportunityView[]> {
  const { bundle, teamsById, playersById } = await ctx();
  const matchById = new Map(bundle.matches.map((m) => [m.id, m]));
  const views = bundle.opportunities.map((o) => {
    const m = matchById.get(o.matchId);
    const player = o.playerId ? playersById.get(o.playerId) : null;
    const home = m ? teamsById.get(m.homeTeamId) : null;
    const away = m ? teamsById.get(m.awayTeamId) : null;
    const evenMatchup = home && away ? calculateOpponentSimilarity(home, away) >= 0.6 : false;
    const intel: OpportunityIntel = {
      refereeKnown: Boolean(m?.refereeId),
      dataQuality: opportunityQuality(o.sampleSize, o.confidence),
      backedByLast10: o.sampleSize >= 10,
      modelTrendAgree: o.edge > 0 && o.confidence !== "baja",
      neutralVenue: m?.neutralVenue ?? false,
      official: m ? m.fixtureType !== "amistoso" : false,
      evenMatchup,
    };
    return {
      ...o,
      match: m ? toMatchSummary(m, teamsById) : null,
      player: player ? { id: player.id, name: player.name, teamId: player.teamId } : null,
      intel,
    };
  });
  return rankOpportunities(views);
}

// ---------------------------------------------------------------------
// Selecciones
// ---------------------------------------------------------------------

export interface TeamCardData extends Team {
  nextMatch: MatchSummary | null;
  keyPlayers: Player[];
}

export async function getTeamCards(): Promise<TeamCardData[]> {
  const { bundle, teamsById } = await ctx();
  const summaries = bundle.matches
    .filter((m) => m.status !== "finished")
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  return bundle.teams.map((t) => {
    const next = summaries.find((m) => m.homeTeamId === t.id || m.awayTeamId === t.id);
    return {
      ...t,
      nextMatch: next ? toMatchSummary(next, teamsById) : null,
      keyPlayers: bundle.players.filter((p) => p.teamId === t.id).slice(0, 3),
    };
  });
}

export interface TeamDetailData {
  team: Team;
  upcoming: MatchSummary[];
  recent: MatchSummary[];
  players: Player[];
  opportunities: OpportunityView[];
}

export async function getTeamDetail(id: string): Promise<TeamDetailData | null> {
  const { bundle, teamsById } = await ctx();
  const team = bundle.teams.find((t) => t.id === id);
  if (!team) return null;
  const teamMatches = bundle.matches
    .filter((m) => m.homeTeamId === id || m.awayTeamId === id)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const opportunities = (await getOpportunityViews()).filter(
    (o) => o.match && (o.match.home.id === id || o.match.away.id === id),
  );
  return {
    team,
    upcoming: teamMatches.filter((m) => m.status !== "finished").map((m) => toMatchSummary(m, teamsById)),
    recent: teamMatches.filter((m) => m.status === "finished").map((m) => toMatchSummary(m, teamsById)),
    players: bundle.players.filter((p) => p.teamId === id),
    opportunities,
  };
}

// ---------------------------------------------------------------------
// Jugadores
// ---------------------------------------------------------------------

export interface PlayerCardData extends Player {
  team: TeamMini | null;
}

export async function getPlayerCards(): Promise<PlayerCardData[]> {
  const { bundle, teamsById } = await ctx();
  return bundle.players.map((p) => {
    const t = teamsById.get(p.teamId);
    return { ...p, team: t ? teamMini(t) : null };
  });
}

export interface PlayerDetailData {
  player: Player;
  team: Team | null;
  props: PlayerProp[];
  nextMatch: MatchSummary | null;
}

export async function getPlayerDetail(id: string): Promise<PlayerDetailData | null> {
  const { bundle, teamsById } = await ctx();
  const player = bundle.players.find((p) => p.id === id);
  if (!player) return null;
  // Props: usar las del bundle si existen; si no, calcularlas al vuelo.
  let props = bundle.playerProps.filter((pp) => pp.playerId === id);
  if (props.length === 0 && player.position !== "POR") {
    props = ALL_PLAYER_PROP_TYPES.map((type) => {
      const e = estimatePlayerProp(player, type);
      return {
        playerId: id,
        type,
        label: e.pick,
        hitRateLast5: e.hitRateLast5,
        hitRateLast10: e.hitRateLast10,
        hitRateSeason: e.hitRateSeason,
        modelProbability: e.modelProbability,
        fairOdds: e.fairOdds,
        marketOdds: e.marketOdds,
        edge: e.edge,
        recommendation: e.recommendation,
        source: player.source,
        updatedAt: player.updatedAt,
      };
    });
  }
  const next = bundle.matches
    .filter((m) => (m.homeTeamId === player.teamId || m.awayTeamId === player.teamId) && m.status !== "finished")
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))[0];
  return {
    player,
    team: teamsById.get(player.teamId) ?? null,
    props,
    nextMatch: next ? toMatchSummary(next, teamsById) : null,
  };
}

export async function getPlayerProps(playerId: string): Promise<PlayerProp[]> {
  const detail = await getPlayerDetail(playerId);
  return detail?.props ?? [];
}

// ---------------------------------------------------------------------
// Mundial
// ---------------------------------------------------------------------

export interface WorldCupData {
  groups: Array<{
    id: string;
    name: string;
    teams: Team[];
    standings: GroupStanding[];
  }>;
  upcoming: MatchSummary[];
  finished: MatchSummary[];
  topOpportunities: OpportunityView[];
}

export async function getWorldCupData(): Promise<WorldCupData> {
  const { bundle, teamsById } = await ctx();
  const groups = bundle.groups.map((g) => ({
    id: g.id,
    name: g.name,
    teams: g.teamIds.map((id) => teamsById.get(id)).filter((t): t is Team => Boolean(t)),
    standings: bundle.standings[g.id] ?? [],
  }));
  const wcMatches = bundle.matches.filter((m) => m.fixtureType === "mundial");
  const ops = (await getOpportunityViews()).filter((o) => o.match?.fixtureType === "mundial");
  return {
    groups,
    upcoming: wcMatches.filter((m) => m.status !== "finished").map((m) => toMatchSummary(m, teamsById)),
    finished: wcMatches.filter((m) => m.status === "finished").map((m) => toMatchSummary(m, teamsById)),
    topOpportunities: ops.slice(0, 8),
  };
}

// ---------------------------------------------------------------------
// Resumen para landing / dashboard
// ---------------------------------------------------------------------

export interface BestPicks {
  goals: OpportunityView | null;
  corners: OpportunityView | null;
  cards: OpportunityView | null;
  player: OpportunityView | null;
}

export async function getBestPicksByCategory(): Promise<BestPicks> {
  const ops = await getOpportunityViews();
  const firstOf = (keys: string[]) => ops.find((o) => keys.includes(o.marketKey)) ?? null;
  return {
    goals: firstOf(["over_under_goals", "btts"]),
    corners: firstOf(["total_corners"]),
    cards: firstOf(["total_cards"]),
    player: ops.find((o) => o.playerId != null) ?? null,
  };
}

// ---------------------------------------------------------------------
// World Cup Intelligence Mapping
// ---------------------------------------------------------------------

/** Arma el contexto de inteligencia desde el bundle activo. */
function intelCtx(bundle: DataBundle): IntelligenceContext {
  return {
    teams: bundle.teams,
    players: bundle.players,
    coaches: bundle.coaches,
    referees: bundle.referees,
    historicalMatches: bundle.historicalMatches,
    matches: bundle.matches,
  };
}

/** Perfil de inteligencia de una seleccion. */
export async function getTeamIntelligence(teamId: string): Promise<TeamIntelligenceProfile | null> {
  const { bundle } = await ctx();
  return buildTeamIntelligenceProfile(teamId, intelCtx(bundle));
}

/** Reporte de inteligencia de un partido. */
export async function getMatchIntelligence(matchId: string): Promise<MatchIntelligenceReport | null> {
  const { bundle } = await ctx();
  return buildMatchIntelligenceReport(matchId, intelCtx(bundle));
}

/** Partidos historicos relevantes de una seleccion (con filtros). */
export async function getTeamHistory(
  teamId: string,
  options: HistoricalMatchQuery = {},
): Promise<HistoricalMatch[]> {
  const { bundle } = await ctx();
  return getRelevantHistoricalMatches(teamId, options, intelCtx(bundle));
}

/** Mapa id -> etiqueta ligera de seleccion (para listas historicas). */
export async function getTeamLabels(): Promise<Record<string, { name: string; flag: string; code: string }>> {
  const { bundle } = await ctx();
  return Object.fromEntries(bundle.teams.map((t) => [t.id, { name: t.name, flag: t.flag, code: t.code }]));
}
