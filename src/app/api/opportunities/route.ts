import { ok } from "@/lib/api-response";
import { getOpportunityViews } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(await getOpportunityViews());
}
