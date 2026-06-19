"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildValuePicks } from "@/lib/bet/buildPicks";
import { DEMO_MATCH } from "@/data/betBuilderMock";
import { REFERENCE_DATE, formatMonterrey, monterreyDateKey } from "@/data/currentFootballMatches";
import {
  isMatchEligibleForPicks,
  normalizeMatchStatus,
  statusLabel,
  type NormalizedStatus,
} from "@/lib/bet/eligibility";
import { dedupeMatches } from "@/lib/bet/dedupe";
import type { WorldCupMatch } from "@/lib/worldcup-2026/types";
import { PickCard } from "./PickCard";
import { DisclaimerBar, RatingBadge, fmtSignedPct } from "./ui";

interface MatchItem {
  id: string;
  home: string;
  away: string;
  kickoff: string;
  competition: string;
  status: NormalizedStatus;
  eligible: boolean;
  homeScore: number | null;
  awayScore: number | null;
  picksCount: number;
  isDemo: boolean;
}

const STATUS_STYLE: Record<NormalizedStatus, string> = {
  scheduled: "bg-white/5 text-wc-muted",
  scheduled_unverified: "bg-amber-400/15 text-amber-300",
  live: "bg-wc-red/15 text-wc-red",
  finished: "bg-wc-green/15 text-wc-green",
  unverified: "bg-amber-400/15 text-amber-300",
};

type Filter = "eligible" | "all" | "today" | "finished";

export function PartidosClient() {
  const demoPicks = useMemo(() => buildValuePicks().filter((p) => p.matchId === DEMO_MATCH.id), []);
  const [wc, setWc] = useState<WorldCupMatch[]>([]);
  const [filter, setFilter] = useState<Filter>("eligible");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(DEMO_MATCH.id);

  useEffect(() => {
    let active = true;
    fetch("/api/worldcup-2026/matches")
      .then((r) => r.json())
      .then((j) => active && j?.ok && setWc(j.data as WorldCupMatch[]))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo<MatchItem[]>(() => {
    const demoEl = { kickoff: DEMO_MATCH.kickoff, status: "scheduled", homeScore: null, awayScore: null };
    const demo: MatchItem = {
      id: DEMO_MATCH.id,
      home: DEMO_MATCH.params.homeName,
      away: DEMO_MATCH.params.awayName,
      kickoff: DEMO_MATCH.kickoff,
      competition: DEMO_MATCH.competition,
      status: normalizeMatchStatus(demoEl),
      eligible: isMatchEligibleForPicks(demoEl),
      homeScore: null,
      awayScore: null,
      picksCount: demoPicks.length,
      isDemo: true,
    };
    const real: MatchItem[] = wc.map((m) => ({
      id: m.id,
      home: m.homeName,
      away: m.awayName,
      kickoff: m.kickoff,
      competition: `Mundial 2026 · Grupo ${m.group}`,
      status: normalizeMatchStatus(m),
      eligible: isMatchEligibleForPicks(m),
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      picksCount: 0,
      isDemo: false,
    }));
    // Real prevalece sobre demo si son el mismo partido (mismos equipos/fecha).
    return dedupeMatches([demo, ...real], (it) => ({ home: it.home, away: it.away, kickoff: it.kickoff, isDemo: it.isDemo }));
  }, [wc, demoPicks.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((m) => {
        if (q && !`${m.home} ${m.away}`.toLowerCase().includes(q)) return false;
        switch (filter) {
          case "eligible":
            return m.eligible;
          case "today":
            return monterreyDateKey(m.kickoff) === REFERENCE_DATE;
          case "finished":
            return m.status === "finished";
          default:
            return true;
        }
      })
      .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.picksCount - a.picksCount || a.kickoff.localeCompare(b.kickoff));
  }, [items, filter, query]);

  const selected = items.find((m) => m.id === selectedId) ?? filtered[0] ?? items[0];

  const FILTERS: Array<{ key: Filter; label: string }> = [
    { key: "eligible", label: "Próximos elegibles" },
    { key: "today", label: "Hoy" },
    { key: "finished", label: "Finalizados" },
    { key: "all", label: "Todos" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-wc-text">Partidos</h1>
        <p className="text-sm text-wc-muted">
          Elige un partido <strong className="text-wc-text">próximo</strong> para generar picks. Los finalizados
          solo se usan como histórico para el modelo.
        </p>
      </div>
      <DisclaimerBar compact />

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="wc-card flex flex-col p-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar selección…"
            className="mb-2 w-full rounded-lg border border-white/10 bg-wc-card px-3 py-2 text-sm text-wc-text placeholder:text-wc-muted/60 focus:border-wc-gold focus:outline-none focus:ring-1 focus:ring-wc-gold/40"
          />
          <div className="mb-2 flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`min-h-[32px] rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filter === f.key ? "bg-wc-gold/15 text-wc-gold" : "border border-white/10 text-wc-muted hover:bg-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="max-h-[68vh] space-y-1.5 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-wc-muted">
                {filter === "eligible" ? "No hay partidos próximos elegibles." : "Sin partidos para ese filtro."}
              </p>
            ) : (
              filtered.map((m) => {
                const on = m.id === selectedId;
                const hasScore = m.homeScore != null && m.awayScore != null;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    aria-pressed={on}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      on ? "border-wc-gold/50 bg-wc-gold/10" : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-semibold text-wc-text">
                        {m.home} <span className="text-wc-muted">vs</span> {m.away}
                      </span>
                      {hasScore ? (
                        <span className="shrink-0 rounded bg-white/5 px-1.5 text-sm font-bold tabular-nums text-wc-gold">
                          {m.homeScore}–{m.awayScore}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-wc-muted">
                      <span className={`chip ${STATUS_STYLE[m.status]}`}>{statusLabel(m.status)}</span>
                      <span>{m.competition}</span>
                      {m.eligible ? <span className="text-wc-green">Elegible</span> : null}
                      {m.picksCount > 0 ? <span className="text-wc-gold">{m.picksCount} picks</span> : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          {selected ? <MatchDetail item={selected} demoPicks={selected.isDemo ? demoPicks : []} /> : null}
        </div>
      </div>
    </div>
  );
}

function MatchDetail({
  item,
  demoPicks,
}: {
  item: MatchItem;
  demoPicks: ReturnType<typeof buildValuePicks>;
}) {
  const best = demoPicks[0];
  const avgConf = demoPicks.length
    ? Math.round(demoPicks.reduce((s, p) => s + p.confidenceScore, 0) / demoPicks.length)
    : 0;

  return (
    <>
      <div className="wc-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-wc-text">
              {item.home} <span className="text-wc-muted">vs</span> {item.away}
            </h2>
            <p className="text-xs text-wc-muted">{item.competition} · {formatMonterrey(item.kickoff)}</p>
            <div className="mt-2">
              <span className={`chip ${STATUS_STYLE[item.status]}`}>{statusLabel(item.status)}</span>
              {item.homeScore != null && item.awayScore != null ? (
                <span className="ml-2 text-sm font-bold tabular-nums text-wc-gold">
                  {item.homeScore}–{item.awayScore}
                </span>
              ) : null}
            </div>
          </div>
          {item.eligible ? (
            <Link
              href={`/partidos/${item.id}`}
              className="min-h-[40px] rounded-lg bg-wc-gold/15 px-4 py-2 text-sm font-semibold text-wc-gold hover:bg-wc-gold/25"
            >
              Analizar partido
            </Link>
          ) : (
            <Link
              href="/analytics"
              className="min-h-[40px] rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-wc-text hover:bg-white/5"
            >
              Ver datos / histórico
            </Link>
          )}
        </div>
        {item.eligible && demoPicks.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-wc-muted">
            <span>{demoPicks.length} picks</span>
            <span>·</span>
            <span>Confianza prom. {avgConf}</span>
            {best ? (
              <>
                <span>·</span>
                <span className="text-wc-text">Mejor: {best.selection} (EV {fmtSignedPct(best.expectedValue, 0)})</span>
                <RatingBadge rating={best.rating} />
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {!item.eligible ? (
        <div className="wc-card p-6 text-center text-sm text-wc-muted">
          Este partido no es elegible para nuevas picks (finalizado o sin verificar). Se usa como histórico para
          los modelos. Revisa datos en{" "}
          <Link href="/analytics" className="text-wc-gold hover:underline">Research</Link>.
        </div>
      ) : demoPicks.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {demoPicks.slice(0, 8).map((p) => (
            <PickCard key={p.id} pick={p} />
          ))}
        </div>
      ) : (
        <div className="wc-card p-6 text-center text-sm text-wc-muted">
          Aún no hay picks precargadas para este partido. Abre{" "}
          <Link href={`/partidos/${item.id}`} className="text-wc-gold hover:underline">su análisis</Link>{" "}
          y captura líneas y momios en la pestaña Mercados.
        </div>
      )}
    </>
  );
}
