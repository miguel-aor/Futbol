/* Construye team-current-tournament-form.json a partir de los partidos YA
 * jugados del Mundial (snapshot en repo). Stats no disponibles → null. */

import { computeTournamentForm } from "../src/lib/worldcup-2026/tournament-form";
import { logSources, nowIso, summarize, writeJson } from "./lib/wc-ingest";

const SCRIPT = "build-current-worldcup-form";

async function main() {
  const collectedAt = nowIso();
  const forms = computeTournamentForm();
  await writeJson("team-current-tournament-form.json", forms);

  const withMatches = forms.filter((f) => f.played > 0);
  await logSources(SCRIPT, [
    {
      script: SCRIPT,
      source: "Snapshot (worldcup-fixtures)",
      sourceUrl: "src/data/worldcup-fixtures.ts",
      status: "ok",
      records: forms.length,
      collectedAt,
      note: `${withMatches.length} equipos ya jugaron; stats avanzados (xG, tiros, etc.) = null (no publicados por partido).`,
    },
  ]);

  summarize(SCRIPT, [
    `equipos: ${forms.length}`,
    `con partidos jugados: ${withMatches.length}`,
    `ejemplo: ${withMatches[0]?.teamName ?? "-"} ${withMatches[0]?.goalsFor ?? 0}-${withMatches[0]?.goalsAgainst ?? 0} (forma ${withMatches[0]?.form.join("") ?? ""})`,
  ]);
}

main();
