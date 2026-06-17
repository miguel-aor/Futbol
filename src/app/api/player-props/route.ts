import { notFound, ok } from "@/lib/api-response";
import { getPlayerProps } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");
  if (!playerId) return notFound("Falta el parametro playerId");
  return ok(await getPlayerProps(playerId));
}
