"use client";

import { useMemo, useState } from "react";
import type { PlayerCardData } from "@/lib/data-access";
import { PlayerCard } from "./PlayerCard";
import { FilterSearch, FilterSelect, FiltersBar } from "./FiltersBar";
import { EmptyState } from "./primitives";

interface TeamOption { id: string; name: string; groupId: string | null }

type StatSort = "goals" | "shots" | "shotsOnTarget" | "fouls" | "cards";

export function PlayersClient({ players, teams, groups }: { players: PlayerCardData[]; teams: TeamOption[]; groups: string[] }) {
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState("all");
  const [group, setGroup] = useState("all");
  const [position, setPosition] = useState("all");
  const [stat, setStat] = useState<StatSort>("goals");

  const groupByTeam = useMemo(() => new Map(teams.map((t) => [t.id, t.groupId])), [teams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = players.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (team !== "all" && p.teamId !== team) return false;
      if (group !== "all" && groupByTeam.get(p.teamId) !== group) return false;
      if (position !== "all" && p.position !== position) return false;
      return true;
    });
    const key = (p: PlayerCardData) =>
      stat === "goals" ? p.stats.avgGoals
      : stat === "shots" ? p.stats.avgShots
      : stat === "shotsOnTarget" ? p.stats.avgShotsOnTarget
      : stat === "fouls" ? p.stats.avgFouls
      : p.stats.avgCards;
    result.sort((a, b) => key(b) - key(a));
    return result;
  }, [players, search, team, group, position, stat, groupByTeam]);

  return (
    <div>
      <FiltersBar onReset={() => { setSearch(""); setTeam("all"); setGroup("all"); setPosition("all"); setStat("goals"); }}>
        <FilterSearch label="Buscar jugador" value={search} onChange={setSearch} placeholder="Nombre…" />
        <FilterSelect
          label="Seleccion"
          value={team}
          onChange={setTeam}
          options={[{ value: "all", label: "Todas" }, ...teams.map((t) => ({ value: t.id, label: t.name }))]}
        />
        <FilterSelect
          label="Grupo"
          value={group}
          onChange={setGroup}
          options={[{ value: "all", label: "Todos" }, ...groups.map((g) => ({ value: g, label: `Grupo ${g}` }))]}
        />
        <FilterSelect
          label="Posicion"
          value={position}
          onChange={setPosition}
          options={[
            { value: "all", label: "Todas" },
            { value: "POR", label: "Portero" },
            { value: "DEF", label: "Defensa" },
            { value: "MED", label: "Mediocampista" },
            { value: "DEL", label: "Delantero" },
          ]}
        />
        <FilterSelect
          label="Ordenar por"
          value={stat}
          onChange={(v) => setStat(v as StatSort)}
          options={[
            { value: "goals", label: "Goles" },
            { value: "shots", label: "Tiros" },
            { value: "shotsOnTarget", label: "Tiros a puerta" },
            { value: "fouls", label: "Faltas" },
            { value: "cards", label: "Tarjetas" },
          ]}
        />
      </FiltersBar>

      <div className="mb-3 text-sm text-slate-500">{filtered.length} jugadores</div>
      {filtered.length === 0 ? (
        <EmptyState title="Sin jugadores" message="Ajusta los filtros o la busqueda." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </div>
      )}
    </div>
  );
}
