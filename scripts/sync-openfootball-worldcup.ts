/* Capa 1: calendario/equipos. Intenta openfootball; si falla, usa el snapshot
 * en repo (worldcup-fixtures) como fuente verificada. Escribe matches.json y
 * jornada1.matches.json. No inventa: usa solo datos ya presentes en el repo. */

import { computeWorldCupMatches } from "../src/lib/worldcup-2026/tournament-form";
import { logErrors, logSources, nowIso, summarize, tryFetchText, writeJson } from "./lib/wc-ingest";

const SCRIPT = "sync-openfootball-worldcup";
const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

async function main() {
  const collectedAt = nowIso();
  const remote = await tryFetchText(OPENFOOTBALL_URL, 12000);

  // Fuente verificada en repo (snapshot público ESPN/Wikipedia/Milenio).
  const matches = computeWorldCupMatches();
  const jornada1 = matches.filter((m) => m.round === 1);

  await writeJson("matches.json", matches);
  await writeJson("jornada1.matches.json", jornada1);

  await logSources(SCRIPT, [
    {
      script: SCRIPT,
      source: "openfootball/worldcup",
      sourceUrl: OPENFOOTBALL_URL,
      status: remote.ok ? "ok" : "unavailable",
      records: remote.ok ? null : 0,
      collectedAt,
      note: remote.ok
        ? "Remoto disponible (no se sobrescribe el snapshot verificado)."
        : "Remoto no disponible; se usa el snapshot en repo.",
    },
    {
      script: SCRIPT,
      source: "in-repo snapshot (worldcup-fixtures)",
      sourceUrl: "src/data/worldcup-fixtures.ts",
      status: "fallback",
      records: matches.length,
      collectedAt,
      note: `Grupos A–L reales. ${jornada1.length} partidos de jornada 1.`,
    },
  ]);

  if (!remote.ok) {
    await logErrors(SCRIPT, [
      { script: SCRIPT, source: "openfootball/worldcup", sourceUrl: OPENFOOTBALL_URL, message: remote.error, collectedAt },
    ]);
  }

  summarize(SCRIPT, [
    `openfootball remoto: ${remote.ok ? "OK" : "no disponible (" + remote.error + ")"}`,
    `matches.json: ${matches.length} partidos`,
    `jornada1.matches.json: ${jornada1.length} partidos`,
  ]);
}

main();
