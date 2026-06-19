/* Construye prediction-features.json: mezcla ponderada de capas (Mundial
 * actual con peso alto + forma reciente + ranking). Se actualiza solo en
 * función de los partidos ya jugados (capa "Forma en este Mundial"). */

import { computePredictionFeatures } from "../src/lib/worldcup-2026/prediction-features";
import { logSources, nowIso, summarize, writeJson } from "./lib/wc-ingest";

const SCRIPT = "build-prediction-features";

async function main() {
  const collectedAt = nowIso();
  const features = computePredictionFeatures();
  await writeJson("prediction-features.json", features);

  const highWeight = features.filter((f) => f.matchesPlayedWC >= 2).length;
  await logSources(SCRIPT, [
    {
      script: SCRIPT,
      source: "derived (tournament-form + ranking)",
      sourceUrl: "src/lib/worldcup-2026/prediction-features.ts",
      status: "ok",
      records: features.length,
      collectedAt,
      note: `Pesos: <2 partidos → WC 0.50; ≥2 partidos → WC 0.65. ${highWeight} equipos con peso alto.`,
    },
  ]);

  summarize(SCRIPT, [
    `features: ${features.length} equipos`,
    `con peso WC alto (≥2 partidos): ${highWeight}`,
  ]);
}

main();
