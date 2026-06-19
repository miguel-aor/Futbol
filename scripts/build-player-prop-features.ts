/* Construye player-prop-features.json para props individuales (tiros, tiros a
 * puerta, tackles, tarjetas). Depende de player-aggregate-stats.json (capa
 * PlayerStats.Football). Si no hay datos, escribe [] y registra el faltante.
 * No inventa: sin stats reales, no genera features. */

import { logErrors, logSources, nowIso, readJsonSafe, summarize, writeJson } from "./lib/wc-ingest";

const SCRIPT = "build-player-prop-features";

interface AggregateStat { playerId?: string }

async function main() {
  const collectedAt = nowIso();
  const aggregates = await readJsonSafe<AggregateStat[]>("player-aggregate-stats.json", []);

  // Sin agregados reales no se pueden derivar props → salida vacía (no ceros).
  const propFeatures = aggregates.length
    ? aggregates.map((a) => ({
        playerId: a.playerId ?? null,
        // Placeholders null hasta tener stats reales (regla: null, no 0).
        shotsPer90: null,
        shotsOnTargetPer90: null,
        tacklesPer90: null,
        cardsPer90: null,
        source: "PlayerStats.Football",
        sourceUrl: null,
        collectedAt,
      }))
    : [];

  await writeJson("player-prop-features.json", propFeatures);

  await logSources(SCRIPT, [
    {
      script: SCRIPT,
      source: "derived (player-aggregate-stats)",
      sourceUrl: "data/worldcup-2026/player-aggregate-stats.json",
      status: aggregates.length ? "ok" : "skipped",
      records: propFeatures.length,
      collectedAt,
      note: aggregates.length ? "Features derivadas (valores null hasta stats reales)." : "Sin agregados de jugador; nada que derivar.",
    },
  ]);
  if (!aggregates.length) {
    await logErrors(SCRIPT, [
      {
        script: SCRIPT,
        source: "player-aggregate-stats",
        sourceUrl: "data/worldcup-2026/player-aggregate-stats.json",
        message: "Sin datos de jugador (capa PlayerStats.Football vacía).",
        collectedAt,
      },
    ]);
  }

  summarize(SCRIPT, [`agregados de jugador: ${aggregates.length}`, `player-prop-features.json: ${propFeatures.length}`]);
}

main();
