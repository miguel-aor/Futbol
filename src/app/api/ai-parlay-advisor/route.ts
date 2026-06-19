import type { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api-response";
import { analyzeParlayCandidatesWithAI, buildLocalAdvice } from "@/lib/openaiParlayAdvisor";
import type { ParlayCandidate } from "@/lib/bet/types";

export const dynamic = "force-dynamic";

/**
 * Recibe candidatos ya calculados localmente y devuelve recomendación/avisos.
 * Usa OpenAI vía process.env.FutbolApi; si no hay key o falla → ranking local.
 * La key NUNCA llega al frontend: solo se usa aquí (server).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { candidates?: ParlayCandidate[] };
    const candidates = Array.isArray(body.candidates) ? body.candidates : [];
    if (candidates.length === 0) {
      return ok(buildLocalAdvice([]), { fromAI: false, configured: Boolean(process.env.FutbolApi) });
    }
    // Limitar a top 100 antes de cualquier llamada externa.
    const limited = candidates.slice(0, 100);
    const advice = await analyzeParlayCandidatesWithAI(limited);
    return ok(advice, { configured: Boolean(process.env.FutbolApi) });
  } catch {
    return serverError("No se pudo analizar el parlay.");
  }
}
