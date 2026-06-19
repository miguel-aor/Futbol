import type { NextRequest } from "next/server";
import { ok } from "@/lib/api-response";
import { buildUpcomingValuePicks } from "@/lib/bet/upcomingPicks";

export const dynamic = "force-dynamic";

/**
 * Value picks (demo) de los próximos partidos elegibles del Mundial. Momios
 * demo derivados del modelo (ponderado con forma del Mundial); sin scraping.
 */
export async function GET(req: NextRequest) {
  const raw = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(16, raw) : 8;
  return ok(buildUpcomingValuePicks(limit), { source: "Demo (modelo)", limit });
}
