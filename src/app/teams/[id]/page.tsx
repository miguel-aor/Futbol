import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamDetail, getTeamIntelligence, getTeamLabels } from "@/lib/data-access";
import { MatchCard } from "@/components/MatchCard";
import { OpportunityTable } from "@/components/OpportunityTable";
import { FormDots } from "@/components/TrendMiniChart";
import { DataQualityBadge, DataSourceBadge } from "@/components/badges";
import { EmptyState, SectionTitle, StatCard } from "@/components/primitives";
import {
  CoachCard,
  HistoricalMatchList,
  KeyPlayerCard,
  PerformanceWindowGrid,
  ScoreRadar,
} from "@/components/IntelligencePanels";
import { MarketTabs } from "@/components/MarketTabs";
import { ArrowLeftIcon, CalendarIcon } from "@/components/icons";
import { POSITION_LABELS, formatUpdatedAt } from "@/lib/format";
import { calculateCoachImpact } from "@/lib/prediction/intelligence";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, profile, labels] = await Promise.all([
    getTeamDetail(id),
    getTeamIntelligence(id),
    getTeamLabels(),
  ]);
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

      {/* Mapa de rendimiento (Intelligence) */}
      {profile ? (
        <section>
          <SectionTitle
            title="Mapa de rendimiento"
            subtitle={`${profile.identity.playStyle} · ${profile.identity.commonFormation} · DT ${profile.identity.coachName} · Capitán ${profile.identity.captain}`}
            action={<DataQualityBadge quality={profile.dataQuality} />}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card flex flex-col items-center justify-center p-5">
              <h3 className="mb-2 self-start text-sm font-semibold text-slate-200">Perfil (0-100)</h3>
              <ScoreRadar scores={profile.scores} />
            </div>
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">Tendencias por mercado</h3>
              <div className="space-y-2.5">
                {[
                  ["Ofensiva", profile.scores.attack],
                  ["Defensiva", profile.scores.defense],
                  ["Disciplina (tarjetas)", profile.scores.discipline],
                  ["Corners", profile.scores.corners],
                  ["Tiros", profile.scores.shots],
                  ["Forma reciente", profile.scores.form],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{label}</span>
                      <span className="tabular-nums font-semibold text-slate-200">{value as number}</span>
                    </div>
                    <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-base-900">
                      <div className="h-full bg-sky-500/70" style={{ width: `${value as number}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <MarketTabs
              tabs={[
                { key: "w5", label: "Últimos 5", content: <PerformanceWindowGrid window={profile.recent.last5} /> },
                { key: "w10", label: "Últimos 10", content: <PerformanceWindowGrid window={profile.recent.last10} /> },
                { key: "w20", label: "Últimos 20", content: <PerformanceWindowGrid window={profile.recent.last20} /> },
              ]}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {profile.coach ? (
              <CoachCard coach={profile.coach} impact={calculateCoachImpact(profile.coach)} />
            ) : null}
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">Partidos históricos relevantes</h3>
              <HistoricalMatchList matches={profile.relevantMatches} labels={labels} limit={10} />
            </div>
          </div>

          {profile.keyPlayers.length > 0 ? (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-200">Jugadores clave (perfil)</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {profile.keyPlayers.map((pl) => <KeyPlayerCard key={pl.playerId} player={pl} />)}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

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
          <SectionTitle title="Ultimos resultados" />
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
