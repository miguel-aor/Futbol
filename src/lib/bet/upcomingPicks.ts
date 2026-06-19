// =====================================================================
// upcomingPicks.ts — Value Picks para los PRÓXIMOS partidos del Mundial.
//
// Los partidos reales no traen momios (no hacemos scraping). Para poder
// mostrar value picks de los próximos encuentros, generamos un set de mercados
// con MOMIOS DEMO derivados del modelo (regresados hacia un baseline + margen)
// y la probabilidad del modelo ponderada con la forma del Mundial. Todo queda
// marcado source:"Demo", isDemo:true. Cuando exista una fuente de momios
// autorizada, estos momios demo se reemplazan por los reales.
//
// SERVER-side (usa la capa worldcup-2026). La UI lo consume vía API interna.
// =====================================================================

import { computeWorldCupMatches } from "@/lib/worldcup-2026/tournament-form";
import { predictMatchup } from "@/lib/worldcup-2026/prediction-features";
import { buildPlaydoitSelections, hasPlaydoitOdds } from "@/data/playdoitOdds";
import { getUpcomingEligibleMatches } from "./eligibility";
import { evaluateMarket } from "./buildPicks";
import type { BetMarket, BetSelection, MarketType, MatchModelParams } from "./types";

const DEFAULT_LAMBDAS = { cornersLambda: 10, cardsLambda: 4.6, offsidesLambda: 3.4, penaltyProb: 0.24 };
const TS = "2026-06-19T18:00:00.000Z";

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function priorFor(mt: MarketType): number {
  if (mt === "match_result") return 1 / 3;
  if (mt === "double_chance") return 2 / 3;
  return 0.5;
}

/** Momio americano demo a partir de la prob. del modelo (baseline + margen). */
function demoAmericanFromModel(modelProb: number, mt: MarketType): number {
  const baseline = 0.82 * modelProb + 0.18 * priorFor(mt);
  const implied = clamp(baseline + 0.03, 0.02, 0.97); // margen demo ~3%
  return implied >= 0.5
    ? -Math.round((100 * implied) / (1 - implied))
    : Math.round((100 * (1 - implied)) / implied);
}

interface MarketSpec {
  marketType: MarketType;
  category: BetMarket["category"];
  selection: string;
  line: number | null;
  label: string;
  teamId?: string;
  modelLambda?: number | null;
}

function specsFor(p: MatchModelParams): MarketSpec[] {
  return [
    { marketType: "match_result", category: "match", selection: p.homeName, line: null, label: "1x2", teamId: p.homeId },
    { marketType: "match_result", category: "match", selection: "Empate", line: null, label: "1x2" },
    { marketType: "match_result", category: "match", selection: p.awayName, line: null, label: "1x2", teamId: p.awayId },
    { marketType: "double_chance", category: "match", selection: `${p.homeName} o Empate`, line: null, label: "Doble oportunidad" },
    { marketType: "double_chance", category: "match", selection: `Empate o ${p.awayName}`, line: null, label: "Doble oportunidad" },
    { marketType: "total_goals", category: "match", selection: "Over 2.5", line: 2.5, label: "Total de goles" },
    { marketType: "total_goals", category: "match", selection: "Under 2.5", line: 2.5, label: "Total de goles" },
    { marketType: "both_teams_score", category: "match", selection: "Sí", line: null, label: "Ambos equipos marcan" },
    { marketType: "both_teams_score", category: "match", selection: "No", line: null, label: "Ambos equipos marcan" },
    { marketType: "team_total_goals", category: "team", selection: `${p.homeName} Over 1.5`, line: 1.5, label: "Equipo total de goles", teamId: p.homeId, modelLambda: p.homeXG },
    { marketType: "team_total_goals", category: "team", selection: `${p.awayName} Over 0.5`, line: 0.5, label: "Equipo total de goles", teamId: p.awayId, modelLambda: p.awayXG },
  ];
}

/** Genera value picks (demo) para los próximos `limit` partidos elegibles. */
export function buildUpcomingValuePicks(limit = 8): BetSelection[] {
  const matches = getUpcomingEligibleMatches(computeWorldCupMatches(), { limit });
  const out: BetSelection[] = [];

  for (const m of matches) {
    const pred = predictMatchup(m.homeId, m.awayId);
    const params: MatchModelParams = {
      homeId: m.homeId,
      awayId: m.awayId,
      homeName: m.homeName,
      awayName: m.awayName,
      homeXG: pred?.homeXG ?? 1.4,
      awayXG: pred?.awayXG ?? 1.1,
      ...DEFAULT_LAMBDAS,
    };
    const name = `${m.homeName} vs ${m.awayName}`;

    // Si hay momios de referencia (capturas del usuario), usarlos en lugar de
    // los momios demo sintéticos.
    if (hasPlaydoitOdds(m.id)) {
      out.push(...buildPlaydoitSelections(m.id, params, name));
      continue;
    }

    specsFor(params).forEach((spec, i) => {
      const base: BetMarket = {
        id: `wc-${m.id}-${i}`,
        matchId: m.id,
        category: spec.category,
        marketType: spec.marketType,
        label: spec.label,
        selection: spec.selection,
        line: spec.line,
        americanOdds: -110,
        oppositeAmericanOdds: null,
        modelLambda: spec.modelLambda ?? null,
        teamId: spec.teamId,
        source: "Demo",
        reliability: "demo",
        isDemo: true,
        lastUpdated: TS,
      };
      // 1ª pasada: prob. del modelo → 2ª pasada: con momio demo derivado.
      const probe = evaluateMarket(base, params, name);
      const american = demoAmericanFromModel(probe.modelProbability, spec.marketType);
      out.push(evaluateMarket({ ...base, americanOdds: american }, params, name));
    });
  }

  return out;
}
