/* Capa 2 (principal para stats de jugador): PlayerStats.Football.
 *
 * No hay un endpoint público verificado para esta fuente en este entorno. El
 * script queda LISTO para configurarse vía env (PLAYERSTATS_FOOTBALL_BASE) y,
 * mientras tanto, NO inventa datos: escribe arreglos vacíos y registra el
 * faltante en errors.json. Cuando exista la fuente, cada stat se guardará con
 * null si no aparece (nunca 0) y con sourceUrl/collectedAt. */

import { logErrors, logSources, nowIso, summarize, tryFetchText, writeJson } from "./lib/wc-ingest";

const SCRIPT = "collect-playerstats-football";
const STAT_KEYS = [
  "totalShots", "shotsOnTarget", "tackles", "passes", "keyPasses",
  "foulsCommitted", "foulsDrawn", "interceptions", "yellowCards", "redCards",
  "assists", "xG", "saves", "clearances",
];

async function main() {
  const collectedAt = nowIso();
  const base = process.env.PLAYERSTATS_FOOTBALL_BASE ?? "";

  let status: "ok" | "unavailable" = "unavailable";
  let errorMsg = "Fuente no configurada (define PLAYERSTATS_FOOTBALL_BASE).";

  if (base) {
    const res = await tryFetchText(`${base.replace(/\/$/, "")}/health`, 10000);
    if (res.ok) status = "ok";
    else errorMsg = `Fuente configurada pero inalcanzable: ${res.error}`;
  }

  // Nunca inventar: sin fuente verificada, salidas vacías (no ceros).
  const playerMatchStats: unknown[] = [];
  const playerAggregateStats: unknown[] = [];
  await writeJson("player-match-stats.json", playerMatchStats);
  await writeJson("player-aggregate-stats.json", playerAggregateStats);

  await logSources(SCRIPT, [
    {
      script: SCRIPT,
      source: "PlayerStats.Football",
      sourceUrl: base || null,
      status,
      records: 0,
      collectedAt,
      note: `Stats objetivo: ${STAT_KEYS.join(", ")}. Sin datos verificados → arreglos vacíos (null por stat al conectar, nunca 0).`,
    },
  ]);
  if (status !== "ok") {
    await logErrors(SCRIPT, [
      { script: SCRIPT, source: "PlayerStats.Football", sourceUrl: base || null, message: errorMsg, collectedAt },
    ]);
  }

  summarize(SCRIPT, [
    `estado: ${status}`,
    status === "ok" ? "fuente alcanzable (parsing pendiente)" : errorMsg,
    "salidas: player-match-stats.json=[], player-aggregate-stats.json=[]",
  ]);
}

main();
