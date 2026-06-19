"use client";

import type { Position, RiskLevel, ScoutingFilters as Filters } from "@/lib/analytics/types";
import { Field, RangeInput, Select, TextInput } from "./primitives";

const POSITIONS: Array<{ value: Position | "ALL"; label: string }> = [
  { value: "ALL", label: "Todas las posiciones" },
  { value: "GK", label: "Portero (GK)" },
  { value: "DF", label: "Defensa (DF)" },
  { value: "MF", label: "Mediocampo (MF)" },
  { value: "FW", label: "Delantero (FW)" },
];

const RISKS: Array<{ value: RiskLevel | "ALL"; label: string }> = [
  { value: "ALL", label: "Cualquier riesgo" },
  { value: "low", label: "Riesgo bajo" },
  { value: "medium", label: "Riesgo medio" },
  { value: "high", label: "Riesgo alto" },
];

export function ScoutingFiltersPanel({
  filters,
  onChange,
  leagues,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  leagues: string[];
}) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="wc-card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Buscar (nombre o equipo)">
        <TextInput
          value={filters.query}
          onChange={(v) => set("query", v)}
          placeholder="Ej. Nusa, Brighton…"
        />
      </Field>
      <Field label="Liga">
        <Select
          value={filters.league}
          onChange={(v) => set("league", v)}
          options={[{ value: "", label: "Todas las ligas" }, ...leagues.map((l) => ({ value: l, label: l }))]}
        />
      </Field>
      <Field label="Posición">
        <Select
          value={filters.position}
          onChange={(v) => set("position", v as Position | "ALL")}
          options={POSITIONS}
        />
      </Field>
      <Field label={`Edad máxima: ${filters.maxAge}`}>
        <RangeInput
          value={filters.maxAge}
          onChange={(v) => set("maxAge", v)}
          min={16}
          max={40}
          step={1}
          display={`${filters.maxAge}`}
        />
      </Field>
      <Field label={`Minutos mínimos: ${filters.minMinutes}`}>
        <RangeInput
          value={filters.minMinutes}
          onChange={(v) => set("minMinutes", v)}
          min={0}
          max={3000}
          step={90}
          display={`${filters.minMinutes}`}
        />
      </Field>
      <Field label={`Rating 365 mínimo: ${filters.minRating.toFixed(1)}`}>
        <RangeInput
          value={filters.minRating}
          onChange={(v) => set("minRating", v)}
          min={5}
          max={9}
          step={0.1}
          display={filters.minRating.toFixed(1)}
        />
      </Field>
      <Field label="Riesgo">
        <Select
          value={filters.risk}
          onChange={(v) => set("risk", v as RiskLevel | "ALL")}
          options={RISKS}
        />
      </Field>
    </div>
  );
}
