"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PlayerCardData } from "@/lib/data-access";
import type { PlayerPosition } from "@/lib/data-providers/types";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamFlag } from "./TeamFlag";
import { POSITION_LABELS } from "@/lib/format";

interface TeamOption { id: string; name: string; groupId: string | null }

const POSITIONS: Array<{ key: "all" | PlayerPosition; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "POR", label: "Porteros" },
  { key: "DEF", label: "Defensas" },
  { key: "MED", label: "Medios" },
  { key: "DEL", label: "Delanteros" },
];

const PAGE = 48;

export function PlayerSelector({ players, teams }: { players: PlayerCardData[]; teams: TeamOption[] }) {
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState("all");
  const [position, setPosition] = useState<"all" | PlayerPosition>("all");
  const [limit, setLimit] = useState(PAGE);
  const [compare, setCompare] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      if (position !== "all" && p.position !== position) return false;
      if (team !== "all" && p.teamId !== team) return false;
      if (q) {
        const hay = `${p.name} ${p.team?.name ?? ""} ${p.club}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [players, search, team, position]);

  const visible = filtered.slice(0, limit);

  function toggleSelect(id: string) {
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 2) return [cur[1], id]; // mantiene los 2 ultimos
      return [...cur, id];
    });
  }

  const selPlayers = selected.map((id) => byId.get(id)).filter((p): p is PlayerCardData => Boolean(p));

  return (
    <div className="space-y-4">
      {/* Buscador + filtros */}
      <div className="wc-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }}
            placeholder="Buscar jugador, club o selección…"
            aria-label="Buscar jugador"
            className="w-full rounded-lg border border-white/10 bg-wc-bg/60 px-3 py-2 text-sm text-wc-text placeholder:text-wc-muted focus:border-wc-gold/50 focus:outline-none focus:ring-1 focus:ring-wc-gold/30"
          />
          <select
            value={team}
            onChange={(e) => { setTeam(e.target.value); setLimit(PAGE); }}
            aria-label="Selección"
            className="rounded-lg border border-white/10 bg-wc-bg/60 px-3 py-2 text-sm text-wc-text focus:border-wc-gold/50 focus:outline-none"
          >
            <option value="all">Todas las selecciones</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button
            type="button"
            onClick={() => { setCompare((v) => !v); setSelected([]); }}
            aria-pressed={compare}
            className={`chip shrink-0 cursor-pointer border transition-colors ${
              compare ? "border-wc-gold/50 bg-wc-gold/15 text-wc-gold" : "border-white/10 bg-white/5 text-wc-muted hover:text-wc-text"
            }`}
          >
            Comparar
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {POSITIONS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => { setPosition(p.key); setLimit(PAGE); }}
              aria-pressed={position === p.key}
              className={`chip cursor-pointer border transition-colors ${
                position === p.key
                  ? "border-wc-blue/50 bg-wc-blue/15 text-wc-blue"
                  : "border-white/10 bg-white/5 text-wc-muted hover:text-wc-text"
              }`}
            >
              {p.label}
            </button>
          ))}
          <span className="ml-auto self-center text-xs text-wc-muted">{filtered.length} jugadores</span>
        </div>
      </div>

      {/* Panel de comparación */}
      {compare ? <ComparePanel players={selPlayers} /> : null}

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="wc-card p-8 text-center text-sm text-wc-muted">Sin jugadores con estos filtros.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <PlayerTile
              key={p.id}
              player={p}
              compare={compare}
              selected={selected.includes(p.id)}
              onToggle={() => toggleSelect(p.id)}
            />
          ))}
        </div>
      )}

      {filtered.length > limit ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE)}
            className="chip cursor-pointer border border-white/10 bg-white/5 px-4 py-1.5 text-wc-muted hover:text-wc-text"
          >
            Cargar más ({filtered.length - limit} restantes)
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PlayerTile({
  player,
  compare,
  selected,
  onToggle,
}: {
  player: PlayerCardData;
  compare: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const inner = (
    <>
      <div className="flex items-center gap-3">
        <PlayerAvatar name={player.name} teamId={player.teamId} imageUrl={player.imageUrl} size={46} glow={selected} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-wc-text">
            {player.name}
            {player.shirtNumber ? <span className="ml-1.5 text-xs text-wc-muted">#{player.shirtNumber}</span> : null}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-wc-muted">
            <TeamFlag teamId={player.teamId} size={14} />
            <span className="truncate">{player.team?.name ?? player.teamId} · {POSITION_LABELS[player.position]}</span>
          </div>
          {player.club ? <div className="truncate text-[11px] text-wc-muted">{player.club}</div> : null}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
        <Mini label="G" value={player.stats.avgGoals.toFixed(2)} />
        <Mini label="A" value={player.stats.avgAssists.toFixed(2)} />
        <Mini label="Tiros" value={player.stats.avgShots.toFixed(1)} />
        <Mini label="Min" value={player.stats.avgMinutes.toFixed(0)} />
      </div>
    </>
  );

  const cls = `wc-card wc-card-hover block p-4 text-left ${selected ? "wc-glow-gold" : ""}`;

  if (compare) {
    return (
      <button type="button" onClick={onToggle} aria-pressed={selected} className={`${cls} w-full cursor-pointer`}>
        {inner}
      </button>
    );
  }
  return (
    <Link href={`/players/${player.id}`} className={cls}>
      {inner}
    </Link>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] py-1.5">
      <div className="text-sm font-bold tabular-nums text-wc-text">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-wc-muted">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Comparativa de 2 jugadores
// ---------------------------------------------------------------------
function ComparePanel({ players }: { players: PlayerCardData[] }) {
  if (players.length === 0) {
    return (
      <div className="wc-card p-4 text-center text-sm text-wc-muted">
        Modo comparar activo — selecciona <span className="text-wc-gold">2 jugadores</span> del grid.
      </div>
    );
  }
  const [a, b] = players;
  const rows: Array<[string, (p: PlayerCardData) => number, number]> = [
    ["Goles/p", (p) => p.stats.avgGoals, 2],
    ["Asistencias/p", (p) => p.stats.avgAssists, 2],
    ["Tiros/p", (p) => p.stats.avgShots, 1],
    ["Tiros a puerta/p", (p) => p.stats.avgShotsOnTarget, 1],
    ["Faltas/p", (p) => p.stats.avgFouls, 1],
    ["Minutos/p", (p) => p.stats.avgMinutes, 0],
  ];
  return (
    <div className="wc-card wc-ring p-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <PlayerHead player={a} align="left" />
        <span className="text-xs font-bold uppercase tracking-wide text-wc-gold">VS</span>
        {b ? <PlayerHead player={b} align="right" /> : <span className="text-center text-xs text-wc-muted">elige otro</span>}
      </div>
      {b ? (
        <div className="mt-4 space-y-1.5">
          {rows.map(([label, get, dec]) => {
            const va = get(a), vb = get(b);
            return (
              <div key={label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                <span className={`text-right tabular-nums font-semibold ${va >= vb ? "text-wc-gold" : "text-wc-muted"}`}>{va.toFixed(dec)}</span>
                <span className="text-center text-[11px] uppercase tracking-wide text-wc-muted">{label}</span>
                <span className={`text-left tabular-nums font-semibold ${vb >= va ? "text-wc-gold" : "text-wc-muted"}`}>{vb.toFixed(dec)}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function PlayerHead({ player, align }: { player: PlayerCardData; align: "left" | "right" }) {
  return (
    <Link
      href={`/players/${player.id}`}
      className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse text-right" : ""}`}
    >
      <PlayerAvatar name={player.name} teamId={player.teamId} imageUrl={player.imageUrl} size={44} />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-wc-text">{player.name}</div>
        <div className="truncate text-xs text-wc-muted">{player.team?.name ?? player.teamId}</div>
      </div>
    </Link>
  );
}
