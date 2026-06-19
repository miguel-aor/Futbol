// =====================================================================
// openaiParlayAdvisor.ts — capa de IA (SERVER-ONLY).
//
// La estadística local ya calculó probabilidad/edge/EV/correlación/riesgo.
// La IA SOLO explica, clasifica, resume y advierte. Usa la key de entorno
// `process.env.FutbolApi` (nunca en frontend). Si no existe o falla, se
// devuelve un ranking LOCAL como fallback, sin romper la app.
//
// No promete ganancias. No inventa picks. No manda datos sensibles.
// =====================================================================

import "server-only";
import type {
  AIParlayAdvice,
  AIRecommendedParlay,
  ParlayCandidate,
} from "@/lib/bet/types";

const FALLBACK_MSG =
  "AI advisor no configurado. Mostrando ranking local por EV, edge y riesgo.";

/** Versión compacta y NO sensible de un candidato para mandar al modelo. */
function sanitize(c: ParlayCandidate) {
  return {
    id: c.id,
    strategy: c.strategy,
    combinedAmericanOdds: c.combinedAmericanOdds,
    estimatedJointProbability: Number(c.estimatedJointProbability.toFixed(4)),
    estimatedEV: Number(c.estimatedEV.toFixed(4)),
    confidenceScore: c.confidenceScore,
    correlationRisk: c.correlationRisk,
    volatilityRisk: c.volatilityRisk,
    dataQualityRisk: c.dataQualityRisk,
    isDemo: c.isDemo,
    picks: c.picks.map((p) => ({
      selection: p.selection,
      marketType: p.marketType,
      americanOdds: p.americanOdds,
      modelProbability: Number(p.modelProbability.toFixed(3)),
      edge: Number(p.edge.toFixed(3)),
      ev: Number(p.expectedValue.toFixed(3)),
      risk: p.riskLevel,
    })),
  };
}

export function buildParlayAdvisorPrompt(candidates: ParlayCandidate[]): {
  system: string;
  user: string;
} {
  const system = [
    "Eres un analista de apuestas deportivas responsable.",
    "Las probabilidades, edge, EV, correlación y riesgo YA están calculados con modelos estadísticos locales.",
    "Tu trabajo es SOLO explicar, clasificar, resumir y advertir; NO inventes números ni recalcules.",
    "Nunca prometas ganancias ni digas 'pick garantizada' o 'parley seguro'.",
    "Usa lenguaje responsable: 'valor estadístico', 'EV estimado', 'riesgo', 'confianza'.",
    "Prioriza parleys con EV estimado positivo, buena confianza y riesgo de correlación bajo.",
    "Rechaza los de EV negativo o correlación alta aunque tengan momio atractivo.",
    "Responde ÚNICAMENTE con JSON válido según el esquema pedido.",
  ].join(" ");

  const schema = {
    recommendedParlays: [
      {
        id: "string",
        strategy: "conservative | balanced | aggressive | same_game | player_props",
        confidence: 0,
        risk: "low | medium | high",
        reasoning: "string",
        warnings: ["string"],
        recommendation: "string",
      },
    ],
    rejectedParlays: [{ id: "string", reason: "string" }],
    riskWarnings: ["string"],
    userFriendlySummary: "string",
    finalRecommendation: "string",
  };

  const user = [
    "Candidatos (ya evaluados localmente):",
    JSON.stringify(candidates.map(sanitize)),
    "Devuelve JSON con este esquema exacto:",
    JSON.stringify(schema),
    "Recomienda como máximo 6 parleys. Sé breve y claro.",
  ].join("\n");

  return { system, user };
}

/** Construye una recomendación LOCAL (sin IA) a partir del ranking. */
export function buildLocalAdvice(candidates: ParlayCandidate[]): AIParlayAdvice {
  const ranked = [...candidates].sort((a, b) => b.finalScore - a.finalScore);
  const positives = ranked.filter((c) => c.estimatedEV > 0);
  const top = positives.slice(0, 6);

  const recommendedParlays: AIRecommendedParlay[] = top.map((c) => ({
    id: c.id,
    strategy: c.strategy,
    confidence: c.confidenceScore,
    risk: c.correlationRisk,
    reasoning: `EV estimado ${(c.estimatedEV * 100).toFixed(1)}% por unidad, confianza ${c.confidenceScore}/100, correlación ${c.correlationRisk}. Momio combinado ${c.combinedAmericanOdds > 0 ? "+" : ""}${c.combinedAmericanOdds}.`,
    warnings: c.warnings,
    recommendation:
      c.correlationRisk === "high"
        ? "Valor estimado positivo pero correlación alta; tómalo con cautela."
        : "Combinación con valor estadístico estimado positivo. Es una estimación, no una garantía.",
  }));

  const rejectedParlays = ranked
    .filter((c) => c.estimatedEV <= 0)
    .slice(0, 8)
    .map((c) => ({
      id: c.id,
      reason: c.estimatedEV <= 0 ? "EV estimado no positivo" : "riesgo elevado",
    }));

  return {
    recommendedParlays,
    rejectedParlays,
    riskWarnings: [
      "Las predicciones son estimaciones estadísticas, no garantizan resultados.",
      ...(top.some((c) => c.isDemo) ? ["Incluye datos demo."] : []),
    ],
    explanation:
      "Ranking local por EV, edge, confianza y riesgo de correlación. La IA no está disponible o no se usó.",
    userFriendlySummary: top.length
      ? `${top.length} combinaciones con valor estadístico estimado positivo, ordenadas por balance EV/riesgo.`
      : "No se encontraron combinaciones con EV estimado positivo y riesgo aceptable.",
    finalRecommendation: top.length
      ? "Prioriza las de mayor EV con correlación baja. Estimaciones, no garantías."
      : "Ajusta filtros o agrega más picks con valor.",
    fromAI: false,
  };
}

/**
 * Pide a la IA que explique/clasifique los candidatos. Si no hay key o falla,
 * devuelve el ranking local (fromAI:false) — la app nunca se rompe.
 */
export async function analyzeParlayCandidatesWithAI(
  candidates: ParlayCandidate[],
): Promise<AIParlayAdvice> {
  const apiKey = process.env.FutbolApi;
  if (!apiKey) {
    return { ...buildLocalAdvice(candidates), explanation: FALLBACK_MSG };
  }
  // Manda como máximo top 50 candidatos a la API.
  const top = [...candidates].sort((a, b) => b.finalScore - a.finalScore).slice(0, 50);
  const { system, user } = buildParlayAdvisorPrompt(top);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Respuesta vacía");
    const parsed = JSON.parse(content) as Partial<AIParlayAdvice>;
    return {
      recommendedParlays: parsed.recommendedParlays ?? [],
      rejectedParlays: parsed.rejectedParlays ?? [],
      riskWarnings: parsed.riskWarnings ?? [],
      explanation: parsed.explanation ?? "Análisis generado por IA sobre el ranking local.",
      userFriendlySummary: parsed.userFriendlySummary ?? "",
      finalRecommendation: parsed.finalRecommendation ?? "",
      fromAI: true,
    };
  } catch {
    // Cualquier fallo → fallback local, sin romper.
    return {
      ...buildLocalAdvice(candidates),
      explanation: "La IA no respondió; se muestra el ranking local por EV/edge/riesgo.",
    };
  }
}
