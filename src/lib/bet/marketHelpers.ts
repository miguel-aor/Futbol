// =====================================================================
// marketHelpers.ts — opciones dinámicas del Bet Builder según el mercado.
//
// El formulario es dependiente: categoría → mercado → equipo/jugador →
// selección → línea. Estos helpers devuelven opciones válidas para el partido
// seleccionado (sin nombres de otro partido).
// =====================================================================

import { DEMO_MATCH, DEMO_PLAYERS } from "@/data/betBuilderMock";
import type { MarketCategory, MarketType, MatchModelParams } from "./types";

export interface BuilderMatchLike {
  id: string;
  params: MatchModelParams;
}

export interface TeamOption {
  id: string;
  name: string;
}
export interface PlayerOption {
  id: string;
  name: string;
  position: string;
}

// --------------------------------------------------------------------- //
// Categorías y mercados
// --------------------------------------------------------------------- //
export function getMarketCategoryOptions(): Array<{ value: MarketCategory; label: string }> {
  return [
    { value: "match", label: "Partido" },
    { value: "team", label: "Equipo" },
    { value: "player", label: "Jugador" },
  ];
}

export function getMarketTypeOptions(category: MarketCategory): Array<{ value: MarketType; label: string }> {
  switch (category) {
    case "match":
      return [
        { value: "match_result", label: "1x2 (resultado)" },
        { value: "double_chance", label: "Doble oportunidad" },
        { value: "total_goals", label: "Total de goles" },
        { value: "both_teams_score", label: "Ambos equipos marcan" },
        { value: "asian_handicap", label: "Hándicap asiático" },
        { value: "corners", label: "Tiros de esquina (total)" },
        { value: "cards", label: "Tarjetas (total)" },
        { value: "offsides", label: "Fueras de juego (total)" },
        { value: "penalty_awarded", label: "Penalti en el encuentro" },
      ];
    case "team":
      return [
        { value: "team_total_goals", label: "Equipo: total de goles" },
        { value: "team_shots", label: "Equipo: tiros" },
        { value: "team_shots_on_target", label: "Equipo: tiros a puerta" },
        { value: "team_total_corners", label: "Equipo: tiros de esquina" },
        { value: "team_total_cards", label: "Equipo: tarjetas" },
        { value: "team_total_fouls", label: "Equipo: faltas" },
        { value: "team_win_either_half", label: "Equipo: gana alguna mitad" },
      ];
    case "player":
      return [
        { value: "anytime_goalscorer", label: "Goleador en cualquier momento" },
        { value: "player_shots", label: "Remates" },
        { value: "player_shots_on_target", label: "Remates a puerta" },
        { value: "player_assists", label: "Asistencias" },
        { value: "player_passes", label: "Pases" },
        { value: "player_fouls", label: "Faltas cometidas" },
        { value: "player_fouls_drawn", label: "Faltas recibidas" },
        { value: "player_cards", label: "Tarjetas" },
        { value: "goalkeeper_saves", label: "Paradas del portero" },
      ];
  }
}

// --------------------------------------------------------------------- //
// Requisitos por mercado
// --------------------------------------------------------------------- //
const NO_LINE = new Set<MarketType>([
  "match_result",
  "double_chance",
  "both_teams_score",
  "penalty_awarded",
  "anytime_goalscorer",
  "first_goalscorer",
  "team_win_either_half",
]);

const NEEDS_TEAM = new Set<MarketType>([
  "team_total_goals",
  "team_shots",
  "team_shots_on_target",
  "team_total_corners",
  "team_total_cards",
  "team_total_fouls",
  "team_win_either_half",
]);

const NEEDS_PLAYER = new Set<MarketType>([
  "anytime_goalscorer",
  "first_goalscorer",
  "player_shots",
  "player_shots_on_target",
  "player_assists",
  "player_passes",
  "player_fouls",
  "player_fouls_drawn",
  "player_cards",
  "goalkeeper_saves",
]);

// Mercados de conteo de equipo/jugador que requieren capturar la λ del modelo.
const NEEDS_LAMBDA = new Set<MarketType>([
  "team_shots",
  "team_shots_on_target",
  "team_total_corners",
  "team_total_cards",
  "team_total_fouls",
  "anytime_goalscorer",
  "player_shots",
  "player_shots_on_target",
  "player_assists",
  "player_passes",
  "player_fouls",
  "player_fouls_drawn",
  "player_cards",
  "goalkeeper_saves",
]);

export function marketRequiresLine(mt: MarketType): boolean {
  return !NO_LINE.has(mt);
}
export function marketRequiresTeam(mt: MarketType): boolean {
  return NEEDS_TEAM.has(mt);
}
export function marketRequiresPlayer(mt: MarketType): boolean {
  return NEEDS_PLAYER.has(mt);
}
export function marketRequiresLambda(mt: MarketType): boolean {
  return NEEDS_LAMBDA.has(mt);
}

// --------------------------------------------------------------------- //
// Equipos / jugadores del partido
// --------------------------------------------------------------------- //
export function getTeamsForMatch(match: BuilderMatchLike): TeamOption[] {
  return [
    { id: match.params.homeId, name: match.params.homeName },
    { id: match.params.awayId, name: match.params.awayName },
  ];
}

/** Jugadores del partido. Solo el demo trae plantilla; reales → vacío. */
export function getPlayersForMatch(matchId: string): PlayerOption[] {
  if (matchId === DEMO_MATCH.id) return DEMO_PLAYERS.map((p) => ({ id: p.id, name: p.name, position: p.position }));
  return [];
}

// --------------------------------------------------------------------- //
// Opciones de selección por mercado
// --------------------------------------------------------------------- //
export function getMarketSelectionOptions(
  mt: MarketType,
  match: BuilderMatchLike,
  selectedTeamName?: string,
): string[] {
  const home = match.params.homeName;
  const away = match.params.awayName;
  switch (mt) {
    case "match_result":
      return [home, "Empate", away];
    case "double_chance":
      return [`${home} o Empate`, `${home} o ${away}`, `Empate o ${away}`];
    case "asian_handicap":
      return [home, away];
    case "both_teams_score":
    case "penalty_awarded":
      return ["Sí", "No"];
    case "team_win_either_half":
      return [selectedTeamName ?? home];
    case "anytime_goalscorer":
    case "first_goalscorer":
      return []; // la "selección" es el jugador
    default:
      return ["Más de", "Menos de"]; // totales y props con línea
  }
}

export function getDefaultLineForMarket(mt: MarketType): number {
  const map: Partial<Record<MarketType, number>> = {
    total_goals: 2.5,
    team_total_goals: 1.5,
    corners: 9.5,
    team_total_corners: 4.5,
    cards: 3.5,
    team_total_cards: 1.5,
    offsides: 3.5,
    team_total_fouls: 10.5,
    asian_handicap: -0.5,
    team_shots: 11.5,
    team_shots_on_target: 4.5,
    player_shots: 1.5,
    player_shots_on_target: 0.5,
    player_assists: 0.5,
    player_passes: 24.5,
    player_fouls: 0.5,
    player_fouls_drawn: 0.5,
    player_cards: 0.5,
    goalkeeper_saves: 2.5,
  };
  return map[mt] ?? 0.5;
}

export function getMarketLineOptions(mt: MarketType): number[] {
  if (mt === "asian_handicap") return [-2, -1.5, -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1, 1.5, 2];
  if (mt === "total_goals") return [0.5, 1.5, 2.5, 3.5, 4.5, 5.5];
  if (mt === "team_total_goals") return [0.5, 1.5, 2.5, 3.5, 4.5];
  if (mt === "team_total_corners") return [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5];
  if (mt === "corners") return [5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5];
  if (mt === "cards" || mt === "team_total_cards") return [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5];
  if (mt === "offsides") return [1.5, 2.5, 3.5, 4.5, 5.5];
  if (mt === "team_shots") return [4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17.5, 18.5, 19.5, 20.5];
  if (mt === "team_shots_on_target") return [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5];
  if (mt === "player_passes") return [14.5, 19.5, 24.5, 29.5, 34.5];
  if (mt === "goalkeeper_saves") return [1.5, 2.5, 3.5, 4.5, 5.5, 6.5];
  if (mt === "player_shots") return [0.5, 1.5, 2.5, 3.5, 4.5, 5.5];
  if (mt === "player_shots_on_target") return [0.5, 1.5, 2.5, 3.5];
  return [0.5, 1.5, 2.5]; // asist/faltas/tarjetas jugador
}

/** λ por defecto sugerida para mercados de conteo (editable por el usuario). */
export function getDefaultLambda(mt: MarketType, match: BuilderMatchLike, teamId?: string): number {
  if (mt === "team_total_goals") return teamId === match.params.awayId ? match.params.awayXG : match.params.homeXG;
  if (mt === "team_shots") return 12;
  if (mt === "team_shots_on_target") return 4.5;
  if (mt === "team_total_corners") return match.params.cornersLambda / 2;
  if (mt === "team_total_cards") return match.params.cardsLambda / 2;
  if (mt === "team_total_fouls") return 11;
  if (mt === "anytime_goalscorer") return 0.4;
  if (mt === "player_shots") return 2;
  if (mt === "player_shots_on_target") return 0.9;
  if (mt === "player_assists") return 0.3;
  if (mt === "player_passes") return 28;
  if (mt === "player_fouls" || mt === "player_fouls_drawn") return 1.2;
  if (mt === "player_cards") return 0.35;
  if (mt === "goalkeeper_saves") return 3;
  return 1;
}
