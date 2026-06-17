import Link from "next/link";
import type { OpportunityView } from "@/lib/data-access";
import { ConfidenceBadge, DataSourceBadge, EdgeBadge, ProbabilityBadge } from "./badges";
import { MARKET_BY_KEY } from "@/data/markets";
import { EmptyState } from "./primitives";
import { formatDateTime, formatOdds } from "@/lib/format";

export function OpportunityTable({ opportunities }: { opportunities: OpportunityView[] }) {
  if (opportunities.length === 0) {
    return <EmptyState title="Sin oportunidades" message="Ajusta los filtros para ver mas picks." icon="🔍" />;
  }

  return (
    <>
      {/* Tabla en desktop */}
      <div className="card hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-base-700/60 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Partido</th>
              <th className="px-3 py-3 font-medium">Mercado / Pick</th>
              <th className="px-3 py-3 font-medium">Prob.</th>
              <th className="px-3 py-3 font-medium">Justa</th>
              <th className="px-3 py-3 font-medium">Mercado</th>
              <th className="px-3 py-3 font-medium">Edge</th>
              <th className="px-3 py-3 font-medium">Conf.</th>
              <th className="px-3 py-3 font-medium">Fuente</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o) => (
              <tr key={o.id} className="border-b border-base-800/50 last:border-0 hover:bg-base-800/40">
                <td className="px-4 py-3">
                  {o.match ? (
                    <Link href={`/matches/${o.match.id}`} className="hover:text-brand-400">
                      <div className="font-medium text-slate-100">
                        {o.match.home.code} vs {o.match.away.code}
                      </div>
                      <div className="text-xs text-slate-500">{formatDateTime(o.match.kickoff)}</div>
                    </Link>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium text-slate-100">{o.pick}</div>
                  <div className="text-xs text-slate-500">{MARKET_BY_KEY[o.marketKey]?.label ?? o.marketKey}</div>
                </td>
                <td className="px-3 py-3"><ProbabilityBadge probability={o.modelProbability} /></td>
                <td className="px-3 py-3 text-slate-300">{formatOdds(o.fairOdds)}</td>
                <td className="px-3 py-3 text-slate-300">{formatOdds(o.marketOdds)}</td>
                <td className="px-3 py-3"><EdgeBadge edge={o.edge} /></td>
                <td className="px-3 py-3"><ConfidenceBadge confidence={o.confidence} /></td>
                <td className="px-3 py-3"><DataSourceBadge source={o.source} updatedAt={o.updatedAt} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid de cards en mobile/tablet */}
      <div className="grid gap-3 lg:hidden">
        {opportunities.map((o) => (
          <div key={o.id} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">
                {o.match ? `${o.match.home.code} vs ${o.match.away.code}` : "—"}
              </span>
              <EdgeBadge edge={o.edge} />
            </div>
            <div className="mt-1 font-semibold text-slate-100">{o.pick}</div>
            <div className="text-xs text-slate-500">{MARKET_BY_KEY[o.marketKey]?.label ?? o.marketKey}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ProbabilityBadge probability={o.modelProbability} />
              <ConfidenceBadge confidence={o.confidence} />
              <span className="chip bg-base-700/60 text-slate-300">Justa {formatOdds(o.fairOdds)}</span>
              <span className="chip bg-base-700/60 text-slate-300">Mkt {formatOdds(o.marketOdds)}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{o.reason}</p>
            <div className="mt-2 flex justify-end">
              <DataSourceBadge source={o.source} updatedAt={o.updatedAt} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
