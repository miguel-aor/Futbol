import { ok } from "@/lib/api-response";
import { REAL_LEADERBOARDS, TOURNAMENT_STATS_AS_OF } from "@/data/tournament-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(REAL_LEADERBOARDS, { asOf: TOURNAMENT_STATS_AS_OF });
}
