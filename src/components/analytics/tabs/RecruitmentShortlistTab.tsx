"use client";

import { useMemo } from "react";
import { calculateRecruitmentFit } from "@/lib/scoutingModels";
import type { ScoutingPlayer } from "@/lib/analytics/types";
import { InfoBox, MetricCard, SectionHeading, SourceBadge, StatBar } from "../primitives";

export function RecruitmentShortlistTab({
  shortlist,
  onRemove,
}: {
  shortlist: ScoutingPlayer[];
  onRemove: (id: string) => void;
}) {
  const items = useMemo(
    () => shortlist.map((p) => ({ player: p, fit: calculateRecruitmentFit(p) })),
    [shortlist],
  );

  return (
    <div className="space-y-5">
      <InfoBox title="Recruitment Shortlist">
        Lista corta de reclutamiento. Agrega jugadores desde <strong>Player Discovery</strong> o{" "}
        <strong>Hidden Gems</strong>. Cada jugador muestra scores ofensivo/defensivo/riesgo y un comentario
        automático. La lista se guarda en tu navegador.
      </InfoBox>

      <div className="flex items-center justify-between">
        <SectionHeading title={`${items.length} jugadores en seguimiento`} />
        <SourceBadge source="Demo" />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-12 text-center text-sm text-wc-muted">
          Tu shortlist está vacía. Ve a <strong className="text-wc-text">Player Discovery</strong> y agrega
          jugadores con el botón “+ Shortlist”.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map(({ player, fit }) => (
            <div key={player.id} className="wc-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-wc-text">{player.name}</div>
                  <div className="text-xs text-wc-muted">{player.position} · {player.team} · {player.age} años · {player.league}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(player.id)}
                  className="rounded px-2 py-1 text-xs font-semibold text-wc-red hover:bg-wc-red/10"
                >
                  Quitar
                </button>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2">
                <MetricCard label="General" value={fit.overallScore} accent="gold" />
                <MetricCard label="Ofensivo" value={fit.offensiveScore} accent="green" />
                <MetricCard label="Defensivo" value={fit.defensiveScore} accent="blue" />
                <MetricCard label="Riesgo" value={fit.riskScore} accent={fit.riskScore >= 60 ? "red" : "default"} />
              </div>

              <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-wc-muted">
                {fit.comment}
              </p>
            </div>
          ))}
        </div>
      )}

      {items.length > 1 ? (
        <div className="wc-card p-4">
          <SectionHeading title="Comparación de scouting score" />
          <div className="space-y-2">
            {items.map(({ player, fit }) => (
              <StatBar key={player.id} label={player.name} value={fit.overallScore} max={100} display={`${fit.overallScore}`} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
