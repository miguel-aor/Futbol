import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamDetail } from "@/lib/data-access";
import { MatchCard } from "@/components/MatchCard";
import { OpportunityTable } from "@/components/OpportunityTable";
import { FormDots } from "@/components/TrendMiniChart";
import { DataSourceBadge } from "@/components/badges";
import { EmptyState, SectionTitle, StatCard } from "@/components/primitives";
import { ArrowLeftIcon, CalendarIcon } from "@/components/icons";
import { POSITION_LABELS, formatUpdatedAt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getTeamDetail(id);
  if (!detail) notFound();

  const { team, upcoming, recent, players, opportunities } = detail;
  const f = team.recentForm;

  return (
    <div className="space-y-8">
      <Link href="/teams" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300">
        <ArrowLeftIcon className="h-4 w-4" /> Selecciones
      </Link>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{team.flag}</span>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{team.name}</h1>
              <p className="text-sm text-slate-500">
                Grupo {team.groupId ?? "—"} · {team.confederation} · Ranking FIFA #{team.fifaRanking}
              </p>
              <div className="mt-2"><FormDots form={f.last5} /></div>
            </div>
          </div>
          <DataSourceBadge source={team.source} updatedAt={formatUpdatedAt(team.updatedAt)} />
        </div>
      </section>

      <section>
        <SectionTitle title="Stats recientes" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Goles a favor" value={f.goalsFor.toFixed(1)} accent="brand" />
          <StatCard label="Goles en contra" value={f.goalsAgainst.toFixed(1)} />
          <StatCard label="Corners" value={f.avgCorners.toFixed(1)} />
          <StatCard label="Tarjetas" value={f.avgCards.toFixed(1)} />
          <StatCard label="Tiros" value={f.avgShots.toFixed(1)} />
          <StatCard label="Tiros a puerta" value={f.avgShotsOnTarget.toFixed(1)} />
        </div>
      </section>

      <section>
        <SectionTitle title="Partidos proximos" />
        {upcoming.length === 0 ? (
          <EmptyState title="Sin proximos partidos" icon={<CalendarIcon className="h-6 w-6" />} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 ? (
        <section>
          <SectionTitle title="Ultimos resultados (mock)" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionTitle title="Jugadores clave" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => (
            <Link key={p.id} href={`/players/${p.id}`} className="card card-hover flex items-center justify-between p-3">
              <div>
                <div className="text-sm font-medium text-slate-100">{p.name}</div>
                <div className="text-xs text-slate-500">{POSITION_LABELS[p.position]} · #{p.shirtNumber}</div>
              </div>
              <span className="text-xs text-slate-500">{p.stats.avgGoals.toFixed(2)} g · {p.stats.avgShots.toFixed(1)} tiros</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Oportunidades de esta seleccion" />
        <OpportunityTable opportunities={opportunities} />
      </section>
    </div>
  );
}
