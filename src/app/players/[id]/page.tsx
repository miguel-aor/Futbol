import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayerDetail } from "@/lib/data-access";
import { PlayerPropsTable } from "@/components/PlayerPropsTable";
import { DataSourceBadge } from "@/components/badges";
import { SectionTitle, StatCard } from "@/components/primitives";
import { ArrowLeftIcon } from "@/components/icons";
import { POSITION_LABELS, formatDateTime, formatUpdatedAt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPlayerDetail(id);
  if (!detail) notFound();

  const { player, team, props, nextMatch } = detail;
  const s = player.stats;

  return (
    <div className="space-y-8">
      <Link href="/players" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300">
        <ArrowLeftIcon className="h-4 w-4" /> Jugadores
      </Link>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-base-700 text-xl font-bold text-slate-100">
              {player.shirtNumber}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{player.name}</h1>
              <p className="text-sm text-slate-500">
                {team ? (
                  <Link href={`/teams/${team.id}`} className="hover:text-brand-400">
                    {team.flag} {team.name}
                  </Link>
                ) : (
                  player.teamId
                )}{" "}
                · {POSITION_LABELS[player.position]}
                {player.likelyStarter ? " · Titular probable" : " · Rotacion"}
              </p>
            </div>
          </div>
          <DataSourceBadge source={player.source} updatedAt={formatUpdatedAt(player.updatedAt)} />
        </div>

        {nextMatch ? (
          <div className="mt-4 rounded-lg bg-base-900/60 px-4 py-3 text-sm text-slate-400">
            Proximo partido internacional:{" "}
            <Link href={`/matches/${nextMatch.id}`} className="font-medium text-slate-200 hover:text-brand-400">
              {nextMatch.home.code} vs {nextMatch.away.code}
            </Link>{" "}
            · {formatDateTime(nextMatch.kickoff)}
          </div>
        ) : null}
      </section>

      <section>
        <SectionTitle title="Stats internacionales" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <StatCard label="Goles" value={s.avgGoals.toFixed(2)} accent="brand" />
          <StatCard label="Asistencias" value={s.avgAssists.toFixed(2)} />
          <StatCard label="Tiros" value={s.avgShots.toFixed(1)} />
          <StatCard label="Tiros a puerta" value={s.avgShotsOnTarget.toFixed(1)} />
          <StatCard label="Tarjetas" value={s.avgCards.toFixed(2)} />
          <StatCard label="Faltas" value={s.avgFouls.toFixed(1)} />
          <StatCard label="Minutos" value={s.avgMinutes.toFixed(0)} />
        </div>
      </section>

      <section>
        <SectionTitle title="Props disponibles" subtitle="Hit rates, probabilidad del modelo, cuota justa y edge" />
        <PlayerPropsTable props={props} />
      </section>
    </div>
  );
}
