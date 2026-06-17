import Link from "next/link";
import type { TeamCardData } from "@/lib/data-access";
import { DataSourceBadge } from "./badges";
import { FormDots } from "./TrendMiniChart";
import { formatDateTime } from "@/lib/format";

export function TeamCard({ team }: { team: TeamCardData }) {
  return (
    <Link href={`/teams/${team.id}`} className="card card-hover block p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{team.flag}</span>
          <div>
            <div className="font-semibold text-slate-100">{team.name}</div>
            <div className="text-xs text-slate-500">
              Grupo {team.groupId ?? "—"} · {team.confederation}
            </div>
          </div>
        </div>
        <span className="chip bg-base-700/60 text-slate-300">#{team.fifaRanking} FIFA</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <Mini label="Goles/p" value={team.recentForm.goalsFor.toFixed(1)} />
        <Mini label="Corners" value={team.recentForm.avgCorners.toFixed(1)} />
        <Mini label="Tarjetas" value={team.recentForm.avgCards.toFixed(1)} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <FormDots form={team.recentForm.last5} />
        <DataSourceBadge source={team.source} updatedAt={team.updatedAt} />
      </div>

      <div className="mt-3 border-t border-base-700/60 pt-2 text-xs text-slate-500">
        {team.nextMatch
          ? `Proximo: ${team.nextMatch.home.code} vs ${team.nextMatch.away.code} · ${formatDateTime(team.nextMatch.kickoff)}`
          : "Sin proximo partido programado"}
      </div>
    </Link>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-base-900/60 py-1.5">
      <div className="text-sm font-bold text-slate-100">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}
