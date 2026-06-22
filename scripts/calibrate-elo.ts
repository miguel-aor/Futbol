/* =====================================================================
 * Calibrador de Elo REAL desde resultados internacionales (martj42).
 *
 *   npm run wc:calibrate          # calibra y escribe ratings + .generated.ts
 *   tsx scripts/calibrate-elo.ts --dry   # solo parsea y reporta (no escribe)
 *
 * Determinista (sin Math.random; el único Date.now es el sello generatedAt,
 * fuera de la matemática). Reusa calculateEloChange de footballModels.ts.
 * ===================================================================== */

import { promises as fs } from "node:fs";
import path from "node:path";
import { calculateEloChange } from "../src/lib/footballModels";
import { WORLD_CUP_TEAMS } from "../src/data/worldcup-teams";
import { assertAll48Covered, MARTJ42_NAME_TO_ID } from "./lib/team-aliases";
import { cleanResults, parseMartj42, type CleanResult } from "./lib/martj42";
import {
  logErrors,
  logSources,
  nowIso,
  OUT_DIR,
  readJsonSafe,
  summarize,
  tryFetchText,
  writeJson,
} from "./lib/wc-ingest";

const SCRIPT = "calibrate-elo";
const MARTJ42_URL =
  "https://raw.githubusercontent.com/martj42/international_results/master/results.csv";
const RESULTS_FILE = "international-results.json";
const RATINGS_FILE = "elo-ratings.json";
const GENERATED_TS = path.resolve(process.cwd(), "src", "data", "elo-ratings.generated.ts");

const BASE_ELO = 1500;
const HOME_ADV = 65;
const MIN_DATE = "1990-01-01"; // acota ruido antiguo; parametrizable
const SHRINK = 0.7; // 0.7 calibrado + 0.3 prior (amortigua muestras chicas)

const round1 = (x: number) => Math.round(x * 10) / 10;
const prior = (rank: number) => 2000 - (rank - 1) * 7;

interface ResultsDoc {
  generatedAt: string;
  source: string;
  sourceUrl: string;
  minDate: string;
  count: number;
  results: CleanResult[];
}

/** Carga international-results.json local; si no existe, baja martj42 y lo escribe. */
async function loadResults(): Promise<{ results: CleanResult[]; origin: string }> {
  const local = await readJsonSafe<ResultsDoc | null>(RESULTS_FILE, null);
  if (local && Array.isArray(local.results) && local.results.length > 0) {
    return { results: local.results, origin: `local:${RESULTS_FILE}` };
  }
  const remote = await tryFetchText(MARTJ42_URL, 30000);
  if (!remote.ok) {
    await logErrors(SCRIPT, [
      { script: SCRIPT, source: "martj42/international_results", sourceUrl: MARTJ42_URL, message: remote.error, collectedAt: nowIso() },
    ]);
    throw new Error(
      `No hay ${RESULTS_FILE} local y martj42 no respondió (${remote.error}). No se escribe baseline falso.`,
    );
  }
  const cleaned = cleanResults(parseMartj42(remote.text), MARTJ42_NAME_TO_ID, { minDate: MIN_DATE });
  const doc: ResultsDoc = {
    generatedAt: nowIso(),
    source: "martj42/international_results",
    sourceUrl: MARTJ42_URL,
    minDate: MIN_DATE,
    count: cleaned.length,
    results: cleaned,
  };
  await writeJson(RESULTS_FILE, doc);
  return { results: cleaned, origin: MARTJ42_URL };
}

function stdev(values: number[], mean: number): number {
  if (values.length < 2) return 1;
  const v = values.reduce((s, x) => s + (x - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(v) || 1;
}

async function writeGeneratedTs(
  ratings: Record<string, number>,
  mean: number,
  spread: number,
  generatedAt: string,
): Promise<void> {
  const entries = Object.entries(ratings)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, elo]) => `  ${id}: ${elo},`)
    .join("\n");
  const body = `// =====================================================================
// GENERADO por scripts/calibrate-elo.ts — NO editar a mano.
//
// Ratings Elo calibrados de resultados internacionales reales (martj42),
// con shrinkage ${SHRINK} calibrado + ${(1 - SHRINK).toFixed(1)} prior (ranking FIFA).
// =====================================================================

export const ELO_GENERATED_AT = ${JSON.stringify(generatedAt)};
export const ELO_MEAN = ${round1(mean)};
export const ELO_SPREAD = ${round1(spread)};

/** teamId (3 letras) → rating Elo calibrado. */
export const ELO_RATINGS: Record<string, number> = {
${entries}
};
`;
  await fs.writeFile(GENERATED_TS, body, "utf8");
}

/** Clave no ordenada (date + par de equipos) para deduplicar al fusionar. */
function matchKey(r: CleanResult): string {
  const [x, y] = [r.homeId, r.awayId].sort();
  return `${r.date}|${x}|${y}`;
}

/**
 * Fusiona resultados del Mundial en vivo (worldcup-results.json, de openfootball)
 * que NO estén ya en el histórico martj42. Determinista (re-ordena por ts).
 */
async function mergeWorldCupResults(results: CleanResult[]): Promise<number> {
  const wc = await readJsonSafe<{ results?: CleanResult[] } | null>("worldcup-results.json", null);
  if (!wc?.results?.length) return 0;
  const seen = new Set(results.map(matchKey));
  let added = 0;
  for (const r of wc.results) {
    const k = matchKey(r);
    if (!seen.has(k)) {
      results.push(r);
      seen.add(k);
      added++;
    }
  }
  if (added > 0) {
    results.sort((a, b) =>
      a.ts !== b.ts ? a.ts - b.ts : a.homeId !== b.homeId ? a.homeId.localeCompare(b.homeId) : a.awayId.localeCompare(b.awayId),
    );
  }
  return added;
}

async function main() {
  const dry = process.argv.includes("--dry");
  assertAll48Covered();

  const { results, origin } = await loadResults();
  const wcAdded = await mergeWorldCupResults(results);

  // Walk-forward: actualiza ratings cronológicamente.
  const R: Record<string, number> = {};
  const played: Record<string, number> = {};
  const lastMatch: Record<string, string> = {};
  const getR = (id: string) => (R[id] ??= BASE_ELO);

  let ghostMatches = 0;
  const ghostFreq: Record<string, number> = {};
  for (const m of results) {
    const rh = getR(m.homeId);
    const ra = getR(m.awayId);
    const resultH: 0 | 0.5 | 1 = m.homeScore > m.awayScore ? 1 : m.homeScore < m.awayScore ? 0 : 0.5;
    const ch = calculateEloChange(rh, ra, resultH, {
      k: m.importance,
      homeAdvantage: m.neutral ? 0 : HOME_ADV,
      goalDiff: m.homeScore - m.awayScore,
    });
    R[m.homeId] = ch.newRatingA;
    R[m.awayId] = ch.newRatingB;
    played[m.homeId] = (played[m.homeId] ?? 0) + 1;
    played[m.awayId] = (played[m.awayId] ?? 0) + 1;
    lastMatch[m.homeId] = m.date;
    lastMatch[m.awayId] = m.date;
    for (const id of [m.homeId, m.awayId]) {
      if (id.startsWith("ghost:")) {
        ghostMatches++;
        ghostFreq[id] = (ghostFreq[id] ?? 0) + 1;
      }
    }
  }

  const ghostIds = Object.keys(R).filter((id) => id.startsWith("ghost:"));

  if (dry) {
    const topGhosts = Object.entries(ghostFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id, n]) => `${id.replace("ghost:", "")} (${n})`);
    summarize(SCRIPT, [
      `[DRY] resultados conservados: ${results.length} (incl. ${wcAdded} del Mundial vía openfootball)`,
      `[DRY] equipos totales (reales+ghost): ${Object.keys(R).length}`,
      `[DRY] ghosts: ${ghostIds.length} (${ghostMatches} apariciones)`,
      `[DRY] top nombres ghost (revisar que NO sea ninguna de las 48):`,
      `      ${topGhosts.join(", ")}`,
    ]);
    return;
  }

  // Shrinkage de las 48 hacia el prior de ranking.
  const generatedAt = nowIso();
  const exported: Record<string, number> = {};
  const detail = WORLD_CUP_TEAMS.map((t) => {
    const raw = R[t.id] ?? BASE_ELO;
    const p = prior(t.fifaRanking);
    const elo = round1(SHRINK * raw + (1 - SHRINK) * p);
    exported[t.id] = elo;
    return {
      teamId: t.id,
      teamName: t.name,
      elo,
      eloRaw: round1(raw),
      prior: p,
      matches: played[t.id] ?? 0,
      lastMatch: lastMatch[t.id] ?? null,
    };
  }).sort((a, b) => b.elo - a.elo);

  const elos = detail.map((d) => d.elo);
  const mean = elos.reduce((s, x) => s + x, 0) / elos.length;
  const spread = stdev(elos, mean);

  await writeJson(RATINGS_FILE, {
    generatedAt,
    source: "martj42/international_results",
    params: { baseElo: BASE_ELO, homeAdv: HOME_ADV, minDate: MIN_DATE, shrink: SHRINK },
    worldCupMerged: wcAdded,
    mean: round1(mean),
    spread: round1(spread),
    count: detail.length,
    ghostCount: ghostIds.length,
    ratings: detail,
  });
  await writeGeneratedTs(exported, mean, spread, generatedAt);

  await logSources(SCRIPT, [
    {
      script: SCRIPT,
      source: "martj42/international_results",
      sourceUrl: origin,
      status: origin.startsWith("local") ? "fallback" : "ok",
      records: results.length,
      collectedAt: generatedAt,
      note: `Elo calibrado para ${detail.length} selecciones (${ghostIds.length} ghosts).`,
    },
  ]);

  const top5 = detail.slice(0, 5).map((d) => `${d.teamName} ${d.elo}`);
  const bottom3 = detail.slice(-3).map((d) => `${d.teamName} ${d.elo}`);
  summarize(SCRIPT, [
    `resultados procesados: ${results.length} (desde ${MIN_DATE}; +${wcAdded} del Mundial vía openfootball)`,
    `equipos: ${detail.length} reales + ${ghostIds.length} ghosts`,
    `mean ${round1(mean)} · spread ${round1(spread)}`,
    `top: ${top5.join(", ")}`,
    `cola: ${bottom3.join(", ")}`,
    `→ ${path.join(OUT_DIR, RATINGS_FILE)} + src/data/elo-ratings.generated.ts`,
  ]);
}

main().catch((e) => {
  console.error(`[${SCRIPT}]`, e instanceof Error ? e.message : e);
  process.exit(1);
});
