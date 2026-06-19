"use client";

import { useEffect, useState } from "react";
import {
  MATCHES_LAST_UPDATED,
  REFERENCE_DATE,
  computeStatus,
  formatMonterreyTime,
  monterreyDateKey,
  type MatchStatus,
} from "@/data/currentFootballMatches";
import type { WorldCupMatch } from "@/lib/worldcup-2026/types";
import { SourceBadge } from "./primitives";

const STATUS_STYLE: Record<MatchStatus, { cls: string; label: string; dot?: boolean }> = {
  Scheduled: { cls: "bg-white/5 text-wc-muted", label: "Programado" },
  Live: { cls: "bg-wc-red/15 text-wc-red", label: "En vivo", dot: true },
  Complete: { cls: "bg-wc-green/15 text-wc-green", label: "Finalizado" },
  Postponed: { cls: "bg-amber-400/15 text-amber-300", label: "Pospuesto" },
  "Pending verification": { cls: "bg-amber-400/15 text-amber-300", label: "Sin verificar" },
};

function StatusBadge({ status }: { status: MatchStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`chip ${s.cls}`} title={status}>
      {s.dot ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> : null}
      {s.label}
    </span>
  );
}

function MatchRow({ m }: { m: WorldCupMatch }) {
  const status = computeStatus(m);
  const hasScore = m.homeScore != null && m.awayScore != null;
  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-2 odd:bg-white/[0.02]">
      <span className="w-12 shrink-0 text-[11px] tabular-nums text-wc-muted">
        {formatMonterreyTime(m.kickoff)}
      </span>
      <span className="hidden w-6 shrink-0 text-center text-[10px] font-semibold text-wc-gold sm:block">
        {m.group}
      </span>
      <span className="min-w-0 flex-1 truncate text-right text-sm text-wc-text">{m.homeName}</span>
      <span className="shrink-0 rounded bg-white/5 px-2 py-0.5 text-sm font-bold tabular-nums text-wc-gold">
        {hasScore ? `${m.homeScore}–${m.awayScore}` : "vs"}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-wc-text">{m.awayName}</span>
      <StatusBadge status={status} />
    </div>
  );
}

function Column({ title, matches, empty }: { title: string; matches: WorldCupMatch[]; empty: string }) {
  return (
    <div className="wc-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-wc-text">{title}</h3>
        <span className="text-[11px] text-wc-muted">{matches.length}</span>
      </div>
      {matches.length === 0 ? (
        <p className="px-2 py-6 text-center text-xs text-wc-muted">{empty}</p>
      ) : (
        <div className="space-y-0.5">
          {matches.map((m) => (
            <MatchRow key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MatchesPanel() {
  const [matches, setMatches] = useState<WorldCupMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/worldcup-2026/matches")
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        if (json?.ok) setMatches(json.data as WorldCupMatch[]);
        else setError("No se pudo cargar el calendario.");
      })
      .catch(() => active && setError("No se pudo cargar el calendario."));
    return () => {
      active = false;
    };
  }, []);

  const today = (matches ?? []).filter((m) => monterreyDateKey(m.kickoff) === REFERENCE_DATE);
  const finished = (matches ?? [])
    .filter((m) => computeStatus(m) === "Complete")
    .sort((a, b) => b.kickoff.localeCompare(a.kickoff))
    .slice(0, 8);
  const upcoming = (matches ?? [])
    .filter((m) => computeStatus(m) === "Scheduled" && monterreyDateKey(m.kickoff) > REFERENCE_DATE)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
    .slice(0, 8);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-wc-text">Estado de partidos · Mundial 2026</h2>
          <p className="text-xs text-wc-muted">
            Grupos A–L reales · hora local de Monterrey (CST, UTC−6) · referencia {REFERENCE_DATE} ·{" "}
            actualizado {MATCHES_LAST_UPDATED.slice(0, 10)}
          </p>
        </div>
        <SourceBadge source="Snapshot" title="Snapshot público del proyecto (ESPN/Wikipedia, captura 18 jun). No verificado en vivo en 365Scores." />
      </div>

      {error ? (
        <p className="rounded-xl border border-wc-red/30 bg-wc-red/5 p-3 text-sm text-wc-red">{error}</p>
      ) : matches === null ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-wc-muted">
          Cargando calendario…
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          <Column title="Hoy" matches={today} empty="Sin partidos hoy." />
          <Column title="Próximos" matches={upcoming} empty="Sin próximos." />
          <Column title="Resultados recientes" matches={finished} empty="Sin finalizados." />
        </div>
      )}

      <p className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-xs text-amber-100/90">
        <strong>Procedencia:</strong> snapshot público del proyecto (calendario y resultados reales de la
        jornada 1, grupos A–L). No se verificó en vivo en 365Scores ni se inventan marcadores: los partidos
        cuyo resultado no consta aparecen como <em>“Sin verificar”</em>. Al conectar una fuente real verificada,
        estos datos se actualizan automáticamente vía la API interna.
      </p>
    </section>
  );
}
