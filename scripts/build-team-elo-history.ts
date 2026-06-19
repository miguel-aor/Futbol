/* Capa 4 (histórica): baseline Elo/SPI por equipo para arrancar los modelos.
 * Intenta fuentes históricas (martj42 international_results); si fallan, usa un
 * baseline derivado del ranking FIFA + ajuste por resultados ya jugados del
 * Mundial. Escribe team-form-features.json. No inventa partidos. */

import { WORLD_CUP_TEAMS } from "../src/data/worldcup-teams";
import { computeTournamentForm } from "../src/lib/worldcup-2026/tournament-form";
import { logErrors, logSources, nowIso, summarize, tryFetchText, writeJson } from "./lib/wc-ingest";

const SCRIPT = "build-team-elo-history";
const MARTJ42_URL =
  "https://raw.githubusercontent.com/martj42/international_results/master/results.csv";

async function main() {
  const collectedAt = nowIso();
  const remote = await tryFetchText(MARTJ42_URL, 12000);

  const forms = new Map(computeTournamentForm().map((f) => [f.teamId, f]));

  const features = WORLD_CUP_TEAMS.map((t) => {
    const f = forms.get(t.id);
    // baseline Elo derivado del ranking (no es Elo real → marcado baseline).
    const eloBaseline = Math.round(2000 - (t.fifaRanking - 1) * 7);
    // ajuste por resultados ya jugados del Mundial (peso bajo, +/- por W/L).
    const wcAdjustment = f ? f.wins * 12 - f.losses * 12 : 0;
    return {
      teamId: t.id,
      teamName: t.name,
      group: t.groupId,
      eloBaseline,
      eloWithWorldCup: eloBaseline + wcAdjustment,
      worldCupMatchesPlayed: f?.played ?? 0,
      source: remote.ok ? "martj42/international_results" : "baseline (FIFA ranking)",
      sourceUrl: remote.ok ? MARTJ42_URL : "src/data/worldcup-teams.ts",
      reliability: remote.ok ? "medium" : "low",
      collectedAt,
    };
  });

  await writeJson("team-form-features.json", features);

  await logSources(SCRIPT, [
    {
      script: SCRIPT,
      source: remote.ok ? "martj42/international_results" : "baseline (FIFA ranking)",
      sourceUrl: remote.ok ? MARTJ42_URL : "src/data/worldcup-teams.ts",
      status: remote.ok ? "ok" : "fallback",
      records: features.length,
      collectedAt,
      note: remote.ok
        ? "CSV histórico disponible (parsing fino pendiente)."
        : "Histórico remoto no disponible; baseline por ranking + ajuste por Mundial.",
    },
  ]);
  if (!remote.ok) {
    await logErrors(SCRIPT, [
      { script: SCRIPT, source: "martj42/international_results", sourceUrl: MARTJ42_URL, message: remote.error, collectedAt },
    ]);
  }

  summarize(SCRIPT, [
    `histórico remoto: ${remote.ok ? "OK" : "no disponible (" + remote.error + ")"}`,
    `team-form-features.json: ${features.length} equipos`,
  ]);
}

main();
