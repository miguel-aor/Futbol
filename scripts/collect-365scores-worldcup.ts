/* Capa 3 (validación): 365Scores World Cup 2026.
 *
 * 365Scores no expone una API pública verificada en este entorno. El script
 * NO afirma que un dato viene de 365Scores si no se verificó: registra la
 * fuente como no disponible y deja la validación pendiente. Cuando se conecte,
 * validará goals, xG+assists, ratings, tackles/intercep. por partido, tarjetas,
 * saves y clean sheets contra player-aggregate-stats / team-current-form. */

import { logErrors, logSources, nowIso, readJsonSafe, summarize } from "./lib/wc-ingest";

const SCRIPT = "collect-365scores-worldcup";
const VALIDATE = [
  "goals", "xG+assists", "ratings", "tacklesWonPerGame",
  "interceptionsPerGame", "cards", "saves", "cleanSheets",
];

interface TeamForm { teamId: string; goalsFor: number; goalsAgainst: number }

async function main() {
  const collectedAt = nowIso();

  // Self-check liviano sobre lo que SÍ tenemos (forma del Mundial), aunque
  // 365Scores no esté disponible para la validación cruzada real.
  const forms = await readJsonSafe<TeamForm[]>("team-current-tournament-form.json", []);
  const totalGoals = forms.reduce((s, f) => s + (f.goalsFor ?? 0), 0);

  await logSources(SCRIPT, [
    {
      script: SCRIPT,
      source: "365Scores World Cup 2026",
      sourceUrl: null,
      status: "unavailable",
      records: 0,
      collectedAt,
      note: `Sin API pública verificada. Validación pendiente de: ${VALIDATE.join(", ")}. No se marca ningún dato como 365Scores.`,
    },
  ]);
  await logErrors(SCRIPT, [
    {
      script: SCRIPT,
      source: "365Scores World Cup 2026",
      sourceUrl: null,
      message: "Fuente de validación no disponible/no verificada en este entorno.",
      collectedAt,
    },
  ]);

  summarize(SCRIPT, [
    "365Scores: no disponible (validación cruzada pendiente)",
    `self-check forma del Mundial: ${forms.length} equipos, ${totalGoals} goles a favor sumados`,
  ]);
}

main();
