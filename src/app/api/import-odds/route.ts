import type { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api-response";
import { DEMO_MATCH } from "@/data/betBuilderMock";
import { computeWorldCupMatches } from "@/lib/worldcup-2026/tournament-form";
import { predictMatchup } from "@/lib/worldcup-2026/prediction-features";
import { parseOddsCSV, parseOddsJSON, normalizeImportedOdds, type MatchContext } from "@/lib/odds/importedOddsProvider";
import { resolveImportedMatch } from "@/lib/odds/matchResolver";
import { calculateValuePicksFromOddsFeed } from "@/lib/odds/oddsProvider";
import type { OddsFeedSelection } from "@/lib/odds/types";

export const dynamic = "force-dynamic";

/**
 * Importa momios por CSV/JSON, resuelve cada uno a un partido interno real y
 * devuelve picks evaluadas con el modelo de ese partido (source
 * "Imported CSV/JSON"). NO hace scraping; recibe el contenido que el usuario
 * pega/sube. Los momios cuyo partido NO se reconoce se reportan como unmatched
 * y NO se evalúan (nunca caen a modelo neutral).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { format?: "csv" | "json"; content?: string };
    const format = body.format === "json" ? "json" : "csv";
    const content = body.content ?? "";
    const empty = {
      picks: [],
      warnings: ["Contenido vacío."],
      count: 0,
      metrics: { totalImported: 0, resolvedMatches: 0, unmatchedMatches: 0, selectionsReadyForModel: 0, selectionsSkipped: 0 },
      unmatched: [],
    };
    if (!content.trim()) return ok(empty);

    const rows = format === "csv" ? parseOddsCSV(content) : parseOddsJSON(content);
    const { selections: feed, warnings: normWarnings } = normalizeImportedOdds(rows, format);

    // Fixture real del Mundial: base para resolver cada momio importado.
    const wc = computeWorldCupMatches();

    const resolve = (odd: OddsFeedSelection): MatchContext | null => {
      // Caso demo (matchId directo del partido de ejemplo).
      if (odd.matchId === DEMO_MATCH.id) {
        return { matchId: DEMO_MATCH.id, params: DEMO_MATCH.params, name: DEMO_MATCH.name };
      }
      const { match } = resolveImportedMatch(odd, wc);
      if (!match) return null;
      const pred = predictMatchup(match.homeId, match.awayId);
      return {
        matchId: match.id,
        params: {
          homeId: match.homeId,
          awayId: match.awayId,
          homeName: match.homeName,
          awayName: match.awayName,
          homeXG: pred?.homeXG ?? 1.4,
          awayXG: pred?.awayXG ?? 1.1,
          cornersLambda: 10,
          cardsLambda: 4.6,
          offsidesLambda: 3.4,
          penaltyProb: 0.24,
        },
        name: `${match.homeName} vs ${match.awayName}`,
      };
    };

    const { picks, warnings, metrics, unmatched } = calculateValuePicksFromOddsFeed(feed, resolve);
    return ok({ picks, warnings: [...normWarnings, ...warnings], count: feed.length, metrics, unmatched });
  } catch {
    return serverError("No se pudo importar el feed de momios.");
  }
}
