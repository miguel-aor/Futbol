// =====================================================================
// playdoitOdds.ts — momios de REFERENCIA transcritos de capturas del usuario.
//
// Procedencia: capturas de PlayDoit que el usuario nos compartió (carpeta
// "Play do it"). Se cargan como REFERENCIA MANUAL, NO como feed oficial:
// cada pick se marca source "Manual input" (no se afirma que viene de PlayDoit
// como fuente conectada). Sin scraping; transcripción manual.
//
// Cubre los mercados principales legibles + props de jugador destacados de:
//   wc-C-3 Escocia vs Marruecos · wc-C-4 Brasil vs Haití
//   wc-D-3 Estados Unidos vs Australia · wc-D-4 Turquía vs Paraguay
// (Brasil y Marruecos no traían 1x2/hándicap en las capturas → se omiten.)
// =====================================================================

import { evaluateMarket } from "@/lib/bet/buildPicks";
import type { BetMarket, BetSelection, MarketCategory, MarketType, MatchModelParams } from "@/lib/bet/types";

export interface PlaydoitOddsRow {
  category: MarketCategory;
  marketType: MarketType;
  label: string;
  selection: string;
  line: number | null;
  americanOdds: number;
  teamId?: string;
  playerName?: string;
  modelLambda?: number | null;
}

// Helpers compactos
const T = (sel: string, line: number, odds: number): PlaydoitOddsRow => ({ category: "match", marketType: "total_goals", label: "Total de goles", selection: sel, line, americanOdds: odds });
const CARD = (sel: string, line: number, odds: number): PlaydoitOddsRow => ({ category: "match", marketType: "cards", label: "Total de tarjetas", selection: sel, line, americanOdds: odds });
const CORN = (sel: string, line: number, odds: number): PlaydoitOddsRow => ({ category: "match", marketType: "corners", label: "Total tiros de esquina", selection: sel, line, americanOdds: odds });
const OFF = (sel: string, line: number, odds: number): PlaydoitOddsRow => ({ category: "match", marketType: "offsides", label: "Total fueras de juego", selection: sel, line, americanOdds: odds });
const BTTS = (yes: number, no: number): PlaydoitOddsRow[] => [
  { category: "match", marketType: "both_teams_score", label: "Ambos equipos marcan", selection: "Sí", line: null, americanOdds: yes },
  { category: "match", marketType: "both_teams_score", label: "Ambos equipos marcan", selection: "No", line: null, americanOdds: no },
];
/** Prop de remates de jugador (Más de `line`). λ heurística = line + 0.8. */
const SH = (player: string, line: number, odds: number): PlaydoitOddsRow => ({ category: "player", marketType: "player_shots", label: "Remates", selection: `${player} Más de ${line}`, line, americanOdds: odds, playerName: player, modelLambda: line + 0.8 });
/** Prop de remates a puerta (Más de 0.5). λ heurística ≈ 0.85. */
const SOT = (player: string, odds: number): PlaydoitOddsRow => ({ category: "player", marketType: "player_shots_on_target", label: "Remates a puerta", selection: `${player} Más de 0.5`, line: 0.5, americanOdds: odds, playerName: player, modelLambda: 0.85 });

export const PLAYDOIT_ODDS: Record<string, PlaydoitOddsRow[]> = {
  // ---------------- wc-D-3 · Estados Unidos vs Australia ----------------
  "wc-D-3": [
    { category: "match", marketType: "match_result", label: "1x2", selection: "Estados Unidos", line: null, americanOdds: -163, teamId: "usa" },
    { category: "match", marketType: "match_result", label: "1x2", selection: "Empate", line: null, americanOdds: 333 },
    { category: "match", marketType: "match_result", label: "1x2", selection: "Australia", line: null, americanOdds: 400, teamId: "aus" },
    { category: "match", marketType: "double_chance", label: "Doble oportunidad", selection: "Estados Unidos o Empate", line: null, americanOdds: -567 },
    { category: "match", marketType: "double_chance", label: "Doble oportunidad", selection: "Estados Unidos o Australia", line: null, americanOdds: -450 },
    { category: "match", marketType: "double_chance", label: "Doble oportunidad", selection: "Empate o Australia", line: null, americanOdds: 116 },
    { category: "match", marketType: "asian_handicap", label: "Hándicap asiático", selection: "Estados Unidos -0.5", line: -0.5, americanOdds: -165, teamId: "usa" },
    { category: "match", marketType: "asian_handicap", label: "Hándicap asiático", selection: "Estados Unidos -1", line: -1, americanOdds: 110, teamId: "usa" },
    { category: "match", marketType: "asian_handicap", label: "Hándicap asiático", selection: "Estados Unidos -1.5", line: -1.5, americanOdds: 180, teamId: "usa" },
    { category: "match", marketType: "asian_handicap", label: "Hándicap asiático", selection: "Australia +0.5", line: 0.5, americanOdds: 140, teamId: "aus" },
    T("Más de 2.5", 2.5, 100), T("Menos de 2.5", 2.5, -120),
    T("Más de 1.5", 1.5, -250), T("Menos de 1.5", 1.5, 190),
    ...BTTS(100, -140),
    { category: "team", marketType: "team_total_goals", label: "Estados Unidos total de goles", selection: "Estados Unidos Más de 0.5", line: 0.5, americanOdds: -650, teamId: "usa" },
    { category: "team", marketType: "team_total_goals", label: "Estados Unidos total de goles", selection: "Estados Unidos Más de 1.5", line: 1.5, americanOdds: -125, teamId: "usa" },
    { category: "team", marketType: "team_total_goals", label: "Estados Unidos total de goles", selection: "Estados Unidos Más de 2.5", line: 2.5, americanOdds: 240, teamId: "usa" },
    { category: "team", marketType: "team_total_goals", label: "Australia total de goles", selection: "Australia Más de 0.5", line: 0.5, americanOdds: -150, teamId: "aus" },
    { category: "team", marketType: "team_total_goals", label: "Australia total de goles", selection: "Australia Más de 1.5", line: 1.5, americanOdds: 300, teamId: "aus" },
    CARD("Más de 2.5", 2.5, -220), CARD("Menos de 2.5", 2.5, 140), CARD("Más de 3.5", 3.5, 100), CARD("Más de 4.5", 4.5, 200),
    CORN("Más de 5.5", 5.5, -1000), CORN("Menos de 5.5", 5.5, 550),
    OFF("Más de 3.5", 3.5, -134), OFF("Menos de 3.5", 3.5, -108), OFF("Más de 4.5", 4.5, 150),
    SH("Timothy Weah", 0.5, -1000), SH("Weston McKennie", 0.5, -700), SH("Haji Wright", 1.5, -650), SH("Ricardo Pepi", 1.5, -650), SH("Maximilian Arfsten", 0.5, -500),
    SOT("Folarin Balogun", -550), SOT("Ricardo Pepi", -313), SOT("Haji Wright", -286), SOT("Christian Pulisic", -200),
  ],

  // ---------------- wc-C-4 · Brasil vs Haití ----------------
  "wc-C-4": [
    T("Más de 1.5", 1.5, -1000), T("Menos de 1.5", 1.5, 650),
    T("Más de 2.5", 2.5, -300), T("Menos de 2.5", 2.5, 240),
    T("Más de 3.5", 3.5, -120), T("Menos de 3.5", 3.5, 100),
    T("Más de 4.5", 4.5, 185), T("Menos de 4.5", 4.5, -225),
    ...BTTS(125, -175),
    { category: "team", marketType: "team_total_goals", label: "Brasil total de goles", selection: "Brasil Más de 1.5", line: 1.5, americanOdds: -700, teamId: "bra" },
    { category: "team", marketType: "team_total_goals", label: "Brasil total de goles", selection: "Brasil Más de 2.5", line: 2.5, americanOdds: -200, teamId: "bra" },
    { category: "team", marketType: "team_total_goals", label: "Brasil total de goles", selection: "Brasil Más de 3.5", line: 3.5, americanOdds: 120, teamId: "bra" },
    CARD("Más de 1.5", 1.5, -350), CARD("Más de 2.5", 2.5, -134), CARD("Más de 3.5", 3.5, 166), CARD("Más de 4.5", 4.5, 325),
    CORN("Más de 8.5", 8.5, -210), CORN("Más de 9.5", 9.5, -130), CORN("Menos de 9.5", 9.5, -110), CORN("Más de 10.5", 10.5, 130),
    OFF("Más de 1.5", 1.5, -550), OFF("Más de 2.5", 2.5, -175), OFF("Más de 4.5", 4.5, 275),
    SH("Vinicius Jr.", 2.5, -260), SH("Raphinha", 2.5, -334), SH("Matheus Cunha", 1.5, -600), SH("Endrick", 2.5, -367), SH("Gabriel Martinelli", 1.5, -700), SH("Igor Thiago", 2.5, -550),
    SOT("Vinicius Jr.", -800), SOT("Endrick", -650), SOT("Raphinha", -500), SOT("Gabriel Martinelli", -313), SOT("Matheus Cunha", -313),
  ],

  // ---------------- wc-C-3 · Escocia vs Marruecos ----------------
  "wc-C-3": [
    T("Más de 0.5", 0.5, -1200), T("Más de 1.5", 1.5, -240), T("Menos de 1.5", 1.5, 195),
    T("Más de 2.5", 2.5, 125), T("Menos de 2.5", 2.5, -150),
    T("Más de 3.5", 3.5, 325), T("Menos de 3.5", 3.5, -425),
    ...BTTS(110, -150),
    SH("Scott McTominay", 0.5, -650), SH("Che Adams", 0.5, -550), SH("Lawrence Shankland", 0.5, -550), SH("Ben Doak", 0.5, -240), SH("John McGinn", 0.5, -200), SH("Ryan Christie", 0.5, -115),
    SH("Achraf Hakimi", 0.5, -900), SH("Bilal El Khannouss", 0.5, -900), SH("Ismael Saibari", 1.5, -650), SH("Azzedine Ounahi", 0.5, -600), SH("Ayoub El Kaabi", 1.5, -550), SH("Soufiane Rahimi", 1.5, -434),
  ],

  // ---------------- wc-D-4 · Turquía vs Paraguay ----------------
  "wc-D-4": [
    { category: "match", marketType: "asian_handicap", label: "Hándicap asiático", selection: "Turquía -1.5", line: -1.5, americanOdds: 275, teamId: "tur" },
    { category: "match", marketType: "asian_handicap", label: "Hándicap asiático", selection: "Paraguay +1.5", line: 1.5, americanOdds: -350, teamId: "par" },
    T("Más de 1.5", 1.5, -300), T("Menos de 1.5", 1.5, 240),
    T("Más de 2.5", 2.5, 100), T("Menos de 2.5", 2.5, -120),
    T("Más de 3.5", 3.5, 260), T("Menos de 3.5", 3.5, -320),
    ...BTTS(-115, -105),
    SH("Arda Guler", 1.5, -550), SH("Orkun Kokcu", 0.5, -500), SH("Yunus Akgun", 1.5, -350), SH("Kenan Yildiz", 2.5, -220), SH("Hakan Calhanoglu", 1.5, -200), SH("Baris Alper Yilmaz", 1.5, -286),
  ],
};

/** ¿Hay momios cargados para este partido? */
export function hasPlaydoitOdds(matchId: string): boolean {
  return Boolean(PLAYDOIT_ODDS[matchId]?.length);
}

/** Busca un momio cargado por (mercado, selección, línea). */
export function findPlaydoitOdds(
  matchId: string,
  marketType: MarketType,
  selection: string,
  line: number | null,
): number | null {
  const rows = PLAYDOIT_ODDS[matchId];
  if (!rows) return null;
  const norm = (s: string) => s.trim().toLowerCase();
  const row = rows.find(
    (r) => r.marketType === marketType && norm(r.selection) === norm(selection) && (r.line ?? null) === (line ?? null),
  );
  return row ? row.americanOdds : null;
}

/** Evalúa todos los momios de referencia de un partido con el modelo. */
export function buildPlaydoitSelections(
  matchId: string,
  params: MatchModelParams,
  matchName: string,
): BetSelection[] {
  const rows = PLAYDOIT_ODDS[matchId];
  if (!rows) return [];
  return rows.map((r, i) => {
    const modelLambda =
      r.marketType === "team_total_goals"
        ? r.teamId === params.awayId
          ? params.awayXG
          : params.homeXG
        : r.modelLambda ?? null;
    const market: BetMarket = {
      id: `pd-${matchId}-${i}`,
      matchId,
      category: r.category,
      marketType: r.marketType,
      label: r.label,
      selection: r.selection,
      line: r.line,
      americanOdds: r.americanOdds,
      oppositeAmericanOdds: null,
      modelLambda,
      teamId: r.teamId,
      source: "Manual input", // referencia (capturas del usuario), no feed oficial
      reliability: "medium",
      isDemo: false,
      lastUpdated: "2026-06-19T14:00:00.000Z",
    };
    return evaluateMarket(market, params, matchName);
  });
}
