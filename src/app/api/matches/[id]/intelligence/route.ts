import { notFound, ok } from "@/lib/api-response";
import { getMatchIntelligence } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getMatchIntelligence(id);
  if (!report) return notFound("Reporte de inteligencia no disponible");
  return ok(report);
}
