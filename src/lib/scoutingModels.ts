// =====================================================================
// scoutingModels.ts — modelos de scouting estadístico.
//
// Funciones puras para puntuar, comparar y filtrar jugadores. Combinan
// producción por 90', xG/xA, métricas defensivas y rating. El objetivo no
// es reemplazar el análisis de video, sino reducir la lista inicial.
// =====================================================================

import type {
  MetricAvailability,
  MetricSource,
  PlayerRiskReport,
  Position,
  RiskLevel,
  ScoutingFilters,
  ScoutingPlayer,
  SimilarPlayerResult,
} from "@/lib/analytics/types";

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Normaliza una métrica acumulada a su tasa por 90 minutos. */
export function normalizePer90(value: number, minutes: number): number {
  if (minutes <= 0) return 0;
  return (value / minutes) * 90;
}

/** Etiqueta legible de la fuente, incluyendo el caso "Fallback". */
export function getMetricSourceLabel(source: MetricSource): string {
  if (source === "365Scores") return "Source: 365Scores";
  if (source === "Demo") return "Demo data";
  if (source === "Fallback") return "Source: Fallback";
  return `Source: ${source} (fallback)`;
}

/**
 * Valida si una métrica está disponible en 365Scores y, si no, devuelve la
 * fuente de fallback recomendada. Útil para los avisos de la UI.
 */
export function validateMetricAvailability(
  metric: string,
  availability: MetricAvailability[],
): MetricAvailability {
  const found = availability.find(
    (m) => m.metric.toLowerCase() === metric.toLowerCase(),
  );
  return (
    found ?? {
      metric,
      available365: false,
      fallbackSource: "Fallback",
      note: "Disponibilidad desconocida; usar fuente de fallback.",
    }
  );
}

// --------------------------------------------------------------------- //
// Percentiles por posición
// --------------------------------------------------------------------- //

/**
 * Percentil (0-100) del valor de un jugador frente a su pool de la misma
 * posición. Permite comparar "manzanas con manzanas".
 */
export function calculatePercentileByPosition(
  value: number,
  pool: ScoutingPlayer[],
  position: Position,
  selector: (p: ScoutingPlayer) => number,
): number {
  const peers = pool.filter((p) => p.position === position);
  if (peers.length <= 1) return 50;
  const below = peers.filter((p) => selector(p) < value).length;
  return Math.round((below / (peers.length - 1)) * 100);
}

// --------------------------------------------------------------------- //
// Scouting score
// --------------------------------------------------------------------- //

/** Pesos por bloque (ofensivo/defensivo/portero) según la posición. */
function positionWeights(position: Position): {
  off: number;
  def: number;
  gk: number;
} {
  switch (position) {
    case "FW":
      return { off: 0.8, def: 0.2, gk: 0 };
    case "MF":
      return { off: 0.55, def: 0.45, gk: 0 };
    case "DF":
      return { off: 0.3, def: 0.7, gk: 0 };
    case "GK":
      return { off: 0, def: 0.2, gk: 0.8 };
  }
}

/**
 * Score de scouting 0-100. Combina producción ofensiva por 90 (goles, xG,
 * asistencias, xA), aporte defensivo por 90 (entradas, intercepciones) y el
 * rating 365, ponderados por la posición.
 */
export function calculateScoutingScore(p: ScoutingPlayer): number {
  const w = positionWeights(p.position);
  const goals90 = normalizePer90(p.goals, p.minutes);
  const xg90 = normalizePer90(p.xG, p.minutes);
  const xa90 = normalizePer90(p.xA, p.minutes);
  const tkl90 = normalizePer90(p.tacklesWon, p.minutes);
  const int90 = normalizePer90(p.interceptions, p.minutes);

  // Sub-scores 0-100 con escalas de referencia razonables.
  const offensive = clamp(
    (goals90 / 0.9 + xg90 / 0.8 + xa90 / 0.6) * (100 / 3),
    0,
    100,
  );
  const defensive = clamp((tkl90 / 4 + int90 / 4) * (100 / 2), 0, 100);
  const goalkeeping = clamp((p.savesPerGame / 5) * 100, 0, 100);
  const ratingScore = clamp((p.rating365 - 5.5) * (100 / 4), 0, 100); // 5.5→0, 9.5→100

  const composite =
    w.off * offensive + w.def * defensive + w.gk * goalkeeping;
  return Math.round(0.7 * composite + 0.3 * ratingScore);
}

// --------------------------------------------------------------------- //
// Similitud entre jugadores
// --------------------------------------------------------------------- //

/** Vector de características normalizado (por 90 + rating). */
function featureVector(p: ScoutingPlayer): number[] {
  return [
    normalizePer90(p.goals, p.minutes) / 1.0,
    normalizePer90(p.assists, p.minutes) / 0.7,
    normalizePer90(p.xG, p.minutes) / 0.9,
    normalizePer90(p.xA, p.minutes) / 0.6,
    normalizePer90(p.tacklesWon, p.minutes) / 4,
    normalizePer90(p.interceptions, p.minutes) / 4,
    normalizePer90(p.progressivePasses, p.minutes) / 10,
    p.rating365 / 10,
  ];
}

/**
 * Similarity score 0-100 entre dos jugadores. Distancia euclidiana sobre el
 * vector de características; penaliza diferencia de posición. 100 = idénticos.
 */
export function calculateSimilarityScore(
  a: ScoutingPlayer,
  b: ScoutingPlayer,
): number {
  const va = featureVector(a);
  const vb = featureVector(b);
  let sumSq = 0;
  for (let i = 0; i < va.length; i++) sumSq += (va[i] - vb[i]) ** 2;
  const dist = Math.sqrt(sumSq);
  const positionPenalty = a.position === b.position ? 0 : 0.6;
  const score = 100 * Math.exp(-(dist + positionPenalty));
  return Math.round(clamp(score, 0, 100));
}

/** Describe las 2-3 mayores diferencias entre dos jugadores. */
function describeDifferences(a: ScoutingPlayer, b: ScoutingPlayer): string[] {
  const diffs: Array<{ label: string; delta: number }> = [
    {
      label: "goles/90",
      delta:
        normalizePer90(a.goals, a.minutes) - normalizePer90(b.goals, b.minutes),
    },
    {
      label: "asist./90",
      delta:
        normalizePer90(a.assists, a.minutes) -
        normalizePer90(b.assists, b.minutes),
    },
    {
      label: "entradas/90",
      delta:
        normalizePer90(a.tacklesWon, a.minutes) -
        normalizePer90(b.tacklesWon, b.minutes),
    },
    { label: "rating 365", delta: a.rating365 - b.rating365 },
    { label: "edad", delta: a.age - b.age },
  ];
  return diffs
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
    .slice(0, 3)
    .map(
      (d) =>
        `${d.delta >= 0 ? "+" : ""}${d.delta.toFixed(2)} ${d.label} vs base`,
    );
}

/** Top-N jugadores más parecidos al jugador base. */
export function findSimilarPlayers(
  base: ScoutingPlayer,
  pool: ScoutingPlayer[],
  topN = 5,
): SimilarPlayerResult[] {
  return pool
    .filter((p) => p.id !== base.id)
    .map((p) => ({
      basePlayerId: base.id,
      playerId: p.id,
      name: p.name,
      team: p.team,
      league: p.league,
      position: p.position,
      age: p.age,
      similarityScore: calculateSimilarityScore(base, p),
      keyDifferences: describeDifferences(p, base),
      source: p.source,
      reliability: p.reliability,
    }))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topN);
}

// --------------------------------------------------------------------- //
// Hidden gems
// --------------------------------------------------------------------- //

/**
 * Score de "joya escondida" 0-100. Premia alto rendimiento por 90 + juventud
 * + baja exposición/valor; penaliza muestras pequeñas de minutos.
 */
export function calculateHiddenGemScore(p: ScoutingPlayer): number {
  const performance = calculateScoutingScore(p); // 0-100
  const youthBonus = clamp((24 - p.age) * 6, 0, 30); // <24 suma hasta 30
  const obscurityBonus = clamp((60 - p.popularity) * 0.4, 0, 24); // poco conocido
  const samplePenalty = p.minutes < 900 ? 18 : p.minutes < 1500 ? 8 : 0;
  return Math.round(
    clamp(performance * 0.6 + youthBonus + obscurityBonus - samplePenalty, 0, 100),
  );
}

// --------------------------------------------------------------------- //
// Riesgo
// --------------------------------------------------------------------- //

function levelFromScore(score: number): RiskLevel {
  if (score >= 66) return "high";
  if (score >= 33) return "medium";
  return "low";
}

/** Score de riesgo agregado 0-100 (más alto = más riesgo). */
export function calculatePlayerRiskScore(p: ScoutingPlayer): number {
  const goals90 = normalizePer90(p.goals, p.minutes);
  const xg90 = normalizePer90(p.xG, p.minutes);
  const minutesRisk = p.minutes < 900 ? 80 : p.minutes < 1500 ? 45 : 15;
  // Sobreperformance: anota muy por encima de su xG → poco sostenible.
  const overperf = clamp((goals90 - xg90) * 120, 0, 80);
  const ageRisk = p.age >= 31 ? clamp((p.age - 30) * 15, 0, 70) : 10;
  const composite = minutesRisk * 0.4 + overperf * 0.35 + ageRisk * 0.25;
  return Math.round(clamp(composite, 0, 100));
}

/** Reporte de riesgo completo por jugador, con explicación legible. */
export function buildPlayerRiskReport(
  p: ScoutingPlayer,
  opts: { weakLeague?: boolean; recentTransfer?: boolean } = {},
): PlayerRiskReport {
  const goals90 = normalizePer90(p.goals, p.minutes);
  const xg90 = normalizePer90(p.xG, p.minutes);

  const minutesRisk: RiskLevel =
    p.minutes < 900 ? "high" : p.minutes < 1500 ? "medium" : "low";
  const overperformanceRisk: RiskLevel =
    goals90 - xg90 > 0.25 ? "high" : goals90 - xg90 > 0.1 ? "medium" : "low";
  const injuryRisk: RiskLevel = "low"; // sólo si una fuente confiable lo muestra
  const leagueAdjustmentRisk: RiskLevel = opts.weakLeague ? "medium" : "low";
  const consistencyRisk: RiskLevel =
    p.minutes < 1200 ? "medium" : p.rating365 < 6.8 ? "medium" : "low";

  const overallScore = calculatePlayerRiskScore(p);
  const overallRisk = levelFromScore(overallScore);

  const parts: string[] = [];
  if (minutesRisk !== "low")
    parts.push("la muestra de minutos es baja");
  if (overperformanceRisk !== "low")
    parts.push("sus goles están por encima de su xG");
  if (opts.weakLeague) parts.push("juega en una liga de menor competitividad");
  if (opts.recentTransfer) parts.push("cambió de club recientemente");
  const tail = parts.length
    ? `Atención: ${parts.join("; ")}.`
    : "Sin señales de riesgo relevantes en la muestra disponible.";
  const explanation =
    overallRisk === "low"
      ? `Riesgo bajo: perfil estable. ${tail}`
      : overallRisk === "medium"
        ? `Riesgo medio: buen rendimiento por 90', pero ${tail}`
        : `Riesgo alto: ${tail}`;

  return {
    playerId: p.id,
    name: p.name,
    overallRisk,
    minutesRisk,
    overperformanceRisk,
    injuryRisk,
    leagueAdjustmentRisk,
    consistencyRisk,
    explanation,
    source: p.source,
    reliability: p.reliability,
  };
}

// --------------------------------------------------------------------- //
// Recruitment fit
// --------------------------------------------------------------------- //

export interface RecruitmentFit {
  overallScore: number;
  offensiveScore: number;
  defensiveScore: number;
  riskScore: number;
  comment: string;
}

/** Encaje de reclutamiento con comentario automático. */
export function calculateRecruitmentFit(p: ScoutingPlayer): RecruitmentFit {
  const offensiveScore = Math.round(
    clamp(
      (normalizePer90(p.goals, p.minutes) / 0.9 +
        normalizePer90(p.xG + p.xA, p.minutes) / 1.2) *
        50,
      0,
      100,
    ),
  );
  const defensiveScore = Math.round(
    clamp(
      (normalizePer90(p.tacklesWon, p.minutes) / 4 +
        normalizePer90(p.interceptions, p.minutes) / 4) *
        50,
      0,
      100,
    ),
  );
  const riskScore = calculatePlayerRiskScore(p);
  const overallScore = calculateScoutingScore(p);

  const ageNote =
    p.age <= 23
      ? "edad favorable"
      : p.age <= 28
        ? "edad de plenitud"
        : "edad avanzada";
  const profile =
    offensiveScore >= defensiveScore
      ? "alto impacto ofensivo"
      : "perfil defensivo sólido";
  const comment = `Jugador recomendado por ${profile}, buena producción por 90 minutos y ${ageNote}. Requiere revisión de video antes de decisión final.`;

  return { overallScore, offensiveScore, defensiveScore, riskScore, comment };
}

// --------------------------------------------------------------------- //
// Filtrado y ranking
// --------------------------------------------------------------------- //

/** Aplica filtros y ordena por scouting score (descendente). */
export function rankScoutingPlayers(
  players: ScoutingPlayer[],
  filters: ScoutingFilters,
): ScoutingPlayer[] {
  const q = filters.query.trim().toLowerCase();
  return players
    .filter((p) => {
      if (q && !`${p.name} ${p.team}`.toLowerCase().includes(q)) return false;
      if (filters.league && p.league !== filters.league) return false;
      if (filters.position !== "ALL" && p.position !== filters.position)
        return false;
      if (p.age > filters.maxAge) return false;
      if (p.minutes < filters.minMinutes) return false;
      if (p.rating365 < filters.minRating) return false;
      if (filters.risk !== "ALL") {
        if (levelFromScore(p.riskScore) !== filters.risk) return false;
      }
      return true;
    })
    .sort((a, b) => b.scoutingScore - a.scoutingScore);
}

// --------------------------------------------------------------------- //
// Comparación lado a lado
// --------------------------------------------------------------------- //

export interface ComparisonRow {
  label: string;
  a: number;
  b: number;
  /** true si "más alto es mejor" (para colorear al ganador). */
  higherIsBetter: boolean;
}

/** Filas de comparación de dos jugadores (perfil ofensivo/defensivo/riesgo). */
export function calculatePlayerComparison(
  a: ScoutingPlayer,
  b: ScoutingPlayer,
): ComparisonRow[] {
  return [
    { label: "Edad", a: a.age, b: b.age, higherIsBetter: false },
    {
      label: "Goles/90",
      a: +normalizePer90(a.goals, a.minutes).toFixed(2),
      b: +normalizePer90(b.goals, b.minutes).toFixed(2),
      higherIsBetter: true,
    },
    {
      label: "Asist./90",
      a: +normalizePer90(a.assists, a.minutes).toFixed(2),
      b: +normalizePer90(b.assists, b.minutes).toFixed(2),
      higherIsBetter: true,
    },
    {
      label: "xG/90",
      a: +normalizePer90(a.xG, a.minutes).toFixed(2),
      b: +normalizePer90(b.xG, b.minutes).toFixed(2),
      higherIsBetter: true,
    },
    {
      label: "xA/90",
      a: +normalizePer90(a.xA, a.minutes).toFixed(2),
      b: +normalizePer90(b.xA, b.minutes).toFixed(2),
      higherIsBetter: true,
    },
    {
      label: "Entradas/90",
      a: +normalizePer90(a.tacklesWon, a.minutes).toFixed(2),
      b: +normalizePer90(b.tacklesWon, b.minutes).toFixed(2),
      higherIsBetter: true,
    },
    {
      label: "Intercep./90",
      a: +normalizePer90(a.interceptions, a.minutes).toFixed(2),
      b: +normalizePer90(b.interceptions, b.minutes).toFixed(2),
      higherIsBetter: true,
    },
    { label: "Rating 365", a: a.rating365, b: b.rating365, higherIsBetter: true },
    {
      label: "Scouting score",
      a: a.scoutingScore,
      b: b.scoutingScore,
      higherIsBetter: true,
    },
    {
      label: "Riesgo",
      a: a.riskScore,
      b: b.riskScore,
      higherIsBetter: false,
    },
  ];
}
