// =====================================================================
// Motor de scoring de "World Cup Intelligence Mapping".
//
// Construye perfiles de seleccion y reportes de partido DERIVADOS a
// partir de los datos base del bundle (equipos, jugadores, entrenadores,
// arbitros, partidos historicos). Todo es PURO y DETERMINISTA: mismas
// entradas -> misma salida. No depende de server-only ni de fetch.
//
// La data-access layer arma un IntelligenceContext desde el bundle y
// llama a estas funciones; la UI consume el resultado serializable.
// =====================================================================

import type {
  Coach,
  CoachImpact,
  ContextualSplit,
  DataQualityScore,
  HeadToHeadRecord,
  HistoricalMatch,
  HistoricalMatchQuery,
  IntelligenceFactor,
  Match,
  MatchIntelligenceReport,
  MatchPick,
  PerformanceWindow,
  Player,
  PlayerIntelligenceProfile,
  QualityLevel,
  Referee,
  RefereeImpact,
  Team,
  TeamContextualPerformance,
  TeamIntelligenceProfile,
  TeamScoreBreakdown,
} from "@/lib/data-providers/types";
import { clamp, round } from "./math";
import { getConfidenceLabel } from "./index";

/** Mercados que aceptan ajuste por arbitro/entrenador/forma. */
export type IntelMarket = "goles" | "corners" | "tarjetas" | "tiros" | "penal";

/** Contexto necesario para computar inteligencia (derivado del bundle). */
export interface IntelligenceContext {
  teams: Team[];
  players: Player[];
  coaches: Coach[];
  referees: Referee[];
  historicalMatches: HistoricalMatch[];
  matches: Match[];
}

// ---------------------------------------------------------------------
// Capitanes de referencia (conocimiento publico; fallback = figura).
// ---------------------------------------------------------------------
const CAPTAINS: Record<string, string> = {
  arg: "Lionel Messi", por: "Cristiano Ronaldo", bra: "Marquinhos", fra: "Kylian Mbappé",
  eng: "Harry Kane", esp: "Rodri", ger: "Joshua Kimmich", ned: "Virgil van Dijk",
  bel: "Youri Tielemans", cro: "Luka Modrić", uru: "José María Giménez", col: "James Rodríguez",
  mex: "Edson Álvarez", usa: "Christian Pulisic", kor: "Son Heung-min", egy: "Mohamed Salah",
  nor: "Martin Ødegaard", sen: "Kalidou Koulibaly", irq: "Jalal Hassan", aut: "David Alaba",
  alg: "Riyad Mahrez", jor: "Ehsan Haddad", tur: "Hakan Çalhanoğlu", par: "Gustavo Gómez",
  sco: "Andy Robertson", aus: "Mat Ryan", gha: "Jordan Ayew", pan: "Aníbal Godoy",
  ksa: "Salem Al-Dawsari", cpv: "Ryan Mendes", uzb: "Eldor Shomurodov", cod: "Chancel Mbemba",
  jpn: "Ko Itakura", swe: "Victor Lindelöf", irn: "Alireza Jahanbakhsh", nzl: "Chris Wood",
  mar: "Achraf Hakimi", qat: "Hassan Al-Haydos", bih: "Edin Džeko", cze: "Ladislav Krejčí",
  rsa: "Ronwen Williams", civ: "Franck Kessié", ecu: "Enner Valencia", cuw: "Leandro Bacuna",
  hai: "Johny Placide",
};

function qualityFromRanking(ranking: number): number {
  return clamp(1 - (ranking - 1) / 85, 0, 1);
}

// =====================================================================
// Perspectiva de un equipo dentro de un partido historico
// =====================================================================

interface TeamPerspective {
  isHome: boolean;
  goalsFor: number;
  goalsAgainst: number;
  cornersFor: number;
  cornersAgainst: number;
  cardsFor: number;
  cardsAgainst: number;
  shots: number;
  shotsOnTarget: number;
  foulsCommitted: number;
  foulsDrawn: number;
  possession: number;
  xg: number | null;
  xga: number | null;
  result: "W" | "D" | "L";
  opponentId: string;
}

function perspective(hm: HistoricalMatch, teamId: string): TeamPerspective {
  const isHome = hm.homeTeam === teamId;
  const s = hm.stats;
  const gf = isHome ? hm.homeScore : hm.awayScore;
  const ga = isHome ? hm.awayScore : hm.homeScore;
  return {
    isHome,
    goalsFor: gf,
    goalsAgainst: ga,
    cornersFor: isHome ? s.homeCorners : s.awayCorners,
    cornersAgainst: isHome ? s.awayCorners : s.homeCorners,
    cardsFor: isHome ? s.homeCards : s.awayCards,
    cardsAgainst: isHome ? s.awayCards : s.homeCards,
    shots: isHome ? s.homeShots : s.awayShots,
    shotsOnTarget: isHome ? s.homeShotsOnTarget : s.awayShotsOnTarget,
    foulsCommitted: isHome ? s.homeFouls : s.awayFouls,
    foulsDrawn: isHome ? s.awayFouls : s.homeFouls,
    possession: isHome ? s.homePossession : 100 - s.homePossession,
    xg: isHome ? s.homeXg : s.awayXg,
    xga: isHome ? s.awayXg : s.homeXg,
    result: gf > ga ? "W" : gf < ga ? "L" : "D",
    opponentId: isHome ? hm.awayTeam : hm.homeTeam,
  };
}

// =====================================================================
// getRelevantHistoricalMatches
// =====================================================================

/** Devuelve los partidos historicos de un equipo segun filtros. */
export function getRelevantHistoricalMatches(
  teamId: string,
  options: HistoricalMatchQuery,
  ctx: IntelligenceContext,
): HistoricalMatch[] {
  const teamsById = new Map(ctx.teams.map((t) => [t.id, t]));
  const strongIds = new Set(
    [...ctx.teams].sort((a, b) => a.fifaRanking - b.fifaRanking).slice(0, 16).map((t) => t.id),
  );
  const opponentTeam = options.similarToOpponentId
    ? teamsById.get(options.similarToOpponentId) ?? null
    : null;

  let list = ctx.historicalMatches
    .filter((m) => m.homeTeam === teamId || m.awayTeam === teamId)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (options.officialOnly) list = list.filter((m) => m.matchType !== "amistoso");
  if (options.friendliesOnly) list = list.filter((m) => m.matchType === "amistoso");
  if (options.vsStrongOnly) {
    list = list.filter((m) => {
      const opp = m.homeTeam === teamId ? m.awayTeam : m.homeTeam;
      return strongIds.has(opp);
    });
  }
  if (options.confederation) {
    list = list.filter((m) => {
      const oppId = m.homeTeam === teamId ? m.awayTeam : m.homeTeam;
      return teamsById.get(oppId)?.confederation === options.confederation;
    });
  }
  if (opponentTeam) {
    const me = teamsById.get(teamId);
    // Ordena por similitud del rival historico con el proximo rival.
    list = [...list].sort((a, b) => {
      const oppA = teamsById.get(a.homeTeam === teamId ? a.awayTeam : a.homeTeam);
      const oppB = teamsById.get(b.homeTeam === teamId ? b.awayTeam : b.homeTeam);
      const sa = oppA ? calculateOpponentSimilarity(opponentTeam, oppA) : 0;
      const sb = oppB ? calculateOpponentSimilarity(opponentTeam, oppB) : 0;
      return sb - sa;
    });
    void me;
  }

  const limit = options.limit ?? list.length;
  return list.slice(0, limit);
}

// =====================================================================
// Ventanas de rendimiento
// =====================================================================

function emptyWindow(): PerformanceWindow {
  return {
    sampleSize: 0, wins: 0, draws: 0, losses: 0,
    goalsFor: 0, goalsAgainst: 0, cleanSheets: 0, bttsRate: 0,
    over15: 0, over25: 0, over35: 0, cornersFor: 0, cornersAgainst: 0,
    cardsFor: 0, cardsAgainst: 0, shots: 0, shotsOnTarget: 0,
    foulsCommitted: 0, foulsDrawn: 0, possession: 50, xg: null, xga: null,
  };
}

function computeWindow(teamId: string, matches: HistoricalMatch[]): PerformanceWindow {
  const n = matches.length;
  if (n === 0) return emptyWindow();
  const acc = emptyWindow();
  let wins = 0, draws = 0, losses = 0, cs = 0, btts = 0, o15 = 0, o25 = 0, o35 = 0;
  let xgSum = 0, xgaSum = 0, xgCount = 0;
  for (const m of matches) {
    const p = perspective(m, teamId);
    if (p.result === "W") wins++;
    else if (p.result === "D") draws++;
    else losses++;
    if (p.goalsAgainst === 0) cs++;
    if (p.goalsFor > 0 && p.goalsAgainst > 0) btts++;
    const total = p.goalsFor + p.goalsAgainst;
    if (total > 1.5) o15++;
    if (total > 2.5) o25++;
    if (total > 3.5) o35++;
    acc.goalsFor += p.goalsFor;
    acc.goalsAgainst += p.goalsAgainst;
    acc.cornersFor += p.cornersFor;
    acc.cornersAgainst += p.cornersAgainst;
    acc.cardsFor += p.cardsFor;
    acc.cardsAgainst += p.cardsAgainst;
    acc.shots += p.shots;
    acc.shotsOnTarget += p.shotsOnTarget;
    acc.foulsCommitted += p.foulsCommitted;
    acc.foulsDrawn += p.foulsDrawn;
    acc.possession += p.possession;
    if (p.xg != null) { xgSum += p.xg; xgCount++; }
    if (p.xga != null) { xgaSum += p.xga; }
  }
  const avg = (x: number) => round(x / n, 2);
  const rate = (x: number) => round(x / n, 2);
  return {
    sampleSize: n,
    wins, draws, losses,
    goalsFor: avg(acc.goalsFor),
    goalsAgainst: avg(acc.goalsAgainst),
    cleanSheets: rate(cs),
    bttsRate: rate(btts),
    over15: rate(o15),
    over25: rate(o25),
    over35: rate(o35),
    cornersFor: avg(acc.cornersFor),
    cornersAgainst: avg(acc.cornersAgainst),
    cardsFor: avg(acc.cardsFor),
    cardsAgainst: avg(acc.cardsAgainst),
    shots: avg(acc.shots),
    shotsOnTarget: avg(acc.shotsOnTarget),
    foulsCommitted: avg(acc.foulsCommitted),
    foulsDrawn: avg(acc.foulsDrawn),
    possession: round(acc.possession / n, 0),
    xg: xgCount > 0 ? round(xgSum / xgCount, 2) : null,
    xga: xgCount > 0 ? round(xgaSum / xgCount, 2) : null,
  };
}

// =====================================================================
// Rendimiento contextual
// =====================================================================

function splitFrom(label: string, teamId: string, matches: HistoricalMatch[]): ContextualSplit {
  const n = matches.length;
  if (n === 0) return { label, sampleSize: 0, winRate: 0, goalsFor: 0, goalsAgainst: 0 };
  let wins = 0, gf = 0, ga = 0;
  for (const m of matches) {
    const p = perspective(m, teamId);
    if (p.result === "W") wins++;
    gf += p.goalsFor;
    ga += p.goalsAgainst;
  }
  return {
    label,
    sampleSize: n,
    winRate: round(wins / n, 2),
    goalsFor: round(gf / n, 2),
    goalsAgainst: round(ga / n, 2),
  };
}

function computeContextual(
  teamId: string,
  all: HistoricalMatch[],
  ctx: IntelligenceContext,
): TeamContextualPerformance {
  const teamsById = new Map(ctx.teams.map((t) => [t.id, t]));
  const me = teamsById.get(teamId);
  const strongIds = new Set(
    [...ctx.teams].sort((a, b) => a.fifaRanking - b.fifaRanking).slice(0, 16).map((t) => t.id),
  );
  const oppOf = (m: HistoricalMatch) => (m.homeTeam === teamId ? m.awayTeam : m.homeTeam);

  const vsStrong = all.filter((m) => strongIds.has(oppOf(m)));
  const vsWeak = all.filter((m) => !strongIds.has(oppOf(m)));
  const neutral = all.filter((m) => m.venue === "Sede neutral");
  const official = all.filter((m) => m.matchType !== "amistoso");
  const friendlies = all.filter((m) => m.matchType === "amistoso");
  const sameConf = all.filter((m) => teamsById.get(oppOf(m))?.confederation === me?.confederation);
  const otherConf = all.filter((m) => teamsById.get(oppOf(m))?.confederation !== me?.confederation);

  // Tendencias por mitad / goles tempranos / cierre desde eventos.
  let firstHalf = 0, secondHalf = 0, earlyFor = 0, earlyAgainst = 0, lateClean = 0;
  for (const m of all) {
    const isHome = m.homeTeam === teamId;
    for (const ev of m.events) {
      if (ev.type !== "goal") continue;
      const mine = ev.teamId === teamId;
      if (ev.minute <= 45) firstHalf += mine ? 1 : 0;
      else secondHalf += mine ? 1 : 0;
      if (ev.minute <= 20) {
        if (mine) earlyFor++;
        else earlyAgainst++;
      }
    }
    // Cierre: no conceder goles despues del minuto 75.
    const concededLate = m.events.some(
      (ev) => ev.type === "goal" && ev.teamId !== teamId && ev.teamId === (isHome ? m.awayTeam : m.homeTeam) && ev.minute >= 75,
    );
    if (!concededLate) lateClean++;
  }
  const n = Math.max(all.length, 1);
  return {
    vsStrong: splitFrom("vs rivales fuertes", teamId, vsStrong),
    vsWeak: splitFrom("vs rivales accesibles", teamId, vsWeak),
    neutralVenue: splitFrom("campo neutral", teamId, neutral),
    official: splitFrom("partidos oficiales", teamId, official),
    friendlies: splitFrom("amistosos", teamId, friendlies),
    sameConfederation: splitFrom("misma confederacion", teamId, sameConf),
    otherConfederation: splitFrom("otra confederacion", teamId, otherConf),
    firstHalfGoalsFor: round(firstHalf / n, 2),
    secondHalfGoalsFor: round(secondHalf / n, 2),
    earlyGoalsFor: round(earlyFor / n, 2),
    earlyGoalsAgainst: round(earlyAgainst / n, 2),
    closingStrength: round(lateClean / n, 2),
  };
}

// =====================================================================
// Scores 0..100
// =====================================================================

/** Score de forma reciente (resultados ultimos 10). */
export function calculateTeamFormScore(p: TeamIntelligenceProfile): number {
  const w = p.recent.last10.sampleSize > 0 ? p.recent.last10 : p.recent.last5;
  if (w.sampleSize === 0) return 50;
  const pts = w.wins * 3 + w.draws;
  const max = w.sampleSize * 3;
  return round(clamp((pts / max) * 100, 0, 100), 0);
}

export function calculateAttackScore(p: TeamIntelligenceProfile): number {
  const w = p.recent.last10.sampleSize > 0 ? p.recent.last10 : p.recent.last5;
  // 0 goles -> 0; ~2.6 goles/partido -> 100.
  return round(clamp((w.goalsFor / 2.6) * 100, 0, 100), 0);
}

export function calculateDefenseScore(p: TeamIntelligenceProfile): number {
  const w = p.recent.last10.sampleSize > 0 ? p.recent.last10 : p.recent.last5;
  // 0 goles en contra -> 100; ~2.2 -> 0.
  return round(clamp((1 - w.goalsAgainst / 2.2) * 100, 0, 100), 0);
}

export function calculateDisciplineScore(p: TeamIntelligenceProfile): number {
  const w = p.recent.last10.sampleSize > 0 ? p.recent.last10 : p.recent.last5;
  // Pocas tarjetas -> alto. ~1 tarjeta -> 100, ~4.5 -> 0.
  return round(clamp((1 - (w.cardsFor - 1) / 3.5) * 100, 0, 100), 0);
}

export function calculateCornersProfile(p: TeamIntelligenceProfile): number {
  const w = p.recent.last10.sampleSize > 0 ? p.recent.last10 : p.recent.last5;
  return round(clamp((w.cornersFor / 8) * 100, 0, 100), 0);
}

export function calculateShotsProfile(p: TeamIntelligenceProfile): number {
  const w = p.recent.last10.sampleSize > 0 ? p.recent.last10 : p.recent.last5;
  return round(clamp((w.shots / 18) * 100, 0, 100), 0);
}

function buildScores(p: TeamIntelligenceProfile): TeamScoreBreakdown {
  return {
    form: calculateTeamFormScore(p),
    attack: calculateAttackScore(p),
    defense: calculateDefenseScore(p),
    discipline: calculateDisciplineScore(p),
    corners: calculateCornersProfile(p),
    shots: calculateShotsProfile(p),
  };
}

// =====================================================================
// Impacto de entrenador / arbitro
// =====================================================================

/** Factores de ajuste a partir del entrenador. */
export function calculateCoachImpact(coach: Coach): CoachImpact {
  const off = coach.goalsForPerMatch;
  const def = coach.goalsAgainstPerMatch;
  const attackingBias = clamp((off - def) / 2, -1, 1);
  return {
    projectStability: round(clamp(coach.matchesManaged / 60, 0.15, 1), 2),
    attackingBias: round(attackingBias, 2),
    pressIntensity: round(clamp(0.4 + (coach.winRate - 0.4) * 0.6 + attackingBias * 0.2, 0, 1), 2),
    discipline: round(clamp(1 - (coach.cardsPerMatch - 1.6) / 2, 0, 1), 2),
    rotationTendency: round(clamp(0.5 + (0.5 - coach.winRate) * 0.3, 0, 1), 2),
    officialVsFriendly: round(clamp((coach.winRate - 0.45) * 0.8, -1, 1), 2),
  };
}

/** Ajustes de mercado a partir del arbitro. */
export function calculateRefereeImpact(referee: Referee): RefereeImpact {
  // Promedio liga ~3.8 amarillas; multiplicador relativo.
  const cardsMultiplier = round(clamp(referee.yellowCardsPerMatch / 3.8, 0.7, 1.4), 2);
  const foulsMultiplier = round(clamp(referee.foulsPerMatch / 24, 0.75, 1.3), 2);
  const penaltyMultiplier = round(clamp(referee.penaltiesPerMatch / 0.22, 0.6, 1.8), 2);
  let explanation: string;
  if (referee.gameFlowStyle === "estricto") {
    explanation = `${referee.name} es estricto (${referee.yellowCardsPerMatch.toFixed(1)} amarillas/partido): sube el mercado de tarjetas y faltas.`;
  } else if (referee.gameFlowStyle === "permisivo") {
    explanation = `${referee.name} es permisivo (${referee.yellowCardsPerMatch.toFixed(1)} amarillas/partido): baja la presion en el mercado de tarjetas.`;
  } else {
    explanation = `${referee.name} arbitra en linea con el promedio (${referee.yellowCardsPerMatch.toFixed(1)} amarillas/partido).`;
  }
  return { cardsMultiplier, foulsMultiplier, penaltyMultiplier, explanation };
}

// =====================================================================
// Similitud de rivales
// =====================================================================

/** Similitud 0..1 entre dos selecciones (calidad, estilo, confederacion). */
export function calculateOpponentSimilarity(teamA: Team, teamB: Team): number {
  const qa = qualityFromRanking(teamA.fifaRanking);
  const qb = qualityFromRanking(teamB.fifaRanking);
  const qualitySim = 1 - Math.abs(qa - qb);
  const attackSim = 1 - clamp(Math.abs(teamA.attackStrength - teamB.attackStrength) / 2, 0, 1);
  const defenseSim = 1 - clamp(Math.abs(teamA.defenseStrength - teamB.defenseStrength) / 2, 0, 1);
  const confSim = teamA.confederation === teamB.confederation ? 1 : 0;
  return round(clamp(qualitySim * 0.45 + attackSim * 0.2 + defenseSim * 0.2 + confSim * 0.15, 0, 1), 2);
}

// =====================================================================
// Ajustes de mercado
// =====================================================================

/** Ajusta una probabilidad base segun el arbitro. */
export function adjustMarketByReferee(
  baseProbability: number,
  referee: Referee,
  marketType: IntelMarket,
): number {
  const impact = calculateRefereeImpact(referee);
  let mult = 1;
  if (marketType === "tarjetas") mult = impact.cardsMultiplier;
  else if (marketType === "penal") mult = impact.penaltyMultiplier;
  else if (marketType === "corners") mult = 1; // arbitro no incide en corners
  return round(clamp(baseProbability * mult, 0.02, 0.98), 3);
}

/** Ajusta una probabilidad base segun el entrenador. */
export function adjustMarketByCoach(
  baseProbability: number,
  coach: Coach,
  marketType: IntelMarket,
): number {
  const impact = calculateCoachImpact(coach);
  let mult = 1;
  if (marketType === "goles") mult = 1 + impact.attackingBias * 0.08;
  else if (marketType === "tiros") mult = 1 + impact.attackingBias * 0.1;
  else if (marketType === "corners") mult = 1 + impact.attackingBias * 0.06;
  else if (marketType === "tarjetas") mult = 1 + (1 - impact.discipline) * 0.12;
  return round(clamp(baseProbability * mult, 0.02, 0.98), 3);
}

/** Ajusta una probabilidad base segun la forma reciente del equipo. */
export function adjustMarketByRecentForm(
  baseProbability: number,
  p: TeamIntelligenceProfile,
): number {
  const form = calculateTeamFormScore(p); // 0..100
  // Forma > 50 sube ligeramente; < 50 baja. Maximo +-6%.
  const mult = 1 + ((form - 50) / 50) * 0.06;
  return round(clamp(baseProbability * mult, 0.02, 0.98), 3);
}

// =====================================================================
// Calidad de datos
// =====================================================================

function levelFromScore(score: number): QualityLevel {
  if (score >= 0.7) return "alta";
  if (score >= 0.45) return "media";
  return "baja";
}

function computeDataQuality(args: {
  sampleSize: number;
  hasCoach: boolean;
  hasReferee: boolean;
  source: "mock" | "manual" | "365scores";
  volatility: number;
}): DataQualityScore {
  const completeness = round(
    clamp((args.hasCoach ? 0.5 : 0) + (args.hasReferee ? 0.3 : 0) + (args.sampleSize > 0 ? 0.2 : 0), 0, 1),
    2,
  );
  // Snapshot fijo de mediados de torneo: recencia alta pero no "en vivo".
  const recency = 0.8;
  const sourceReliability = args.source === "manual" ? 0.85 : args.source === "365scores" ? 0.6 : 0.5;
  const sampleSize = round(clamp(args.sampleSize / 18, 0, 1), 2);
  const consistency = round(clamp(1 - args.volatility, 0, 1), 2);
  const finalScore = round(
    clamp(
      completeness * 0.25 + recency * 0.2 + sourceReliability * 0.2 + sampleSize * 0.2 + consistency * 0.15,
      0,
      1,
    ),
    2,
  );
  const warnings: string[] = [];
  if (args.sampleSize < 6) warnings.push("Muestra de partidos historicos limitada.");
  if (!args.hasReferee) warnings.push("Sin arbitro designado: ajustes de tarjetas/faltas aproximados.");
  if (args.source === "mock") warnings.push("Stats y probabilidades provienen del modelo (no feed oficial).");
  return {
    completeness,
    recency,
    sourceReliability,
    sampleSize,
    consistency,
    finalScore,
    level: levelFromScore(finalScore),
    warnings,
  };
}

// =====================================================================
// Perfil de jugador (Intelligence)
// =====================================================================

function rotationRiskFrom(p: Player): QualityLevel {
  if (p.likelyStarter && p.stats.avgMinutes >= 75) return "baja";
  if (p.likelyStarter) return "media";
  return "alta";
}

function buildPlayerProfile(player: Player): PlayerIntelligenceProfile {
  const s = player.stats;
  const isStarter = player.likelyStarter;
  const minutes = round(clamp(s.avgMinutes, 0, 90), 0);
  const window = (scale: number, sample: number): PlayerIntelligenceProfile["last5"] => ({
    sampleSize: sample,
    goals: round(s.avgGoals * scale, 2),
    assists: round(s.avgAssists * scale, 2),
    shots: round(s.avgShots * scale, 1),
    shotsOnTarget: round(s.avgShotsOnTarget * scale, 1),
    cards: round(s.avgCards * scale, 2),
    minutes,
  });
  const isAttacker = player.position === "DEL" || player.position === "MED";
  return {
    playerId: player.id,
    name: player.name,
    teamId: player.teamId,
    position: player.position,
    likelyStarter: isStarter,
    expectedMinutes: isStarter ? minutes : round(minutes * 0.5, 0),
    last5: window(1, 5),
    last10: window(1, 10),
    goals: round(s.avgGoals, 2),
    assists: round(s.avgAssists, 2),
    shots: round(s.avgShots, 1),
    shotsOnTarget: round(s.avgShotsOnTarget, 1),
    foulsCommitted: round(s.avgFouls, 1),
    foulsDrawn: round(s.avgFouls * 0.9, 1),
    tackles: round(player.position === "DEF" ? 2.2 : player.position === "MED" ? 1.6 : 0.6, 1),
    passes: round(
      player.position === "MED" ? 55 : player.position === "DEF" ? 48 : player.position === "DEL" ? 28 : 22,
      0,
    ),
    cards: round(s.avgCards, 2),
    goalContributions: round(s.avgGoals + s.avgAssists, 2),
    setPieceRole: isAttacker
      ? player.position === "DEL"
        ? "Remate en area / penaltis"
        : "Lanzador de balon parado"
      : "Sin rol destacado en balon parado",
    penaltyTaker: player.position === "DEL" && s.avgGoals > 0.4,
    freeKicks: player.position === "MED" && s.avgShots > 1.6,
    corners: player.position === "MED",
    rotationRisk: rotationRiskFrom(player),
    fitness: "disponible",
    source: player.source,
    lastUpdated: player.updatedAt,
  };
}

// =====================================================================
// buildTeamIntelligenceProfile
// =====================================================================

export function buildTeamIntelligenceProfile(
  teamId: string,
  ctx: IntelligenceContext,
): TeamIntelligenceProfile | null {
  const team = ctx.teams.find((t) => t.id === teamId);
  if (!team) return null;
  const coach = ctx.coaches.find((c) => c.teamId === teamId) ?? null;

  const all = getRelevantHistoricalMatches(teamId, {}, ctx);
  const last5 = computeWindow(teamId, all.slice(0, 5));
  const last10 = computeWindow(teamId, all.slice(0, 10));
  const last20 = computeWindow(teamId, all.slice(0, 20));
  const contextual = computeContextual(teamId, all, ctx);

  const roster = ctx.players.filter((p) => p.teamId === teamId);
  const keyPlayers = roster
    .filter((p) => p.position !== "POR")
    .slice(0, 5)
    .map(buildPlayerProfile);

  const captain = CAPTAINS[teamId] ?? roster[0]?.name ?? "Por confirmar";
  const identity = {
    teamId: team.id,
    teamName: team.name,
    groupId: team.groupId,
    confederation: team.confederation,
    fifaRanking: team.fifaRanking,
    coachName: coach?.name ?? "Por confirmar",
    captain,
    playStyle: coach?.tacticalStyle ?? "Estilo equilibrado",
    commonFormation: coach?.preferredFormation ?? "4-3-3",
    source: "mock" as const,
    lastUpdated: team.updatedAt,
  };

  const draft = {
    recent: { last5, last10, last20 },
    contextual,
  } as TeamIntelligenceProfile;
  const scores = buildScores(draft);

  const dataQuality = computeDataQuality({
    sampleSize: all.length,
    hasCoach: Boolean(coach),
    hasReferee: false,
    source: team.source,
    volatility: team.recentForm.volatility,
  });

  return {
    identity,
    coach,
    coachImpact: coach ? calculateCoachImpact(coach) : null,
    recent: { last5, last10, last20 },
    contextual,
    scores,
    keyPlayers,
    relevantMatches: all.slice(0, 10),
    dataQuality,
    source: team.source,
    lastUpdated: team.updatedAt,
  };
}

// =====================================================================
// buildMatchIntelligenceReport
// =====================================================================

function comparison(label: string, home: number, away: number, higherIsBetter = true): {
  label: string; home: number; away: number; edgeTo: "home" | "away" | "even";
} {
  const diff = home - away;
  const threshold = (Math.abs(home) + Math.abs(away)) * 0.06 + 0.05;
  let edgeTo: "home" | "away" | "even" = "even";
  if (Math.abs(diff) > threshold) {
    const homeBetter = higherIsBetter ? diff > 0 : diff < 0;
    edgeTo = homeBetter ? "home" : "away";
  }
  return { label, home: round(home, 2), away: round(away, 2), edgeTo };
}

function pickFor(
  market: string,
  pick: string,
  probability: number,
  marketOdds: number,
  sampleSize: number,
  volatility: number,
  reasonsFor: string[],
  reasonsAgainst: string[],
  dq: DataQualityScore,
): MatchPick {
  const p = round(clamp(probability, 0.02, 0.98), 3);
  const edge = round(p * marketOdds - 1, 4);
  return {
    market,
    pick,
    modelProbability: p,
    fairOdds: round(1 / p, 2),
    marketOdds: round(marketOdds, 2),
    edge,
    confidence: getConfidenceLabel(edge, sampleSize, volatility),
    reasonsFor,
    reasonsAgainst,
    dataQuality: dq,
  };
}

export function buildMatchIntelligenceReport(
  matchId: string,
  ctx: IntelligenceContext,
): MatchIntelligenceReport | null {
  const match = ctx.matches.find((m) => m.id === matchId);
  if (!match) return null;
  const home = ctx.teams.find((t) => t.id === match.homeTeamId) ?? null;
  const away = ctx.teams.find((t) => t.id === match.awayTeamId) ?? null;
  if (!home || !away) return null;

  const homeProfile = buildTeamIntelligenceProfile(home.id, ctx);
  const awayProfile = buildTeamIntelligenceProfile(away.id, ctx);
  if (!homeProfile || !awayProfile) return null;

  const referee = match.refereeId ? ctx.referees.find((r) => r.id === match.refereeId) ?? null : null;
  const homeCoach = ctx.coaches.find((c) => c.teamId === home.id) ?? null;
  const awayCoach = ctx.coaches.find((c) => c.teamId === away.id) ?? null;

  const hF = homeProfile.recent.last10.sampleSize > 0 ? homeProfile.recent.last10 : homeProfile.recent.last5;
  const aF = awayProfile.recent.last10.sampleSize > 0 ? awayProfile.recent.last10 : awayProfile.recent.last5;

  const comparisons = {
    attack: comparison("Ataque (goles/partido)", hF.goalsFor, aF.goalsFor, true),
    defense: comparison("Defensa (goles recibidos)", hF.goalsAgainst, aF.goalsAgainst, false),
    corners: comparison("Corners a favor", hF.cornersFor, aF.cornersFor, true),
    cards: comparison("Tarjetas a favor", hF.cardsFor, aF.cardsFor, false),
    shots: comparison("Tiros por partido", hF.shots, aF.shots, true),
  };

  // Jugadores clave: top de cada lado.
  const keyPlayers = [...homeProfile.keyPlayers.slice(0, 3), ...awayProfile.keyPlayers.slice(0, 3)];

  // Ausencias mock (placeholder): ninguna confirmada en snapshot.
  const absences: MatchIntelligenceReport["absences"] = [];

  // Factores.
  const factorsResult = buildResultFactors(home, away, homeProfile, awayProfile, match);
  const factorsGoals = buildGoalsFactors(home, away, homeProfile, awayProfile, match);
  const factorsCorners = buildCornersFactors(home, away, hF, aF);
  const factorsCards = buildCardsFactors(home, away, hF, aF, referee);

  // Picks del reporte (resultado, goles, tarjetas) con ajustes.
  const picks: MatchPick[] = [];
  const dqHome = homeProfile.dataQuality;
  const baseDq = computeDataQuality({
    sampleSize: Math.min(homeProfile.relevantMatches.length, awayProfile.relevantMatches.length),
    hasCoach: Boolean(homeCoach && awayCoach),
    hasReferee: Boolean(referee),
    source: match.source,
    volatility: (home.recentForm.volatility + away.recentForm.volatility) / 2,
  });

  // Resultado 1X2.
  {
    const { homeWin, draw, awayWin } = match.prediction;
    const opts: Array<[string, number]> = [
      [`Gana ${home.name}`, homeWin],
      ["Empate", draw],
      [`Gana ${away.name}`, awayWin],
    ];
    opts.sort((a, b) => b[1] - a[1]);
    let [pick, prob] = opts[0];
    if (pick.includes(home.name)) prob = adjustMarketByRecentForm(prob, homeProfile);
    else if (pick.includes(away.name)) prob = adjustMarketByRecentForm(prob, awayProfile);
    const fair = 1 / clamp(prob, 0.02, 0.98);
    picks.push(
      pickFor(
        "Resultado 1X2", pick, prob, round((fair / 1.06) * 1.0, 2), 16,
        (home.recentForm.volatility + away.recentForm.volatility) / 2,
        [`${pick} es el resultado mas probable del modelo (${Math.round(prob * 100)}%).`,
         comparisons.attack.edgeTo === "home" ? `${home.name} pega mas en ataque.` : comparisons.defense.edgeTo === "home" ? `${home.name} mas solido atras.` : "Equilibrio en las comparativas."],
        ["El factor neutral reduce la ventaja del nominal local.",
         "Partido de fase de grupos: muestra internacional con ruido."],
        baseDq,
      ),
    );
  }

  // Goles O/U 2.5 (ajuste por entrenadores).
  {
    let prob = match.prediction.over25;
    if (homeCoach) prob = adjustMarketByCoach(prob, homeCoach, "goles");
    if (awayCoach) prob = adjustMarketByCoach(prob, awayCoach, "goles");
    const pickOver = prob >= 0.5;
    const finalProb = pickOver ? prob : 1 - prob;
    const fair = 1 / clamp(finalProb, 0.02, 0.98);
    picks.push(
      pickFor(
        "Goles O/U 2.5", pickOver ? "Over 2.5 goles" : "Under 2.5 goles", finalProb,
        round((fair / 1.06), 2), 14, 0.5,
        [`Goles esperados ${match.prediction.expectedGoals.toFixed(2)}.`,
         `Promedio combinado de ${(hF.goalsFor + aF.goalsFor).toFixed(2)} goles a favor por partido.`],
        ["Estilos contrapuestos pueden romper la tendencia.",
         "xG historico con incertidumbre de muestra."],
        baseDq,
      ),
    );
  }

  // Tarjetas (ajuste por arbitro).
  {
    let prob = match.prediction.expectedCards >= 4.5 ? 0.55 : 0.45;
    if (referee) prob = adjustMarketByReferee(prob, referee, "tarjetas");
    const pickOver = prob >= 0.5;
    const finalProb = pickOver ? prob : 1 - prob;
    const fair = 1 / clamp(finalProb, 0.02, 0.98);
    const refReason = referee
      ? calculateRefereeImpact(referee).explanation
      : "Sin arbitro designado: estimacion por promedio.";
    picks.push(
      pickFor(
        "Tarjetas O/U 4.5", pickOver ? "Over 4.5 tarjetas" : "Under 4.5 tarjetas", finalProb,
        round((fair / 1.07), 2), 12, 0.55,
        [`Tarjetas esperadas ${match.prediction.expectedCards.toFixed(1)}.`, refReason],
        ["La disciplina de ambos cuerpos tecnicos puede bajar el conteo.",
         "Sede neutral reduce tension respecto a una localia."],
        baseDq,
      ),
    );
  }

  const report: MatchIntelligenceReport = {
    matchId: match.id,
    kickoff: match.kickoff,
    venue: match.venue,
    city: match.city,
    groupId: match.groupId,
    homeTeam: { id: home.id, name: home.name, code: home.code, flag: home.flag },
    awayTeam: { id: away.id, name: away.name, code: away.code, flag: away.flag },
    referee,
    refereeImpact: referee ? calculateRefereeImpact(referee) : null,
    homeCoach,
    awayCoach,
    homeForm: hF,
    awayForm: aF,
    comparisons,
    h2h: match.headToHead,
    homeRelevantMatches: homeProfile.relevantMatches,
    awayRelevantMatches: awayProfile.relevantMatches,
    keyPlayers,
    absences,
    factorsResult,
    factorsGoals,
    factorsCorners,
    factorsCards,
    picks,
    narrative: "",
    dataQuality: baseDq,
    source: match.source,
    lastUpdated: match.updatedAt,
  };
  report.narrative = generateMatchNarrative(report);
  void dqHome;
  return report;
}

// ---------------------------------------------------------------------
// Constructores de factores
// ---------------------------------------------------------------------

function impactLevel(magnitude: number): QualityLevel {
  if (magnitude >= 0.66) return "alta";
  if (magnitude >= 0.33) return "media";
  return "baja";
}

function buildResultFactors(
  home: Team, away: Team,
  hp: TeamIntelligenceProfile, ap: TeamIntelligenceProfile,
  match: Match,
): IntelligenceFactor[] {
  const out: IntelligenceFactor[] = [];
  const formDiff = (calculateTeamFormScore(hp) - calculateTeamFormScore(ap)) / 100;
  out.push({
    label: "Forma reciente",
    impact: impactLevel(Math.abs(formDiff) * 2),
    favors: formDiff > 0 ? home.name : ap ? away.name : "even",
    detail: `Forma: ${home.name} ${calculateTeamFormScore(hp)} vs ${away.name} ${calculateTeamFormScore(ap)} (0-100).`,
  });
  const rankDiff = (away.fifaRanking - home.fifaRanking) / 80;
  out.push({
    label: "Ranking / jerarquia",
    impact: impactLevel(Math.abs(rankDiff)),
    favors: rankDiff > 0 ? home.name : away.name,
    detail: `Ranking FIFA: ${home.name} #${home.fifaRanking} vs ${away.name} #${away.fifaRanking}.`,
  });
  const fav = match.prediction.homeWin > match.prediction.awayWin ? home.name : away.name;
  out.push({
    label: "Modelo Poisson 1X2",
    impact: "alta",
    favors: fav,
    detail: `Prob: ${home.name} ${Math.round(match.prediction.homeWin * 100)}% · Empate ${Math.round(match.prediction.draw * 100)}% · ${away.name} ${Math.round(match.prediction.awayWin * 100)}%.`,
  });
  return out;
}

function buildGoalsFactors(
  home: Team, away: Team,
  hp: TeamIntelligenceProfile, ap: TeamIntelligenceProfile,
  match: Match,
): IntelligenceFactor[] {
  const hF = hp.recent.last10.sampleSize > 0 ? hp.recent.last10 : hp.recent.last5;
  const aF = ap.recent.last10.sampleSize > 0 ? ap.recent.last10 : ap.recent.last5;
  return [
    {
      label: "Goles esperados",
      impact: "alta",
      favors: match.prediction.over25 >= 0.5 ? "Over 2.5" : "Under 2.5",
      detail: `xG del modelo ${match.prediction.expectedGoals.toFixed(2)} (over 2.5: ${Math.round(match.prediction.over25 * 100)}%).`,
    },
    {
      label: "Produccion ofensiva combinada",
      impact: impactLevel(clamp((hF.goalsFor + aF.goalsFor) / 4, 0, 1)),
      favors: hF.goalsFor > aF.goalsFor ? home.name : away.name,
      detail: `${home.name} ${hF.goalsFor} GF · ${away.name} ${aF.goalsFor} GF por partido.`,
    },
    {
      label: "Solidez defensiva",
      impact: impactLevel(clamp((hF.goalsAgainst + aF.goalsAgainst) / 4, 0, 1)),
      favors: hF.goalsAgainst < aF.goalsAgainst ? home.name : away.name,
      detail: `Porterias en cero: ${home.name} ${Math.round(hF.cleanSheets * 100)}% · ${away.name} ${Math.round(aF.cleanSheets * 100)}%.`,
    },
  ];
}

function buildCornersFactors(
  home: Team, away: Team,
  hF: PerformanceWindow, aF: PerformanceWindow,
): IntelligenceFactor[] {
  const total = hF.cornersFor + aF.cornersFor;
  return [
    {
      label: "Corners combinados",
      impact: impactLevel(clamp(total / 12, 0, 1)),
      favors: total >= 9.5 ? "Over corners" : "Under corners",
      detail: `${home.name} ${hF.cornersFor} + ${away.name} ${aF.cornersFor} = ${round(total, 1)} corners/partido estimados.`,
    },
    {
      label: "Dominio territorial",
      impact: impactLevel(Math.abs(hF.cornersFor - aF.cornersFor) / 6),
      favors: hF.cornersFor > aF.cornersFor ? home.name : away.name,
      detail: `Mas corners suele correlacionar con dominio y volumen de ataque.`,
    },
  ];
}

function buildCardsFactors(
  home: Team, away: Team,
  hF: PerformanceWindow, aF: PerformanceWindow,
  referee: Referee | null,
): IntelligenceFactor[] {
  const out: IntelligenceFactor[] = [
    {
      label: "Tarjetas combinadas",
      impact: impactLevel(clamp((hF.cardsFor + aF.cardsFor) / 6, 0, 1)),
      favors: hF.cardsFor + aF.cardsFor >= 4.5 ? "Over tarjetas" : "Under tarjetas",
      detail: `${home.name} ${hF.cardsFor} + ${away.name} ${aF.cardsFor} tarjetas/partido.`,
    },
  ];
  if (referee) {
    out.push({
      label: "Perfil del arbitro",
      impact: referee.gameFlowStyle === "estricto" ? "alta" : referee.gameFlowStyle === "permisivo" ? "media" : "baja",
      favors: referee.gameFlowStyle === "estricto" ? "Over tarjetas" : referee.gameFlowStyle === "permisivo" ? "Under tarjetas" : "even",
      detail: calculateRefereeImpact(referee).explanation,
    });
  }
  return out;
}

// =====================================================================
// Narrativa y explicaciones
// =====================================================================

/** Genera un resumen legible del partido a partir del reporte. */
export function generateMatchNarrative(report: MatchIntelligenceReport): string {
  const { homeTeam, awayTeam, homeForm, awayForm, comparisons, referee } = report;
  const parts: string[] = [];
  parts.push(
    `${homeTeam.name} vs ${awayTeam.name}${report.groupId ? ` (Grupo ${report.groupId})` : ""} en ${report.venue}, ${report.city}.`,
  );
  const attacker = comparisons.attack.edgeTo === "home" ? homeTeam.name : comparisons.attack.edgeTo === "away" ? awayTeam.name : null;
  if (attacker) parts.push(`${attacker} llega con mejor pegada (${Math.max(homeForm.goalsFor, awayForm.goalsFor).toFixed(2)} goles/partido).`);
  else parts.push(`Ataques parejos (${homeForm.goalsFor.toFixed(2)} vs ${awayForm.goalsFor.toFixed(2)} goles/partido).`);

  const def = comparisons.defense.edgeTo === "home" ? homeTeam.name : comparisons.defense.edgeTo === "away" ? awayTeam.name : null;
  if (def) parts.push(`${def} es mas solido atras (${Math.min(homeForm.goalsAgainst, awayForm.goalsAgainst).toFixed(2)} recibidos).`);

  const topPick = [...report.picks].sort((a, b) => b.edge - a.edge)[0];
  if (topPick) {
    parts.push(`Pick destacado: ${topPick.pick} (edge ${(topPick.edge * 100).toFixed(1)}%, confianza ${topPick.confidence}).`);
  }
  if (referee) parts.push(report.refereeImpact?.explanation ?? "");
  parts.push(`Calidad de datos: ${report.dataQuality.level} (${Math.round(report.dataQuality.finalScore * 100)}/100).`);
  return parts.filter(Boolean).join(" ");
}

/** Explica un pick concreto en lenguaje natural. */
export function generatePickExplanation(opportunity: MatchPick, report: MatchIntelligenceReport): string {
  const sign = opportunity.edge >= 0 ? "+" : "";
  const head = `${opportunity.pick}: probabilidad del modelo ${Math.round(opportunity.modelProbability * 100)}%, cuota justa ${opportunity.fairOdds.toFixed(2)}, edge ${sign}${(opportunity.edge * 100).toFixed(1)}% (confianza ${opportunity.confidence}).`;
  const fors = opportunity.reasonsFor.length ? ` A favor: ${opportunity.reasonsFor.join(" ")}` : "";
  const against = opportunity.reasonsAgainst.length ? ` Riesgos: ${opportunity.reasonsAgainst.join(" ")}` : "";
  const dq = report.dataQuality.level === "baja" ? " Atencion: calidad de datos baja." : "";
  return head + fors + against + dq;
}
