/* Emite data/worldcup-2026/match-events.json desde el módulo canónico de
 * eventos reales (goles y tarjetas verificados en Wikipedia/ESPN). Tiros y
 * asistencias por jugador no se publican → quedan null (nunca 0/invento). */

import { WORLD_CUP_2026_EVENTS } from "../src/data/worldcup2026Events";
import { logSources, nowIso, summarize, writeJson } from "./lib/wc-ingest";

const SCRIPT = "build-match-events";

async function main() {
  const collectedAt = nowIso();
  await writeJson("match-events.json", WORLD_CUP_2026_EVENTS);

  const goals = WORLD_CUP_2026_EVENTS.reduce((s, m) => s + m.goals.length, 0);
  const cards = WORLD_CUP_2026_EVENTS.reduce((s, m) => s + m.cards.length, 0);

  await logSources(SCRIPT, [
    {
      script: SCRIPT,
      source: "Wikipedia / ESPN (verificado)",
      sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_A",
      status: "ok",
      records: WORLD_CUP_2026_EVENTS.length,
      collectedAt,
      note: `${goals} goles y ${cards} tarjetas reales (J2 grupos A/B). Tiros/asistencias por jugador = null (no publicados).`,
    },
  ]);

  summarize(SCRIPT, [
    `match-events.json: ${WORLD_CUP_2026_EVENTS.length} partidos`,
    `goles: ${goals} · tarjetas: ${cards}`,
  ]);
}

main();
