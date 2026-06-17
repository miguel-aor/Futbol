import type { PlayerProp } from "@/lib/data-providers/types";
import { DataSourceBadge, EdgeBadge, RecommendationBadge } from "./badges";
import { formatOdds, formatPercent } from "@/lib/format";

export function PlayerPropsTable({ props }: { props: PlayerProp[] }) {
  if (props.length === 0) {
    return <p className="text-sm text-slate-500">No hay props disponibles para este jugador.</p>;
  }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-base-700/60 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 font-medium">Prop</th>
            <th className="px-3 py-3 font-medium">HR L5</th>
            <th className="px-3 py-3 font-medium">HR L10</th>
            <th className="px-3 py-3 font-medium">HR temp.</th>
            <th className="px-3 py-3 font-medium">Prob.</th>
            <th className="px-3 py-3 font-medium">Justa</th>
            <th className="px-3 py-3 font-medium">Mercado</th>
            <th className="px-3 py-3 font-medium">Edge</th>
            <th className="px-3 py-3 font-medium">Rec.</th>
            <th className="px-3 py-3 font-medium">Fuente</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.type} className="border-b border-base-800/50 last:border-0">
              <td className="px-4 py-3 font-medium text-slate-100">{p.label}</td>
              <td className="px-3 py-3 text-slate-300">{formatPercent(p.hitRateLast5)}</td>
              <td className="px-3 py-3 text-slate-300">{formatPercent(p.hitRateLast10)}</td>
              <td className="px-3 py-3 text-slate-300">{formatPercent(p.hitRateSeason)}</td>
              <td className="px-3 py-3 font-semibold text-brand-400">{formatPercent(p.modelProbability)}</td>
              <td className="px-3 py-3 text-slate-300">{formatOdds(p.fairOdds)}</td>
              <td className="px-3 py-3 text-slate-300">{formatOdds(p.marketOdds)}</td>
              <td className="px-3 py-3"><EdgeBadge edge={p.edge} /></td>
              <td className="px-3 py-3"><RecommendationBadge recommendation={p.recommendation} /></td>
              <td className="px-3 py-3"><DataSourceBadge source={p.source} updatedAt={p.updatedAt} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
