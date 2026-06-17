"use client";

import { useMemo, useState } from "react";
import type { TeamCardData } from "@/lib/data-access";
import { TeamCard } from "./TeamCard";
import { FilterSearch, FilterSelect, FiltersBar } from "./FiltersBar";
import { EmptyState } from "./primitives";
import { CONFEDERATIONS } from "@/lib/format";

export function TeamsClient({ teams, groups }: { teams: TeamCardData[]; groups: string[] }) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [confederation, setConfederation] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teams.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q)) return false;
      if (group !== "all" && t.groupId !== group) return false;
      if (confederation !== "all" && t.confederation !== confederation) return false;
      return true;
    });
  }, [teams, search, group, confederation]);

  return (
    <div>
      <FiltersBar onReset={() => { setSearch(""); setGroup("all"); setConfederation("all"); }}>
        <FilterSearch label="Buscar seleccion" value={search} onChange={setSearch} placeholder="Ej. Argentina" />
        <FilterSelect
          label="Grupo"
          value={group}
          onChange={setGroup}
          options={[{ value: "all", label: "Todos" }, ...groups.map((g) => ({ value: g, label: `Grupo ${g}` }))]}
        />
        <FilterSelect
          label="Confederacion"
          value={confederation}
          onChange={setConfederation}
          options={[{ value: "all", label: "Todas" }, ...CONFEDERATIONS.map((c) => ({ value: c, label: c }))]}
        />
      </FiltersBar>

      <div className="mb-3 text-sm text-slate-500">{filtered.length} selecciones</div>
      {filtered.length === 0 ? (
        <EmptyState title="Sin selecciones" message="Prueba con otro filtro o busqueda." icon="🏳️" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TeamCard key={t.id} team={t} />
          ))}
        </div>
      )}
    </div>
  );
}
