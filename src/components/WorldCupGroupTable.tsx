import Link from "next/link";
import type { GroupStanding, Team } from "@/lib/data-providers/types";
import { formatSigned } from "@/lib/format";

export function WorldCupGroupTable({
  groupId,
  teams,
  standings,
}: {
  groupId: string;
  teams: Team[];
  standings: GroupStanding[];
}) {
  const teamsById = new Map(teams.map((t) => [t.id, t]));
  // Si no hay partidos jugados, mostrar los equipos por ranking.
  const rows =
    standings.length > 0
      ? standings
      : teams
          .slice()
          .sort((a, b) => a.fifaRanking - b.fifaRanking)
          .map((t) => ({
            teamId: t.id,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          }));

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-base-700/60 px-4 py-2.5">
        <span className="font-semibold text-slate-100">Grupo {groupId}</span>
        <span className="text-xs text-slate-500">PJ · DG · Pts</span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, i) => {
            const team = teamsById.get(row.teamId);
            if (!team) return null;
            return (
              <tr
                key={row.teamId}
                className={`border-b border-base-800/60 last:border-0 ${i < 2 ? "bg-brand-600/5" : ""}`}
              >
                <td className="py-2 pl-4 pr-2 text-slate-500">{i + 1}</td>
                <td className="py-2 pr-2">
                  <Link href={`/teams/${team.id}`} className="flex items-center gap-2 hover:text-brand-400">
                    <span className="text-base">{team.flag}</span>
                    <span className="font-medium text-slate-100">{team.name}</span>
                  </Link>
                </td>
                <td className="py-2 px-1 text-center text-slate-400">{row.played}</td>
                <td className="py-2 px-1 text-center text-slate-400">{formatSigned(row.goalDifference)}</td>
                <td className="py-2 pr-4 text-center font-bold text-slate-100">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
