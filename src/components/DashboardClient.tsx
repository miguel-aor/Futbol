"use client";

import { useMemo, useState } from "react";
import type { OpportunityView } from "@/lib/data-access";
import { OpportunityTable } from "./OpportunityTable";
import { FilterRange, FilterSearch, FilterSelect, FiltersBar } from "./FiltersBar";
import { MARKET_BY_KEY, MARKET_CATEGORIES } from "@/data/markets";
import { CONFEDERATIONS } from "@/lib/format";

interface TeamOption {
  id: string;
  name: string;
  groupId: string | null;
  confederation: string;
}

type SortKey = "edge" | "prob" | "confidence";

const CONF_RANK: Record<string, number> = { alta: 3, media: 2, baja: 1 };

export function DashboardClient({
  opportunities,
  teams,
  groups,
}: {
  opportunities: OpportunityView[];
  teams: TeamOption[];
  groups: string[];
}) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [team, setTeam] = useState("all");
  const [confederation, setConfederation] = useState("all");
  const [fixtureType, setFixtureType] = useState("all");
  const [category, setCategory] = useState("all");
  const [source, setSource] = useState("all");
  const [confidence, setConfidence] = useState("all");
  const [minProb, setMinProb] = useState(0);
  const [minEdge, setMinEdge] = useState(-20);
  const [sort, setSort] = useState<SortKey>("edge");

  const reset = () => {
    setSearch("");
    setGroup("all");
    setTeam("all");
    setConfederation("all");
    setFixtureType("all");
    setCategory("all");
    setSource("all");
    setConfidence("all");
    setMinProb(0);
    setMinEdge(-20);
    setSort("edge");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = opportunities.filter((o) => {
      const m = o.match;
      if (q) {
        const hay = `${o.pick} ${m?.home.name ?? ""} ${m?.away.name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (group !== "all" && m?.groupId !== group) return false;
      if (team !== "all" && m?.home.id !== team && m?.away.id !== team) return false;
      if (
        confederation !== "all" &&
        m?.home.confederation !== confederation &&
        m?.away.confederation !== confederation
      )
        return false;
      if (fixtureType !== "all" && m?.fixtureType !== fixtureType) return false;
      if (category !== "all" && MARKET_BY_KEY[o.marketKey]?.category !== category) return false;
      if (source !== "all" && o.source !== source) return false;
      if (confidence !== "all" && o.confidence !== confidence) return false;
      if (o.modelProbability * 100 < minProb) return false;
      if (o.edge * 100 < minEdge) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sort === "prob") return b.modelProbability - a.modelProbability;
      if (sort === "confidence")
        return CONF_RANK[b.confidence] - CONF_RANK[a.confidence] || b.edge - a.edge;
      return b.edge - a.edge;
    });
    return result;
  }, [opportunities, search, group, team, confederation, fixtureType, category, source, confidence, minProb, minEdge, sort]);

  return (
    <div>
      <FiltersBar onReset={reset}>
        <FilterSearch label="Buscar" value={search} onChange={setSearch} placeholder="Pick o seleccion…" />
        <FilterSelect
          label="Grupo"
          value={group}
          onChange={setGroup}
          options={[{ value: "all", label: "Todos" }, ...groups.map((g) => ({ value: g, label: `Grupo ${g}` }))]}
        />
        <FilterSelect
          label="Seleccion"
          value={team}
          onChange={setTeam}
          options={[{ value: "all", label: "Todas" }, ...teams.map((t) => ({ value: t.id, label: t.name }))]}
        />
        <FilterSelect
          label="Confederacion"
          value={confederation}
          onChange={setConfederation}
          options={[{ value: "all", label: "Todas" }, ...CONFEDERATIONS.map((c) => ({ value: c, label: c }))]}
        />
        <FilterSelect
          label="Tipo"
          value={fixtureType}
          onChange={setFixtureType}
          options={[
            { value: "all", label: "Todos" },
            { value: "mundial", label: "Mundial" },
            { value: "amistoso", label: "Amistoso" },
            { value: "eliminatoria", label: "Eliminatoria" },
            { value: "internacional", label: "Internacional" },
          ]}
        />
        <FilterSelect
          label="Mercado"
          value={category}
          onChange={setCategory}
          options={[{ value: "all", label: "Todos" }, ...MARKET_CATEGORIES]}
        />
        <FilterSelect
          label="Confianza"
          value={confidence}
          onChange={setConfidence}
          options={[
            { value: "all", label: "Todas" },
            { value: "alta", label: "Alta" },
            { value: "media", label: "Media" },
            { value: "baja", label: "Baja" },
          ]}
        />
        <FilterSelect
          label="Fuente"
          value={source}
          onChange={setSource}
          options={[
            { value: "all", label: "Todas" },
            { value: "mock", label: "Mock" },
            { value: "manual", label: "Snapshot manual" },
            { value: "365scores", label: "365Scores (exp.)" },
          ]}
        />
        <FilterRange label="Prob. min" value={minProb} onChange={setMinProb} min={0} max={100} step={5} />
        <FilterRange label="Edge min" value={minEdge} onChange={setMinEdge} min={-20} max={40} step={1} />
        <FilterSelect
          label="Ordenar por"
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={[
            { value: "edge", label: "Edge" },
            { value: "prob", label: "Probabilidad" },
            { value: "confidence", label: "Confianza" },
          ]}
        />
      </FiltersBar>

      <div className="mb-3 text-sm text-slate-500">
        {filtered.length} oportunidad{filtered.length === 1 ? "" : "es"}
      </div>
      <OpportunityTable opportunities={filtered} />
    </div>
  );
}
