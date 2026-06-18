import Link from "next/link";
import type { MatchSummary } from "@/lib/data-access";
import { TeamFlag } from "./TeamFlag";
import { formatDate, formatTime } from "@/lib/format";

function StatusPill({ status }: { status: MatchSummary["status"] }) {
  if (status === "live") {
    return (
      <span className="chip bg-wc-red/15 text-wc-red">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-wc-red" /> En vivo
      </span>
    );
  }
  if (status === "finished") {
    return <span className="chip bg-white/5 text-wc-muted">Finalizado</span>;
  }
  return <span className="chip bg-wc-green/15 text-wc-green">Próximo</span>;
}

function Side({ teamId, name, code, score, finished }: {
  teamId: string; name: string; code: string; score: number | null; finished: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <TeamFlag teamId={teamId} size={26} rounded="rounded-[4px]" title={name} />
        <span className="truncate text-sm font-semibold text-wc-text">
          <span className="sm:hidden">{code}</span>
          <span className="hidden sm:inline">{name}</span>
        </span>
      </div>
      {finished ? (
        <span className="tabular-nums text-xl font-bold text-wc-text">{score ?? "-"}</span>
      ) : null}
    </div>
  );
}

/** Card de partido estilo Mundial 2026 (broadcast). */
export function MatchCard({ match, active = false }: { match: MatchSummary; active?: boolean }) {
  const finished = match.status === "finished";
  const round = match.groupId ? `Grupo ${match.groupId}` : match.competition;
  return (
    <Link
      href={`/matches/${match.id}`}
      className={`wc-card wc-card-hover group block p-4 wc-fade-up ${active ? "wc-glow-gold" : ""}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="chip bg-white/5 text-[11px] font-medium text-wc-muted">{round}</span>
        <StatusPill status={match.status} />
      </div>

      <div className="space-y-2">
        <Side teamId={match.home.id} name={match.home.name} code={match.home.code} score={match.homeScore} finished={finished} />
        <div className="wc-divider" />
        <Side teamId={match.away.id} name={match.away.name} code={match.away.code} score={match.awayScore} finished={finished} />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-wc-muted">
        <span>{finished ? formatDate(match.kickoff) : `${formatDate(match.kickoff)} · ${formatTime(match.kickoff)}`}</span>
        <span className="truncate pl-2">{match.city || match.venue}</span>
      </div>
    </Link>
  );
}
