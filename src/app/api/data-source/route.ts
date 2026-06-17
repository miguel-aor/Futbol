import { ok } from "@/lib/api-response";
import {
  activeProviderId,
  getActiveProviderMetadata,
  getAllProviderMetadata,
} from "@/lib/data-providers/providerRegistry";

export const dynamic = "force-dynamic";

export async function GET() {
  const [active, all] = await Promise.all([
    getActiveProviderMetadata(),
    getAllProviderMetadata(),
  ]);
  return ok({ activeId: activeProviderId(), active, providers: all });
}
