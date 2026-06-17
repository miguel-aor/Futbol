import { notFound, ok } from "@/lib/api-response";
import { getPlayerDetail } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPlayerDetail(id);
  if (!detail) return notFound("Jugador no encontrado");
  return ok(detail);
}
