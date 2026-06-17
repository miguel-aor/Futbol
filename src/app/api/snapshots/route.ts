import { ok } from "@/lib/api-response";
import { listAllSnapshots } from "@/lib/data-providers/providerRegistry";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(await listAllSnapshots());
}
