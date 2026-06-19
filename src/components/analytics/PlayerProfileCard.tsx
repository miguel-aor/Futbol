"use client";

import type { ScoutingPlayer } from "@/lib/analytics/types";
import { normalizePer90 } from "@/lib/scoutingModels";
import { RadialScore, ReliabilityBadge, SourceBadge, Tag, num } from "./primitives";

const POSITION_LABEL: Record<ScoutingPlayer["position"], string> = {
  GK: "Portero",
  DF: "Defensa",
  MF: "Mediocampo",
  FW: "Delantero",
};

/** Tarjeta de perfil de un jugador de scouting con scores y métricas clave. */
export function PlayerProfileCard({
  player,
  onAdd,
  added,
}: {
  player: ScoutingPlayer;
  onAdd?: (p: ScoutingPlayer) => void;
  added?: boolean;
}) {
  const goals90 = normalizePer90(player.goals, player.minutes);
  const xg90 = normalizePer90(player.xG, player.minutes);
  const xa90 = normalizePer90(player.xA, player.minutes);

  return (
    <div className="wc-card wc-card-hover flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-wc-text">{player.name}</div>
          <div className="text-xs text-wc-muted">
            {POSITION_LABEL[player.position]} · {player.team} · {player.age} años
          </div>
          <div className="text-[11px] text-wc-muted/80">{player.league}</div>
        </div>
        <RadialScore value={player.scoutingScore} label="Scouting" size={68} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Metric label="Goles/90" value={num(goals90)} />
        <Metric label="xG/90" value={num(xg90)} />
        <Metric label="xA/90" value={num(xa90)} />
        <Metric label="Rating 365" value={num(player.rating365, 1)} />
        <Metric label="Entradas" value={`${player.tacklesWon}`} />
        <Metric label="Intercep." value={`${player.interceptions}`} />
      </div>

      {player.tags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {player.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap gap-1.5">
          <SourceBadge source={player.source} />
          <ReliabilityBadge reliability={player.reliability} />
        </div>
        {onAdd ? (
          <button
            type="button"
            onClick={() => onAdd(player)}
            disabled={added}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              added
                ? "cursor-default bg-white/5 text-wc-muted"
                : "bg-wc-gold/15 text-wc-gold hover:bg-wc-gold/25"
            }`}
          >
            {added ? "En shortlist ✓" : "+ Shortlist"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] py-1.5">
      <div className="text-sm font-bold tabular-nums text-wc-text">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-wc-muted">{label}</div>
    </div>
  );
}
