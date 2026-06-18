import Link from "next/link";
import { getActiveProviderMetadata } from "@/lib/data-providers/providerRegistry";
import { getWorldCupData } from "@/lib/data-access";
import { WorldCupGroupsClient } from "@/components/WorldCupClient";
import { MatchSelector } from "@/components/worldcup/MatchSelector";
import { TeamFlag } from "@/components/worldcup/TeamFlag";
import { OpportunityTable } from "@/components/OpportunityTable";
import { DataSourceBadge } from "@/components/badges";
import { SectionTitle } from "@/components/primitives";
import { TrophyIcon } from "@/components/icons";
import { formatUpdatedAt } from "@/lib/format";
import { DATA_CAPTURED_AT } from "@/data/worldcup-fixtures";

export const dynamic = "force-dynamic";

export default async function WorldCupPage() {
  const [meta, data] = await Promise.all([getActiveProviderMetadata(), getWorldCupData()]);

  // Equipos destacados: mejor ranking FIFA.
  const featured = data.groups
    .flatMap((g) => g.teams)
    .sort((a, b) => a.fifaRanking - b.fifaRanking)
    .slice(0, 6);

  const allMatches = [...data.finished, ...data.upcoming].sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const groupIds = data.groups.map((g) => g.id);

  return (
    <div className="space-y-8">
      {/* Hero estilo Mundial 2026 */}
      <section className="wc-ring overflow-hidden rounded-2xl bg-wc-card bg-wc-radial p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <span className="chip border border-wc-gold/30 bg-wc-gold/10 text-wc-gold">
              <TrophyIcon className="h-3.5 w-3.5" /> Canadá · México · EE.UU.
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              <span className="wc-gold-text">World Cup 2026</span>{" "}
              <span className="text-wc-text">Intelligence</span>
            </h1>
            <p className="mt-2 text-sm text-wc-muted">
              48 selecciones reales, convocatorias oficiales, calendario y resultados de la jornada 1 — con
              probabilidades, edge y reportes de inteligencia por partido.
            </p>
          </div>
          <DataSourceBadge source={meta.id} updatedAt={meta.lastUpdated ? formatUpdatedAt(meta.lastUpdated) : undefined} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["48", "Selecciones"],
            ["12", "Grupos"],
            [String(data.finished.length), "Jugados"],
            [String(data.upcoming.length), "Por jugar"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
              <div className="text-2xl font-bold tabular-nums text-wc-text">{v}</div>
              <div className="text-[11px] uppercase tracking-wide text-wc-muted">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Selecciones destacadas" subtitle="Por ranking FIFA (aprox.)" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {featured.map((t) => (
            <Link
              key={t.id}
              href={`/teams/${t.id}`}
              className="wc-card wc-card-hover flex flex-col items-center gap-2 p-4 text-center"
            >
              <TeamFlag teamId={t.id} size={34} rounded="rounded" title={t.name} />
              <span className="text-sm font-semibold text-wc-text">{t.name}</span>
              <span className="text-xs text-wc-muted">#{t.fifaRanking} · Gr. {t.groupId}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Partidos" subtitle="Filtra por fecha, estado o grupo." />
        <MatchSelector matches={allMatches} groups={groupIds} todayIso={DATA_CAPTURED_AT} />
      </section>

      <section>
        <SectionTitle title="Grupos y clasificacion" subtitle="Posiciones reales tras los partidos jugados. Los 2 primeros avanzan." />
        <WorldCupGroupsClient groups={data.groups} />
      </section>

      <section>
        <SectionTitle title="Picks destacados del Mundial" />
        <OpportunityTable opportunities={data.topOpportunities} />
      </section>
    </div>
  );
}
