import Link from "next/link";
import type { PlayerCardData } from "@/lib/data-access";
import { DataSourceBadge } from "./badges";
import { PlayerAvatar } from "./worldcup/PlayerAvatar";
import { POSITION_LABELS } from "@/lib/format";

export function PlayerCard({ player }: { player: PlayerCardData }) {
  return (
    <Link href={`/players/${player.id}`} className="card card-hover block p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <PlayerAvatar name={player.name} teamId={player.teamId} imageUrl={player.imageUrl} size={44} />
          <div>
            <div className="font-semibold text-slate-100">
              {player.name}
              {player.shirtNumber ? <span className="ml-1.5 text-xs text-slate-500">#{player.shirtNumber}</span> : null}
            </div>
            <div className="text-xs text-slate-500">
              {player.team?.name ?? player.teamId} · {POSITION_LABELS[player.position]}
              {player.club ? ` · ${player.club}` : ""}
            </div>
          </div>
        </div>
        {player.likelyStarter ? (
          <span className="chip bg-edge-pos/15 text-edge-pos">Titular</span>
        ) : (
          <span className="chip bg-base-700/60 text-slate-400">Rotacion</span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
        <Mini label="Goles" value={player.stats.avgGoals.toFixed(2)} />
        <Mini label="Tiros" value={player.stats.avgShots.toFixed(1)} />
        <Mini label="T. puerta" value={player.stats.avgShotsOnTarget.toFixed(1)} />
        <Mini label="Faltas" value={player.stats.avgFouls.toFixed(1)} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-base-700/60 pt-2 text-xs text-slate-500">
        <span>{player.stats.avgMinutes.toFixed(0)} min/p</span>
        <DataSourceBadge source={player.source} updatedAt={player.updatedAt} />
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
