"use client";

import { useMemo, useState } from "react";
import { STANDINGS_CUTOFF_CDMX, STANDINGS_WARNINGS, type GroupId } from "@/data/worldcup2026Standings";
import { getStandingsByGroup } from "@/lib/worldcup/standings";
import { getTeamScenario, type TeamScenario } from "@/lib/worldcup/scenarios";
import { projectRoundOf32Bracket } from "@/lib/worldcup/bracketProjection";

const GROUPS: GroupId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
type Tab = "posiciones" | "escenarios" | "llaves";

const STATUS_CHIP: Record<string, string> = {
  qualified: "bg-wc-green/15 text-wc-green",
  eliminated: "bg-wc-red/15 text-wc-red",
  active: "bg-white/5 text-wc-muted",
};
const STATUS_LABEL: Record<string, string> = { qualified: "Clasificado", eliminated: "Eliminado", active: "En disputa" };

function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

function ScenarioBar({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-[11px] text-wc-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full ${tone}`} style={{ width: pct(value) }} />
      </div>
      <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-wc-text">{pct(value)}</span>
    </div>
  );
}

export function PosicionesClient() {
  const [tab, setTab] = useState<Tab>("posiciones");
  const bracket = useMemo(() => projectRoundOf32Bracket(), []);
  const scenarios = useMemo(
    () => GROUPS.flatMap((g) => getStandingsByGroup(g).map((r) => getTeamScenario(r.teamId)).filter(Boolean) as TeamScenario[]),
    [],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-wc-text">Posiciones y llaves</h1>
        <p className="text-sm text-wc-muted">
          Fase de grupos, escenarios de clasificación y llaves proyectadas. Corte: <strong>{STANDINGS_CUTOFF_CDMX}</strong>.
        </p>
      </div>

      <ul className="space-y-1 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-[11px] text-amber-100/90">
        {STANDINGS_WARNINGS.map((w, i) => (
          <li key={i}>• {w}</li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        {(["posiciones", "escenarios", "llaves"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`min-h-[36px] rounded-lg px-3 py-1.5 text-sm font-semibold capitalize ${
              tab === t ? "bg-wc-gold/15 text-wc-gold" : "border border-white/10 text-wc-muted hover:bg-white/5"
            }`}
          >
            {t === "llaves" ? "Llaves proyectadas" : t}
          </button>
        ))}
      </div>

      {tab === "posiciones" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g} className="wc-card p-3">
              <h2 className="mb-2 text-sm font-bold text-wc-text">Grupo {g}</h2>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] uppercase text-wc-muted">
                    <th className="text-left font-medium">Equipo</th>
                    <th className="px-1 text-right font-medium">PJ</th>
                    <th className="px-1 text-right font-medium">DG</th>
                    <th className="px-1 text-right font-medium">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {getStandingsByGroup(g).map((r) => (
                    <tr key={r.teamId} className={`border-t border-white/5 ${r.position <= 2 ? "text-wc-text" : "text-wc-muted"}`}>
                      <td className="py-1">
                        <span className={`mr-1 inline-block w-4 text-right tabular-nums ${r.position <= 2 ? "text-wc-green" : "text-wc-muted/60"}`}>{r.position}</span>
                        {r.teamName}
                        {r.status !== "active" ? (
                          <span className={`ml-1 rounded px-1 text-[9px] ${STATUS_CHIP[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                        ) : null}
                      </td>
                      <td className="px-1 text-right tabular-nums">{r.played}</td>
                      <td className="px-1 text-right tabular-nums">{r.goalDifference >= 0 ? "+" : ""}{r.goalDifference}</td>
                      <td className="px-1 text-right font-bold tabular-nums text-wc-text">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "escenarios" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {scenarios.map((sc) => (
            <div key={sc.teamId} className="wc-card space-y-2 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-wc-text">
                  <span className="text-wc-muted/60">{sc.group}{sc.position}</span> {sc.teamName}
                </span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] ${STATUS_CHIP[sc.status]}`}>{STATUS_LABEL[sc.status]}</span>
              </div>
              <ScenarioBar label="Debe ganar" value={sc.mustWinPressure} tone="bg-wc-gold" />
              <ScenarioBar label="Riesgo elim." value={sc.eliminationRisk} tone="bg-wc-red" />
              <ScenarioBar label="Riesgo rotación" value={sc.rotationRisk} tone="bg-sky-400" />
              <ScenarioBar label="Motivación" value={sc.motivationScore} tone="bg-wc-green" />
              <p className="text-[11px] text-wc-muted">{sc.summary}</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "llaves" ? (
        <div className="space-y-2">
          <p className="text-xs text-wc-muted">
            Ronda de 32 proyectada con sembrado por puntos/diferencia (1º y 2º de cada grupo + 8 mejores terceros).
            Mientras la fase de grupos no termine, los cruces son <strong className="text-amber-300">provisionales</strong>.
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {bracket.map((s) => (
              <div key={s.slotId} className="wc-card flex items-center justify-between gap-2 p-3 text-sm">
                <span className="text-wc-text">
                  {s.teamAName ?? "—"} <span className="text-wc-muted">vs</span> {s.teamBName ?? "—"}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] ${
                    s.source === "confirmed" ? "bg-wc-green/15 text-wc-green" : "bg-amber-400/15 text-amber-300"
                  }`}
                  title={s.notes}
                >
                  {s.source === "confirmed" ? "Confirmado" : "Proyectado"} · {Math.round(s.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
