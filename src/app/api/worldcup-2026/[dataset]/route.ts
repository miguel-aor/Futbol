import type { NextRequest } from "next/server";
import { ok, notFound } from "@/lib/api-response";
import {
  computeTournamentForm,
  computeWorldCupMatches,
} from "@/lib/worldcup-2026/tournament-form";
import {
  computePredictionFeatures,
  predictMatchup,
} from "@/lib/worldcup-2026/prediction-features";
import { WORLD_CUP_2026_EVENTS } from "@/data/worldcup2026Events";

export const dynamic = "force-dynamic";

/**
 * API interna del pipeline Mundial 2026. La UI SOLO debe leer de aquí.
 * Datasets: matches · team-current-tournament-form · prediction-features ·
 * matchup (?home=&away=).
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ dataset: string }> },
) {
  const { dataset } = await ctx.params;
  const meta = { source: "in-repo snapshot (worldcup-fixtures)", reliability: "medium" };

  switch (dataset) {
    case "matches":
      return ok(computeWorldCupMatches(), meta);
    case "team-current-tournament-form":
      return ok(computeTournamentForm(), meta);
    case "prediction-features":
      return ok(computePredictionFeatures(), meta);
    case "match-events":
      return ok(WORLD_CUP_2026_EVENTS, {
        source: "Wikipedia/ESPN (verificado)",
        reliability: "medium",
      });
    case "matchup": {
      const home = req.nextUrl.searchParams.get("home") ?? "";
      const away = req.nextUrl.searchParams.get("away") ?? "";
      const prediction = predictMatchup(home, away);
      if (!prediction) return notFound("Equipos inválidos para la predicción.");
      return ok(prediction, meta);
    }
    default:
      return notFound(`Dataset desconocido: ${dataset}`);
  }
}
