import { notFound, ok } from "@/lib/api-response";
import { getTeamIntelligence } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getTeamIntelligence(id);
  if (!profile) return notFound("Perfil de inteligencia no disponible");
  return ok(profile);
}
