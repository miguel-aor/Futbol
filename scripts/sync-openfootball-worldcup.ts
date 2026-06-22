/* Capa 1: calendario/equipos + RESULTADOS EN VIVO del Mundial.
 *
 * 1) matches.json / jornada1.matches.json: del snapshot verificado del repo
 *    (worldcup-fixtures). No se sobrescribe con remoto.
 * 2) worldcup-results.json: AHORA SÍ consume openfootball — parsea los partidos
 *    ya jugados (con marcador) y los normaliza al formato CleanResult que come el
 *    calibrador de Elo. Así el modelo se actualiza solo conforme avanza el torneo.
 *    openfootball es dominio público, sin key. Si falla, no rompe (los demás
 *    pasos siguen). Equipos: nombres en inglés → mismo alias map que martj42.
 */

import { computeWorldCupMatches } from "../src/lib/worldcup-2026/tournament-form";
import { MARTJ42_NAME_TO_ID } from "./lib/team-aliases";
import { resolveTeamId, type CleanResult } from "./lib/martj42";
import {
  logErrors,
  logSources,
  nowIso,
  summarize,
  tryFetchText,
  writeJson,
} from "./lib/wc-ingest";

const SCRIPT = "sync-openfootball-worldcup";
const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

interface OFMatch {
  date: string;
  team1: string;
  team2: string;
  score?: { ft?: number[]; ht?: number[] };
  group?: string;
}
interface OFDoc {
  name?: string;
  matches?: OFMatch[];
}

/** Parsea openfootball → resultados jugados en formato CleanResult. */
function parseOpenfootball(text: string): { results: CleanResult[]; unmapped: string[] } {
  const doc = JSON.parse(text) as OFDoc;
  const results: CleanResult[] = [];
  const unmapped = new Set<string>();
  for (const m of doc.matches ?? []) {
    const ft = m.score?.ft;
    if (!Array.isArray(ft) || ft.length < 2 || ft[0] == null || ft[1] == null) continue; // sin jugar
    const homeId = resolveTeamId(m.team1, MARTJ42_NAME_TO_ID);
    const awayId = resolveTeamId(m.team2, MARTJ42_NAME_TO_ID);
    if (homeId.startsWith("ghost:")) unmapped.add(m.team1);
    if (awayId.startsWith("ghost:")) unmapped.add(m.team2);
    const ts = Math.floor(Date.parse(m.date + "T00:00:00Z") / 1000);
    if (!Number.isFinite(ts)) continue;
    results.push({
      date: m.date,
      ts,
      homeId,
      awayId,
      homeScore: ft[0],
      awayScore: ft[1],
      tournament: "FIFA World Cup",
      importance: 55,
      neutral: true, // sedes del Mundial = neutrales (decisión conservadora)
    });
  }
  results.sort((a, b) => (a.ts !== b.ts ? a.ts - b.ts : a.homeId.localeCompare(b.homeId)));
  return { results, unmapped: [...unmapped] };
}

async function main() {
  const collectedAt = nowIso();

  // (1) Snapshot verificado del repo → matches.json (comportamiento previo).
  const matches = computeWorldCupMatches();
  const jornada1 = matches.filter((m) => m.round === 1);
  await writeJson("matches.json", matches);
  await writeJson("jornada1.matches.json", jornada1);

  // (2) openfootball EN VIVO → worldcup-results.json (para el modelo).
  const remote = await tryFetchText(OPENFOOTBALL_URL, 20000);
  let playedCount = 0;
  let unmapped: string[] = [];
  if (remote.ok) {
    try {
      const parsed = parseOpenfootball(remote.text);
      playedCount = parsed.results.length;
      unmapped = parsed.unmapped;
      await writeJson("worldcup-results.json", {
        generatedAt: collectedAt,
        source: "openfootball/worldcup.json",
        sourceUrl: OPENFOOTBALL_URL,
        count: playedCount,
        results: parsed.results,
      });
    } catch (e) {
      await logErrors(SCRIPT, [
        { script: SCRIPT, source: "openfootball/worldcup.json", sourceUrl: OPENFOOTBALL_URL, message: `parse: ${e instanceof Error ? e.message : e}`, collectedAt },
      ]);
    }
  } else {
    await logErrors(SCRIPT, [
      { script: SCRIPT, source: "openfootball/worldcup.json", sourceUrl: OPENFOOTBALL_URL, message: remote.error, collectedAt },
    ]);
  }
  if (unmapped.length > 0) {
    await logErrors(SCRIPT, [
      { script: SCRIPT, source: "openfootball name-mapping", sourceUrl: null, message: `nombres sin mapear (quedaron ghost): ${unmapped.join(", ")}`, collectedAt },
    ]);
  }

  await logSources(SCRIPT, [
    {
      script: SCRIPT,
      source: "openfootball/worldcup.json",
      sourceUrl: OPENFOOTBALL_URL,
      status: remote.ok ? "ok" : "unavailable",
      records: remote.ok ? playedCount : 0,
      collectedAt,
      note: remote.ok
        ? `${playedCount} partidos jugados parseados → worldcup-results.json`
        : "Remoto no disponible; el modelo usa solo histórico martj42.",
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

  summarize(SCRIPT, [
    `openfootball: ${remote.ok ? "OK" : "no disponible (" + remote.error + ")"}`,
    `partidos jugados parseados: ${playedCount}${unmapped.length ? ` · SIN MAPEAR: ${unmapped.join(", ")}` : ""}`,
    `worldcup-results.json: ${playedCount} resultados`,
    `matches.json: ${matches.length} partidos (snapshot repo)`,
  ]);
}

main().catch((e) => {
  console.error(`[${SCRIPT}]`, e instanceof Error ? e.message : e);
  process.exit(1);
});
