import Link from "next/link";
import type { MatchSummary } from "@/lib/data-access";
import { DataSourceBadge } from "./badges";
import { FIXTURE_LABELS, formatDateTime } from "@/lib/format";

export function MatchCard({ match }: { match: MatchSummary }) {
  const finished = match.status === "finished";
  return (
    <Link href={`/matches/${match.id}`} className="card card-hover block p-4">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-500">
        <span className="chip bg-base-700/60 text-slate-300">
          {FIXTURE_LABELS[match.fixtureType] ?? match.fixtureType}
          {match.groupId ? ` · Grupo ${match.groupId}` : ""}
        </span>
        <span>{finished ? "Finalizado" : formatDateTime(match.kickoff)}</span>
      </div>

      <div className="space-y-2">
        <TeamRow flag={match.home.flag} name={match.home.name} score={match.homeScore} finished={finished} />
        <TeamRow flag={match.away.flag} name={match.away.name} score={match.awayScore} finished={finished} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-base-700/60 pt-2 text-xs text-slate-500">
        <span className="truncate">{match.venue}</span>
        <DataSourceBadge source={match.source} updatedAt={match.updatedAt} />
      </div>
    </Link>
  );
}

function TeamRow({
  flag,
  name,
  score,
  finished,
}: {
  flag: string;
  name: string;
  score: number | null;
  finished: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm font-medium text-slate-100">
        <span className="text-lg">{flag}</span>
        {name}
      </span>
      {finished ? (
        <span className="text-base font-bold text-slate-100">{score ?? "-"}</span>
      ) : null}
    </div>
  );
}
