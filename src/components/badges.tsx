import type { ConfidenceLabel, DataSource, Recommendation } from "@/lib/data-providers/types";
import { SOURCE_LABELS, formatEdge, formatPercent } from "@/lib/format";

export function ProbabilityBadge({ probability }: { probability: number }) {
  return (
    <span className="chip bg-base-700/70 text-slate-200" title="Probabilidad estimada por el modelo">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
      {formatPercent(probability)}
    </span>
  );
}

export function EdgeBadge({ edge }: { edge: number }) {
  const cls =
    edge >= 0.06
      ? "bg-edge-pos/15 text-edge-pos"
      : edge >= 0
        ? "bg-edge-mid/15 text-edge-mid"
        : "bg-edge-neg/15 text-edge-neg";
  return (
    <span className={`chip font-semibold ${cls}`} title="Edge = valor esperado vs cuota de mercado mock">
      {formatEdge(edge)}
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: ConfidenceLabel }) {
  const map: Record<ConfidenceLabel, string> = {
    alta: "bg-edge-pos/15 text-edge-pos",
    media: "bg-edge-mid/15 text-edge-mid",
    baja: "bg-base-700/70 text-slate-300",
  };
  return <span className={`chip ${map[confidence]}`}>Conf. {confidence}</span>;
}

export function RecommendationBadge({ recommendation }: { recommendation: Recommendation }) {
  const map: Record<Recommendation, string> = {
    buena: "bg-edge-pos/15 text-edge-pos",
    neutral: "bg-base-700/70 text-slate-300",
    evitar: "bg-edge-neg/15 text-edge-neg",
  };
  return <span className={`chip capitalize ${map[recommendation]}`}>{recommendation}</span>;
}

export function DataSourceBadge({ source, updatedAt }: { source: DataSource; updatedAt?: string }) {
  const dot: Record<DataSource, string> = {
    mock: "bg-sky-400",
    manual: "bg-amber-400",
    "365scores": "bg-fuchsia-400",
  };
  return (
    <span
      className="chip border border-base-700 bg-base-900/80 text-slate-300"
      title={updatedAt ? `Actualizado: ${updatedAt}` : "Fuente de datos"}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[source]}`} />
      {SOURCE_LABELS[source] ?? source}
    </span>
  );
}
