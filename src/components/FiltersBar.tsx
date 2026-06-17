"use client";

import type { ReactNode } from "react";

export function FiltersBar({ children, onReset }: { children: ReactNode; onReset?: () => void }) {
  return (
    <div className="card mb-5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="label-dim">Filtros</span>
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-brand-400 hover:text-brand-500"
          >
            Limpiar
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{children}</div>
    </div>
  );
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <FilterField label={label}>
      <select className="input-dark" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FilterField>
  );
}

export function FilterSearch({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <FilterField label={label}>
      <input
        type="search"
        className="input-dark"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </FilterField>
  );
}

export function FilterRange({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  suffix = "%",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <FilterField label={`${label}: ${value}${suffix}`}>
      <input
        type="range"
        className="w-full accent-brand-500"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </FilterField>
  );
}
