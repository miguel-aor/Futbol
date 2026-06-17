import { notFound, ok } from "@/lib/api-response";
import { getMatchDetail } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getMatchDetail(id);
  if (!detail) return notFound("Partido no encontrado");
  return ok(detail);
}
