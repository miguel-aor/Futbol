import { ok } from "@/lib/api-response";
import { getMatchSummaries } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(await getMatchSummaries());
}
