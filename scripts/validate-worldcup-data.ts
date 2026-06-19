/* Validación final del pipeline. Revisa coherencia de los JSON generados y
 * deja un resumen en sources-log.json + cualquier problema en errors.json.
 * No corrige datos: solo reporta. */

import { logErrors, logSources, nowIso, readJsonSafe, summarize } from "./lib/wc-ingest";

const SCRIPT = "validate-worldcup-data";

interface Match { id: string; status: string; homeScore: number | null; awayScore: number | null }
interface Form { teamId: string; played: number; goalsFor: number; goalsAgainst: number; points: number }
interface Feature { teamId: string; blendedAttack: number; matchesPlayedWC: number; weights: { currentWorldCup: number } }

async function main() {
  const collectedAt = nowIso();
  const issues: string[] = [];

  const matches = await readJsonSafe<Match[]>("matches.json", []);
  const forms = await readJsonSafe<Form[]>("team-current-tournament-form.json", []);
  const features = await readJsonSafe<Feature[]>("prediction-features.json", []);

  if (matches.length === 0) issues.push("matches.json vacío.");
  if (forms.length === 0) issues.push("team-current-tournament-form.json vacío.");
  if (features.length === 0) issues.push("prediction-features.json vacío.");

  // Coherencia: partidos 'played' deben tener ambos marcadores.
  const badPlayed = matches.filter((m) => m.status === "played" && (m.homeScore == null || m.awayScore == null));
  if (badPlayed.length) issues.push(`${badPlayed.length} partidos 'played' sin marcador completo.`);

  // Coherencia: equipos con peso WC alto deben tener 2+ partidos.
  const badWeight = features.filter((f) => f.weights.currentWorldCup >= 0.65 && f.matchesPlayedWC < 2);
  if (badWeight.length) issues.push(`${badWeight.length} equipos con peso WC alto y <2 partidos.`);

  const played = matches.filter((m) => m.status === "played").length;
  const teamsWithMatches = forms.filter((f) => f.played > 0).length;

  await logSources(SCRIPT, [
    {
      script: SCRIPT,
      source: "validation",
      sourceUrl: null,
      status: issues.length ? "fallback" : "ok",
      records: matches.length,
      collectedAt,
      note: `partidos=${matches.length} (jugados=${played}) · equipos con partidos=${teamsWithMatches} · features=${features.length} · problemas=${issues.length}`,
    },
  ]);

  await logErrors(
    SCRIPT,
    issues.map((message) => ({ script: SCRIPT, source: "validation", sourceUrl: null, message, collectedAt })),
  );

  summarize(SCRIPT, [
    `partidos: ${matches.length} (jugados ${played})`,
    `equipos con partidos: ${teamsWithMatches}`,
    `features: ${features.length}`,
    issues.length ? `PROBLEMAS: ${issues.join(" | ")}` : "sin problemas de coherencia",
  ]);
}

main();
