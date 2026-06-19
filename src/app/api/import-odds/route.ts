import type { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api-response";
import { DEMO_MATCH } from "@/data/betBuilderMock";
import { computeWorldCupMatches } from "@/lib/worldcup-2026/tournament-form";
import { predictMatchup } from "@/lib/worldcup-2026/prediction-features";
import { parseOddsCSV, parseOddsJSON, normalizeImportedOdds, type MatchContext } from "@/lib/odds/importedOddsProvider";
import { calculateValuePicksFromOddsFeed } from "@/lib/odds/oddsProvider";

export const dynamic = "force-dynamic";

/**
 * Importa momios por CSV/JSON, los valida y devuelve picks evaluadas por el
 * modelo (source "Imported CSV/JSON"). NO hace scraping; recibe el contenido
 * que el usuario pega/sube.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { format?: "csv" | "json"; content?: string };
    const format = body.format === "json" ? "json" : "csv";
    const content = body.content ?? "";
    if (!content.trim()) return ok({ picks: [], warnings: ["Contenido vacío."], count: 0 });

    const rows = format === "csv" ? parseOddsCSV(content) : parseOddsJSON(content);
    const { selections: feed, warnings: normWarnings } = normalizeImportedOdds(rows, format);

    // Resolver el modelo del partido (demo o fixture real del Mundial).
    const wc = computeWorldCupMatches();
    const byId = new Map(wc.map((m) => [m.id, m]));
    const resolve = (matchId: string): MatchContext | null => {
      if (matchId === DEMO_MATCH.id) return { params: DEMO_MATCH.params, name: DEMO_MATCH.name };
      const m = byId.get(matchId);
      if (!m) return null;
      const pred = predictMatchup(m.homeId, m.awayId);
      return {
        params: {
          homeId: m.homeId,
          awayId: m.awayId,
          homeName: m.homeName,
          awayName: m.awayName,
          homeXG: pred?.homeXG ?? 1.4,
          awayXG: pred?.awayXG ?? 1.1,
          cornersLambda: 10,
          cardsLambda: 4.6,
          offsidesLambda: 3.4,
          penaltyProb: 0.24,
        },
        name: `${m.homeName} vs ${m.awayName}`,
      };
    };

    const { picks, warnings } = calculateValuePicksFromOddsFeed(feed, resolve);
    return ok({ picks, warnings: [...normWarnings, ...warnings], count: feed.length });
  } catch {
    return serverError("No se pudo importar el feed de momios.");
  }
}
