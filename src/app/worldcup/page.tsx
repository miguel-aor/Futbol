import Link from "next/link";
import { getActiveProviderMetadata } from "@/lib/data-providers/providerRegistry";
import { getWorldCupData } from "@/lib/data-access";
import { WorldCupGroupsClient } from "@/components/WorldCupClient";
import { MatchCard } from "@/components/MatchCard";
import { OpportunityTable } from "@/components/OpportunityTable";
import { DataSourceBadge } from "@/components/badges";
import { EmptyState, SectionTitle } from "@/components/primitives";
import { CalendarIcon } from "@/components/icons";
import { formatUpdatedAt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WorldCupPage() {
  const [meta, data] = await Promise.all([getActiveProviderMetadata(), getWorldCupData()]);

  // Equipos destacados: mejor ranking FIFA.
  const featured = data.groups
    .flatMap((g) => g.teams)
    .sort((a, b) => a.fifaRanking - b.fifaRanking)
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Mundial 2026</h1>
          <p className="text-sm text-slate-500">Grupos, clasificacion simulada, partidos y picks destacados.</p>
        </div>
        <DataSourceBadge source={meta.id} updatedAt={meta.lastUpdated ? formatUpdatedAt(meta.lastUpdated) : undefined} />
      </div>

      <section>
        <SectionTitle title="Equipos destacados" subtitle="Por ranking FIFA (aprox.)" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {featured.map((t) => (
            <Link key={t.id} href={`/teams/${t.id}`} className="card card-hover flex flex-col items-center gap-1 p-4 text-center">
              <span className="text-3xl">{t.flag}</span>
              <span className="text-sm font-semibold text-slate-100">{t.name}</span>
              <span className="text-xs text-slate-500">#{t.fifaRanking} · Gr. {t.groupId}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Grupos y clasificacion" subtitle="Posiciones reales tras los partidos jugados. Los 2 primeros avanzan." />
        <WorldCupGroupsClient groups={data.groups} />
      </section>

      <section>
        <SectionTitle title="Proximos partidos del Mundial" />
        {data.upcoming.length === 0 ? (
          <EmptyState title="Sin proximos partidos" icon={<CalendarIcon className="h-6 w-6" />} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.upcoming.slice(0, 9).map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>

      {data.finished.length > 0 ? (
        <section>
          <SectionTitle title="Resultados ya jugados" subtitle="Marcadores reales de la jornada 1" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.finished.slice(0, 6).map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionTitle title="Picks destacados del Mundial" />
        <OpportunityTable opportunities={data.topOpportunities} />
      </section>
    </div>
  );
}
