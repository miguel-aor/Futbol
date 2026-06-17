"use client";

import { useState } from "react";
import type { WorldCupData } from "@/lib/data-access";
import { WorldCupGroupTable } from "./WorldCupGroupTable";
import { FilterSelect, FiltersBar } from "./FiltersBar";

export function WorldCupGroupsClient({ groups }: { groups: WorldCupData["groups"] }) {
  const [group, setGroup] = useState("all");
  const visible = group === "all" ? groups : groups.filter((g) => g.id === group);

  return (
    <div>
      <FiltersBar onReset={() => setGroup("all")}>
        <FilterSelect
          label="Grupo"
          value={group}
          onChange={setGroup}
          options={[{ value: "all", label: "Todos los grupos" }, ...groups.map((g) => ({ value: g.id, label: g.name }))]}
        />
      </FiltersBar>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((g) => (
          <WorldCupGroupTable key={g.id} groupId={g.id} teams={g.teams} standings={g.standings} />
        ))}
      </div>
    </div>
  );
}
