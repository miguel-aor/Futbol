"use client";

import { useMemo, useState } from "react";
import type { MatchSummary } from "@/lib/data-access";
import { MatchCard } from "./MatchCard";

type QuickFilter = "todos" | "hoy" | "proximos" | "envivo";

const QUICK: Array<{ key: QuickFilter; label: string }> = [
  { key: "todos", label: "Todos" },
  { key: "hoy", label: "Hoy" },
  { key: "proximos", label: "Próximos" },
  { key: "envivo", label: "En vivo" },
];

/**
 * Selector visual de partidos: filtros rápidos + grid de cards (carrusel
 * horizontal en móvil). `todayIso` viene del servidor para evitar mismatch.
 */
export function MatchSelector({
  matches,
  groups,
  todayIso,
}: {
  matches: MatchSummary[];
  groups: string[];
  todayIso: string;
}) {
  const [quick, setQuick] = useState<QuickFilter>("todos");
  const [group, setGroup] = useState<string>("all");
  const today = todayIso.slice(0, 10);

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (group !== "all" && m.groupId !== group) return false;
      if (quick === "hoy" && m.kickoff.slice(0, 10) !== today) return false;
      if (quick === "proximos" && m.status !== "scheduled") return false;
      if (quick === "envivo" && m.status !== "live") return false;
      return true;
    });
  }, [matches, group, quick, today]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button
              key={q.key}
              type="button"
              onClick={() => setQuick(q.key)}
              aria-pressed={quick === q.key}
              className={`chip cursor-pointer border transition-colors ${
                quick === q.key
                  ? "border-wc-gold/50 bg-wc-gold/15 text-wc-gold"
                  : "border-white/10 bg-white/5 text-wc-muted hover:text-wc-text"
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setGroup("all")}
            className={`chip cursor-pointer border transition-colors ${
              group === "all" ? "border-wc-blue/50 bg-wc-blue/15 text-wc-blue" : "border-white/10 bg-white/5 text-wc-muted hover:text-wc-text"
            }`}
          >
            Todos los grupos
          </button>
          {groups.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroup((cur) => (cur === g ? "all" : g))}
              aria-pressed={group === g}
              className={`chip cursor-pointer border transition-colors ${
                group === g ? "border-wc-blue/50 bg-wc-blue/15 text-wc-blue" : "border-white/10 bg-white/5 text-wc-muted hover:text-wc-text"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="wc-card p-8 text-center text-sm text-wc-muted">No hay partidos con estos filtros.</div>
      ) : (
        <>
          {/* Móvil: carrusel horizontal */}
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 sm:hidden">
            {filtered.map((m) => (
              <div key={m.id} className="w-[78%] shrink-0 snap-start">
                <MatchCard match={m} />
              </div>
            ))}
          </div>
          {/* Desktop/tablet: grid */}
          <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
