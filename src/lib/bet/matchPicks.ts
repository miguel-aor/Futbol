// =====================================================================
// matchPicks.ts — "Picks del partido" REALES (sin mock ni plantillas fijas).
//
// Genera oportunidades a partir del modelo del partido (predictMatchup + xG),
// el contexto reciente (365Scores), el árbitro y la fuerza de selección. Para
// cada mercado evalúa VARIAS líneas y elige la más informativa (línea dinámica),
// limita la repetición y la correlación de guion, y NO inventa edge contra el
// mercado: son proyecciones del modelo (source "Model") con cuota justa.
// =====================================================================

import { computeWorldCupMatches } from "@/lib/worldcup-2026/tournament-form";
import { predictMatchup } from "@/lib/worldcup-2026/prediction-features";
import { getTeamStrengthContext } from "@/lib/teamStrength";
import { getGoalkeeperRecent } from "@/data/playerRecentStats";
import { calculateExactScoreMatrix } from "./exactScoreModel";
import { evaluateMarket } from "./buildPicks";
import type { BetMarket, BetSelection, MarketCategory, MarketType, MatchModelParams } from "@/lib/bet/types";

const DEFAULT_LAMBDAS = { cornersLambda: 10, cardsLambda: 4.6, offsidesLambda: 3.4, penaltyProb: 0.24 };
const LINE_TARGET = 0.68; // prob "confiable pero informativa" para elegir línea

function fairAmerican(p: number): number {
  const q = Math.max(0.02, Math.min(0.98, p));
  return q >= 0.5 ? Math.round((-100 * q) / (1 - q)) : Math.round((100 * (1 - q)) / q);
}

/** Muestra una línea over .5 como threshold entero tal como la casa: 3.5 → "4+". */
function plus(line: number | null): string {
  return line == null ? "+" : `${Math.ceil(line)}+`;
}

function paramsFor(matchId: string): { params: MatchModelParams; name: string } | null {
  const m = computeWorldCupMatches().find((x) => x.id === matchId);
  if (!m) return null;
  const pred = predictMatchup(m.homeId, m.awayId);
  return {
    name: `${m.homeName} vs ${m.awayName}`,
    params: {
      homeId: m.homeId,
      awayId: m.awayId,
      homeName: m.homeName,
      awayName: m.awayName,
      homeXG: pred?.homeXG ?? 1.3,
      awayXG: pred?.awayXG ?? 1.1,
      ...DEFAULT_LAMBDAS,
    },
  };
}

interface Candidate {
  category: MarketCategory;
  marketType: MarketType;
  /** selección por línea (texto legible). */
  sel: (line: number | null) => string;
  lines: Array<number | null>;
  teamId?: string;
  /** etiqueta corta de grupo para no repetir mercado. */
  group: string;
}

/** Evalúa una selección (la prob. del modelo no depende del momio). */
function modelProb(matchId: string, params: MatchModelParams, name: string, c: Candidate, line: number | null): BetSelection {
  const m: BetMarket = {
    id: `mp-${matchId}-${c.group}-${line ?? "x"}`,
    matchId,
    category: c.category,
    marketType: c.marketType,
    label: c.group,
    selection: c.sel(line),
    line,
    americanOdds: -110,
    oppositeAmericanOdds: null,
    modelLambda: null,
    teamId: c.teamId,
    source: "Model",
    reliability: "medium",
    isDemo: false,
    lastUpdated: new Date().toISOString(),
  };
  return evaluateMarket(m, params, name);
}

const LOW_SCRIPT = new Set(["goals_under", "btts_no", "team_goals_under", "clean_sheet_script"]);

const GROUP_LABEL: Record<string, string> = {
  resultado: "Resultado (1X2)", doble: "Doble oportunidad", goles: "Total de goles", goles_u: "Total de goles",
  btts: "Ambos anotan", btts_no: "Ambos anotan", team_goals: "Goles de equipo", clean_sheet: "Portería a cero",
  corners_eq: "Corners de equipo", corners_tot: "Corners totales", tiros_eq: "Tiros de equipo",
  sot_eq: "Tiros a puerta", tarjetas: "Tarjetas", atajadas: "Atajadas del portero",
};
const GROUP_FAMILY: Record<string, string> = {
  resultado: "1x2", doble: "1x2", goles: "goles", goles_u: "goles", btts: "btts", btts_no: "btts",
  team_goals: "team_goals", clean_sheet: "clean_sheet", corners_eq: "corners", corners_tot: "corners",
  tiros_eq: "tiros", sot_eq: "tiros", tarjetas: "tarjetas", atajadas: "atajadas",
};

/** Picks reales del partido: una por grupo de mercado, líneas dinámicas. */
export function buildMatchProjectionPicks(matchId: string): BetSelection[] {
  const ctxParams = paramsFor(matchId);
  if (!ctxParams) return [];
  const { params, name } = ctxParams;
  const ctx = getTeamStrengthContext(params.homeId, params.awayId);
  const fav = ctx.favorite === "away" ? "away" : "home";
  const favId = fav === "home" ? params.homeId : params.awayId;
  const favName = fav === "home" ? params.homeName : params.awayName;
  const dogId = fav === "home" ? params.awayId : params.homeId;
  const dogGk = getGoalkeeperRecent(dogId);

  const candidates: Candidate[] = [
    { group: "resultado", category: "match", marketType: "match_result", teamId: favId, lines: [null], sel: () => favName },
    { group: "doble", category: "match", marketType: "double_chance", teamId: favId, lines: [null], sel: () => `${favName} o empate` },
    { group: "goles", category: "match", marketType: "total_goals", lines: [1.5, 2.5, 3.5], sel: (l) => `Más de ${l}` },
    { group: "goles_u", category: "match", marketType: "total_goals", lines: [2.5, 3.5], sel: (l) => `Menos de ${l}` },
    { group: "btts", category: "match", marketType: "both_teams_score", lines: [null], sel: () => "Sí" },
    { group: "btts_no", category: "match", marketType: "both_teams_score", lines: [null], sel: () => "No" },
    { group: "team_goals", category: "team", marketType: "team_total_goals", teamId: favId, lines: [1.5, 2.5], sel: (l) => `${favName} Más de ${l}` },
    // Portería a cero del FAVORITO = el rival (underdog) no anota (under 0.5).
    // Se etiqueta con el equipo que mantiene el cero (favorito), sin invertir.
    { group: "clean_sheet", category: "team", marketType: "team_total_goals", teamId: dogId, lines: [0.5], sel: () => `${favName} portería a cero` },
    { group: "corners_eq", category: "team", marketType: "team_total_corners", teamId: favId, lines: [4.5, 5.5, 6.5, 7.5], sel: (l) => `${favName} ${plus(l)} córners` },
    { group: "corners_tot", category: "match", marketType: "corners", lines: [8.5, 9.5, 10.5], sel: (l) => `Más de ${l} córners` },
    { group: "tiros_eq", category: "team", marketType: "team_shots", teamId: favId, lines: [9.5, 11.5, 13.5], sel: (l) => `${favName} ${plus(l)} tiros` },
    { group: "sot_eq", category: "team", marketType: "team_shots_on_target", teamId: favId, lines: [3.5, 4.5, 5.5], sel: (l) => `${favName} ${plus(l)} tiros a puerta` },
    { group: "tarjetas", category: "match", marketType: "cards", lines: [2.5, 3.5, 4.5], sel: (l) => `Más de ${l} tarjetas` },
  ];
  if (dogGk) {
    candidates.push({
      group: "atajadas",
      category: "team",
      marketType: "goalkeeper_saves",
      teamId: dogId,
      lines: [3.5, 4.5, 5.5, 6.5],
      sel: (l) => `${dogGk.playerName} ${plus(l)} atajadas`,
    });
  }

  const collected: Array<{ pick: BetSelection; family: string; prob: number }> = [];
  for (const c of candidates) {
    // Elige la línea cuya prob. del modelo esté más cerca del objetivo (informativa).
    let best: { sel: BetSelection; prob: number } | null = null;
    for (const line of c.lines) {
      const evald = modelProb(matchId, params, name, c, line);
      const p = evald.modelProbability;
      if (p < 0.5) continue; // no mostramos selecciones menos probables que su contra
      if (!best || Math.abs(p - LINE_TARGET) < Math.abs(best.prob - LINE_TARGET)) best = { sel: evald, prob: p };
    }
    if (!best || best.prob < 0.55) continue; // sin pick confiable en este mercado
    if (best.prob > 0.85) continue; // pick trivial (cuota mínima) → no aporta info
    // Cuota JUSTA del modelo (sin edge inventado contra el mercado).
    const finalMkt: BetMarket = {
      id: best.sel.marketId,
      matchId,
      category: c.category,
      marketType: c.marketType,
      label: GROUP_LABEL[c.group] ?? c.group,
      selection: best.sel.selection,
      line: best.sel.line,
      americanOdds: fairAmerican(best.prob),
      oppositeAmericanOdds: null,
      modelLambda: null,
      teamId: c.teamId,
      source: "Model",
      reliability: "medium",
      isDemo: false,
      lastUpdated: new Date().toISOString(),
    };
    collected.push({ pick: evaluateMarket(finalMkt, params, name), family: GROUP_FAMILY[c.group] ?? c.group, prob: best.prob });
  }

  // Dedup por FAMILIA de mercado (no mostrar corners equipo + corners totales, etc.):
  // se queda el de mayor prob. por familia.
  const byFamily = new Map<string, { pick: BetSelection; prob: number }>();
  for (const c of collected) {
    const cur = byFamily.get(c.family);
    if (!cur || c.prob > cur.prob) byFamily.set(c.family, { pick: c.pick, prob: c.prob });
  }
  // Ordena por confianza del modelo (no por EV: son proyecciones).
  const ranked = [...byFamily.values()].map((v) => v.pick).sort((a, b) => b.modelProbability - a.modelProbability);

  // Limita correlación de guion (pocos goles / portería a cero): solo 1 pick
  // PRINCIPAL del mismo guion (las demás se omiten para no inflar redundancia).
  let scriptCount = 0;
  const top = ranked
    .filter((p) => {
      const isScript = p.correlationTags.some((t) => LOW_SCRIPT.has(t));
      if (!isScript) return true;
      scriptCount += 1;
      return scriptCount <= 1;
    })
    .slice(0, 8);

  // Marcador exacto más probable (alta varianza) como cierre informativo.
  const es = calculateExactScoreMatrix(matchId);
  if (es && es.topScores[0]) {
    const s = es.topScores[0];
    top.push({
      id: `mp-${matchId}-exact`,
      marketId: `mp-${matchId}-exact`,
      matchId,
      matchName: name,
      category: "match",
      marketType: "match_result",
      label: "Marcador exacto",
      selection: `${es.homeName} ${s.scoreline} ${es.awayName}`,
      line: null,
      americanOdds: s.fairOddsAmerican,
      decimalOdds: s.fairOddsDecimal,
      impliedProbability: s.probability,
      noVigProbability: null,
      modelProbability: s.probability,
      edge: 0,
      expectedValue: 0,
      confidenceScore: Math.round(s.probability * 100),
      rating: "fair_line",
      riskLevel: "high",
      correlationTags: [`match:${matchId}`],
      source: "Model",
      reliability: "low",
      isDemo: false,
      models: ["Poisson/Dixon-Coles"],
      finalValueScore: Math.round(s.probability * 60),
      realismFlags: [{ code: "high_variance", label: "Alta varianza", note: "Marcador exacto: predicción del modelo, no value contra mercado.", severity: "info" }],
      explanation: `Marcador más probable del modelo (${(s.probability * 100).toFixed(1)}%). Alta varianza: no es value automático.`,
    });
  }

  return top;
}
