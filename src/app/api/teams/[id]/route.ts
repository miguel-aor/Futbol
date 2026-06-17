import { notFound, ok } from "@/lib/api-response";
import { getTeamDetail } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getTeamDetail(id);
  if (!detail) return notFound("Seleccion no encontrada");
  return ok(detail);
}
