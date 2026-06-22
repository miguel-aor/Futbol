/* =====================================================================
 * Backtest walk-forward, OUT-OF-SAMPLE del modelo Elo→Dixon-Coles.
 *
 *   npm run wc:backtest
 *
 * Cada partido se predice con ratings construidos SOLO con partidos previos
 * (sin look-ahead), luego se actualiza el Elo. Reusa predictFromElo de
 * src/lib/prediction/elo.ts → el número reportado ES la matemática de la app.
 * Scoring propio: RPS (primario), log-loss, Brier, accuracy, reliability+ECE,
 * y baselines (always-home, mayor-Elo, volado). Determinista.
 * ===================================================================== */

import path from "node:path";
import { calculateEloChange } from "../src/lib/footballModels";
import { DC_RHO, ELO_HOME_ADV, predictFromElo } from "../src/lib/prediction/elo";
import type { CleanResult } from "./lib/martj42";
import { nowIso, OUT_DIR, readJsonSafe, summarize, writeJson } from "./lib/wc-ingest";

const SCRIPT = "backtest";
const RESULTS_FILE = "international-results.json";
const OUT_FILE = "model-backtest.json";
const BASE_ELO = 1500;
const BURN_IN = 150;
const BINS = 10;

const pct = (x: number) => (x * 100).toFixed(1) + "%";

interface ResultsDoc {
  results: CleanResult[];
}

async function main() {
  const doc = await readJsonSafe<ResultsDoc | null>(RESULTS_FILE, null);
  if (!doc || !Array.isArray(doc.results) || doc.results.length === 0) {
    throw new Error(`Falta ${RESULTS_FILE}. Corre primero: npm run wc:calibrate`);
  }
  const matches = doc.results;

  const R: Record<string, number> = {};
  const getR = (id: string) => (R[id] ??= BASE_ELO);

  let n = 0;
  let hit = 0;
  let brier = 0;
  let logloss = 0;
  let rps = 0;
  let rpsU = 0;
  let favN = 0;
  let favHit = 0;
  let baseHome = 0;
  let baseElo = 0;
  let eH = 0;
  let eD = 0;
  let eA = 0;
  const calib = Array.from({ length: BINS }, () => ({ sumP: 0, sumY: 0, n: 0 }));

  const rps3 = (p: number[], y: number[]) =>
    0.5 * ((p[0] - y[0]) ** 2 + (p[0] + p[1] - (y[0] + y[1])) ** 2);

  let i = 0;
  for (const m of matches) {
    const rh = getR(m.homeId);
    const ra = getR(m.awayId);

    if (i >= BURN_IN) {
      const pr = predictFromElo(rh, ra, { neutral: m.neutral, rho: DC_RHO });
      const probs = [pr.homeWin, pr.draw, pr.awayWin];
      const actual = m.homeScore > m.awayScore ? 0 : m.homeScore < m.awayScore ? 2 : 1;
      const y = [actual === 0 ? 1 : 0, actual === 1 ? 1 : 0, actual === 2 ? 1 : 0];

      const pred = probs.indexOf(Math.max(...probs));
      if (pred === actual) hit++;
      brier += (probs[0] - y[0]) ** 2 + (probs[1] - y[1]) ** 2 + (probs[2] - y[2]) ** 2;
      logloss += -Math.log(Math.max(1e-15, probs[actual]));
      rps += rps3(probs, y);
      rpsU += rps3([1 / 3, 1 / 3, 1 / 3], y);
      for (let k = 0; k < 3; k++) {
        const b = Math.min(BINS - 1, Math.floor(probs[k] * BINS));
        calib[b].sumP += probs[k];
        calib[b].sumY += y[k];
        calib[b].n++;
      }
      if (Math.max(...probs) >= 0.5) {
        favN++;
        if (pred === actual) favHit++;
      }
      if (actual === 0) baseHome++;
      const higherElo = rh + (m.neutral ? 0 : ELO_HOME_ADV) >= ra ? 0 : 2;
      if (higherElo === actual) baseElo++;
      if (actual === 0) eH++;
      else if (actual === 1) eD++;
      else eA++;
      n++;
    }

    const resultH: 0 | 0.5 | 1 = m.homeScore > m.awayScore ? 1 : m.homeScore < m.awayScore ? 0 : 0.5;
    const ch = calculateEloChange(rh, ra, resultH, {
      k: m.importance,
      homeAdvantage: m.neutral ? 0 : ELO_HOME_ADV,
      goalDiff: m.homeScore - m.awayScore,
    });
    R[m.homeId] = ch.newRatingA;
    R[m.awayId] = ch.newRatingB;
    i++;
  }

  const ece =
    calib.reduce((s, b) => s + (b.n ? Math.abs(b.sumP / b.n - b.sumY / b.n) * b.n : 0), 0) / (3 * n);

  const report = {
    generatedAt: nowIso(),
    method:
      "Walk-forward out-of-sample: cada partido predicho con ratings solo de partidos previos; Elo actualizado después. Burn-in omitido.",
    totalMatches: matches.length,
    evaluated: n,
    burnIn: BURN_IN,
    params: { rho: DC_RHO, homeAdv: ELO_HOME_ADV, baseElo: BASE_ELO },
    outcomeSplit: { home: +(eH / n).toFixed(4), draw: +(eD / n).toFixed(4), away: +(eA / n).toFixed(4) },
    model: {
      accuracy: +(hit / n).toFixed(4),
      favouriteAccuracy: +(favHit / favN).toFixed(4),
      favouriteCount: favN,
      brier: +(brier / n).toFixed(4),
      logloss: +(logloss / n).toFixed(4),
      rps: +(rps / n).toFixed(4),
      ece: +ece.toFixed(4),
    },
    baselines: {
      alwaysHome: +(baseHome / n).toFixed(4),
      higherElo: +(baseElo / n).toFixed(4),
      coinFlipRps: +(rpsU / n).toFixed(4),
      coinFlipLogloss: +(-Math.log(1 / 3)).toFixed(4),
      coinFlipBrier: +(2 * (1 / 3) ** 2 + (1 - 1 / 3) ** 2).toFixed(4),
    },
    reliability: calib.map((b, k) => ({
      range: [k / 10, (k + 1) / 10],
      n: b.n,
      avgPred: b.n ? +(b.sumP / b.n).toFixed(4) : null,
      obsFreq: b.n ? +(b.sumY / b.n).toFixed(4) : null,
    })),
  };

  await writeJson(OUT_FILE, report);

  summarize(SCRIPT, [
    `evaluados: ${n} de ${matches.length} (burn-in ${BURN_IN})`,
    `split real: local ${pct(eH / n)} · empate ${pct(eD / n)} · visita ${pct(eA / n)}`,
    `MODELO  accuracy ${pct(hit / n)} · fav(p≥50%) ${pct(favHit / favN)}`,
    `        RPS ${(rps / n).toFixed(4)} · log-loss ${(logloss / n).toFixed(3)} · Brier ${(brier / n).toFixed(3)} · ECE ${(ece * 100).toFixed(1)}%`,
    `BASELINE always-home ${pct(baseHome / n)} · mayor-Elo ${pct(baseElo / n)} · volado RPS ${(rpsU / n).toFixed(4)}`,
    `→ ${path.join(OUT_DIR, OUT_FILE)}`,
  ]);
}

main().catch((e) => {
  console.error(`[${SCRIPT}]`, e instanceof Error ? e.message : e);
  process.exit(1);
});
