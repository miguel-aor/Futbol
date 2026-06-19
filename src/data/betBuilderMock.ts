// =====================================================================
// betBuilderMock.ts — datos DEMO de mercados/líneas/momios.
//
// Partido demo: Estados Unidos vs Australia. Momios y líneas tomados como
// REFERENCIA FUNCIONAL de capturas (estructura de mercados típica). NO es
// una conexión a ninguna casa de apuestas ni copia su identidad visual.
//
// Todo marcado source:"Demo", reliability:"demo", isDemo:true. Los `modelLambda`
// son expectativas del modelo demo (xG/conteo/props) para calcular probabilidad,
// edge y EV de forma ilustrativa.
// =====================================================================

import type { BetMarket, MarketCategory, MarketType, MatchModelParams } from "@/lib/bet/types";

export const DEMO_LAST_UPDATED = "2026-06-19T18:00:00.000Z";
export const DEMO_MATCH_ID = "demo-usa-aus";

export const DEMO_MATCH: { id: string; name: string; kickoff: string; competition: string; params: MatchModelParams } = {
  id: DEMO_MATCH_ID,
  name: "Estados Unidos vs Australia",
  kickoff: "2026-06-19T22:00:00.000Z",
  competition: "Amistoso (demo)",
  params: {
    homeId: "usa",
    awayId: "aus",
    homeName: "Estados Unidos",
    awayName: "Australia",
    homeXG: 1.75,
    awayXG: 0.8,
    cornersLambda: 9.8,
    cardsLambda: 4.2,
    offsidesLambda: 3.6,
    penaltyProb: 0.22,
  },
};

export const DEMO_PLAYERS: Array<{ id: string; name: string; teamId: string; position: string }> = [
  { id: "pulisic", name: "Christian Pulisic", teamId: "usa", position: "FW" },
  { id: "balogun", name: "Folarin Balogun", teamId: "usa", position: "FW" },
  { id: "hwright", name: "Haji Wright", teamId: "usa", position: "FW" },
  { id: "pepi", name: "Ricardo Pepi", teamId: "usa", position: "FW" },
  { id: "weah", name: "Timothy Weah", teamId: "usa", position: "MF" },
  { id: "mckennie", name: "Weston McKennie", teamId: "usa", position: "MF" },
  { id: "richards", name: "Chris Richards", teamId: "usa", position: "DF" },
  { id: "freese", name: "Matthew Freese", teamId: "usa", position: "GK" },
  { id: "arfsten", name: "Maximilian Arfsten", teamId: "usa", position: "DF" },
];

let seq = 0;
function mkt(
  category: MarketCategory,
  marketType: MarketType,
  label: string,
  selection: string,
  line: number | null,
  americanOdds: number,
  extra: Partial<BetMarket> = {},
): BetMarket {
  seq += 1;
  return {
    id: `dm-${seq}`,
    matchId: DEMO_MATCH_ID,
    category,
    marketType,
    label,
    selection,
    line,
    americanOdds,
    oppositeAmericanOdds: extra.oppositeAmericanOdds ?? null,
    modelLambda: extra.modelLambda ?? null,
    playerId: extra.playerId,
    teamId: extra.teamId,
    source: "Demo",
    reliability: "demo",
    isDemo: true,
    lastUpdated: DEMO_LAST_UPDATED,
  };
}

export const DEMO_MARKETS: BetMarket[] = [
  // ---- 1x2 ----
  mkt("match", "match_result", "1x2", "Estados Unidos", null, -163, { teamId: "usa" }),
  mkt("match", "match_result", "1x2", "Empate", null, 333),
  mkt("match", "match_result", "1x2", "Australia", null, 400, { teamId: "aus" }),
  // ---- Total de goles ----
  mkt("match", "total_goals", "Total de goles", "Más de 2.5", 2.5, 100, { oppositeAmericanOdds: 105 }),
  mkt("match", "total_goals", "Total de goles", "Menos de 2.5", 2.5, 105, { oppositeAmericanOdds: 100 }),
  mkt("match", "total_goals", "Total de goles", "Más de 1.5", 1.5, -210, { oppositeAmericanOdds: 165 }),
  // ---- Doble oportunidad ----
  mkt("match", "double_chance", "Doble oportunidad", "Estados Unidos o empate", null, -567),
  mkt("match", "double_chance", "Doble oportunidad", "Estados Unidos o Australia", null, -450),
  mkt("match", "double_chance", "Doble oportunidad", "Empate o Australia", null, 116),
  // ---- Ambos equipos marcan ----
  mkt("match", "both_teams_score", "Ambos equipos marcan", "Sí", null, -110, { oppositeAmericanOdds: -110 }),
  mkt("match", "both_teams_score", "Ambos equipos marcan", "No", null, -110, { oppositeAmericanOdds: -110 }),
  // ---- Hándicap asiático (subconjunto) ----
  mkt("match", "asian_handicap", "Hándicap asiático", "Estados Unidos -0.5", -0.5, -165, { teamId: "usa", oppositeAmericanOdds: 140 }),
  mkt("match", "asian_handicap", "Hándicap asiático", "Australia +0.5", 0.5, 140, { teamId: "aus", oppositeAmericanOdds: -165 }),
  mkt("match", "asian_handicap", "Hándicap asiático", "Estados Unidos -1", -1, 110, { teamId: "usa", oppositeAmericanOdds: -130 }),
  mkt("match", "asian_handicap", "Hándicap asiático", "Estados Unidos -1.5", -1.5, 180, { teamId: "usa", oppositeAmericanOdds: -220 }),
  // ---- Penalti ----
  mkt("match", "penalty_awarded", "Penalti en el encuentro", "Sí", null, 260, { oppositeAmericanOdds: -360 }),
  mkt("match", "penalty_awarded", "Penalti en el encuentro", "No", null, -360, { oppositeAmericanOdds: 260 }),
  // ---- Corners totales ----
  mkt("match", "corners", "Total tiros de esquina", "Más de 5.5", 5.5, -1000, { oppositeAmericanOdds: 550 }),
  mkt("match", "corners", "Total tiros de esquina", "Menos de 9.5", 9.5, -120, { oppositeAmericanOdds: -110 }),
  mkt("match", "corners", "Total tiros de esquina", "Más de 9.5", 9.5, 100, { oppositeAmericanOdds: -120 }),
  // ---- Tarjetas totales ----
  mkt("match", "cards", "Total de tarjetas", "Más de 2.5", 2.5, -220, { oppositeAmericanOdds: 140 }),
  mkt("match", "cards", "Total de tarjetas", "Menos de 2.5", 2.5, 140, { oppositeAmericanOdds: -220 }),
  mkt("match", "cards", "Total de tarjetas", "Más de 3.5", 3.5, 100, { oppositeAmericanOdds: -150 }),
  mkt("match", "cards", "Total de tarjetas", "Más de 4.5", 4.5, 200, { oppositeAmericanOdds: -334 }),
  // ---- Fueras de juego totales ----
  mkt("match", "offsides", "Total fueras de juego", "Más de 3.5", 3.5, -134, { oppositeAmericanOdds: -108 }),
  mkt("match", "offsides", "Total fueras de juego", "Menos de 3.5", 3.5, -108, { oppositeAmericanOdds: -134 }),
  mkt("match", "offsides", "Total fueras de juego", "Más de 4.5", 4.5, 150, { oppositeAmericanOdds: -225 }),
  // ---- Team totals ----
  mkt("team", "team_total_goals", "Estados Unidos total de goles", "Más de 1.5", 1.5, 105, { teamId: "usa", modelLambda: 1.75, oppositeAmericanOdds: -130 }),
  mkt("team", "team_total_goals", "Estados Unidos total de goles", "Más de 2.5", 2.5, 240, { teamId: "usa", modelLambda: 1.75, oppositeAmericanOdds: -367 }),
  mkt("team", "team_total_goals", "Australia total de goles", "Más de 0.5", 0.5, -110, { teamId: "aus", modelLambda: 0.8, oppositeAmericanOdds: 110 }),
  mkt("team", "team_total_goals", "Australia total de goles", "Más de 1.5", 1.5, 300, { teamId: "aus", modelLambda: 0.8, oppositeAmericanOdds: -500 }),
  // ---- Player props: remates (tiros) ----
  mkt("player", "player_shots", "Remates", "Timothy Weah Más de 0.5", 0.5, -1000, { playerId: "weah", teamId: "usa", modelLambda: 1.6 }),
  mkt("player", "player_shots", "Remates", "Weston McKennie Más de 0.5", 0.5, -700, { playerId: "mckennie", teamId: "usa", modelLambda: 1.3 }),
  mkt("player", "player_shots", "Remates", "Haji Wright Más de 1.5", 1.5, -650, { playerId: "hwright", teamId: "usa", modelLambda: 2.5 }),
  mkt("player", "player_shots", "Remates", "Ricardo Pepi Más de 1.5", 1.5, -650, { playerId: "pepi", teamId: "usa", modelLambda: 2.4 }),
  mkt("player", "player_shots", "Remates", "Maximilian Arfsten Más de 0.5", 0.5, -500, { playerId: "arfsten", teamId: "usa", modelLambda: 1.1 }),
  // ---- Player props: remates a puerta ----
  mkt("player", "player_shots_on_target", "Remates a puerta", "Folarin Balogun Más de 0.5", 0.5, -550, { playerId: "balogun", teamId: "usa", modelLambda: 1.05 }),
  mkt("player", "player_shots_on_target", "Remates a puerta", "Ricardo Pepi Más de 0.5", 0.5, -313, { playerId: "pepi", teamId: "usa", modelLambda: 0.85 }),
  mkt("player", "player_shots_on_target", "Remates a puerta", "Haji Wright Más de 0.5", 0.5, -286, { playerId: "hwright", teamId: "usa", modelLambda: 0.8 }),
  mkt("player", "player_shots_on_target", "Remates a puerta", "Christian Pulisic Más de 0.5", 0.5, -200, { playerId: "pulisic", teamId: "usa", modelLambda: 0.95 }),
  // ---- Player props: goleador / asistencias / saves / tarjetas ----
  mkt("player", "anytime_goalscorer", "Goleador en cualquier momento", "Christian Pulisic", null, 150, { playerId: "pulisic", teamId: "usa", modelLambda: 0.48 }),
  mkt("player", "anytime_goalscorer", "Goleador en cualquier momento", "Folarin Balogun", null, 180, { playerId: "balogun", teamId: "usa", modelLambda: 0.42 }),
  mkt("player", "anytime_goalscorer", "Goleador en cualquier momento", "Ricardo Pepi", null, 220, { playerId: "pepi", teamId: "usa", modelLambda: 0.34 }),
  mkt("player", "player_assists", "Asistencias", "Christian Pulisic Más de 0.5", 0.5, 200, { playerId: "pulisic", teamId: "usa", modelLambda: 0.42 }),
  mkt("player", "goalkeeper_saves", "Paradas del portero", "Matthew Freese Más de 2.5", 2.5, 120, { playerId: "freese", teamId: "usa", modelLambda: 3.1 }),
  mkt("player", "player_cards", "Tarjetas para el jugador", "Weston McKennie Más de 0.5", 0.5, 180, { playerId: "mckennie", teamId: "usa", modelLambda: 0.4 }),
];
