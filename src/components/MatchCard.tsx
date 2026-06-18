import Link from "next/link";
import type { MatchSummary } from "@/lib/data-access";
import { DataSourceBadge } from "./badges";
import { TeamFlag } from "./worldcup/TeamFlag";
import { FIXTURE_LABELS, formatDateTime } from "@/lib/format";

export function MatchCard({ match }: { match: MatchSummary }) {
  const finished = match.status === "finished";
  const live = match.status === "live";
  return (
    <Link href={`/matches/${match.id}`} className="card card-hover block p-4">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-500">
        <span className="chip bg-base-700/60 text-slate-300">
          {FIXTURE_LABELS[match.fixtureType] ?? match.fixtureType}
          {match.groupId ? ` · Grupo ${match.groupId}` : ""}
        </span>
        {live ? (
          <span className="chip bg-edge-neg/15 text-edge-neg">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-edge-neg" /> En vivo
          </span>
        ) : (
          <span>{finished ? "Finalizado" : formatDateTime(match.kickoff)}</span>
        )}
      </div>

      <div className="space-y-2">
        <TeamRow teamId={match.home.id} name={match.home.name} score={match.homeScore} finished={finished} />
        <TeamRow teamId={match.away.id} name={match.away.name} score={match.awayScore} finished={finished} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-base-700/60 pt-2 text-xs text-slate-500">
        <span className="truncate">{match.venue}</span>
        <DataSourceBadge source={match.source} updatedAt={match.updatedAt} />
      </div>
    </Link>
  );
}

function TeamRow({
  teamId,
  name,
  score,
  finished,
}: {
  teamId: string;
  name: string;
  score: number | null;
  finished: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm font-medium text-slate-100">
        <TeamFlag teamId={teamId} size={20} title={name} />
        {name}
      </span>
      {finished ? (
        <span className="text-base font-bold tabular-nums text-slate-100">{score ?? "-"}</span>
      ) : null}
    </div>
  );
}
