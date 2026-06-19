"use client";

import { useMemo, useState } from "react";
import { MOCK_SCOUTING_PLAYERS } from "@/data/footballAnalyticsMock";
import { buildPlayerRiskReport } from "@/lib/scoutingModels";
import type { RiskLevel } from "@/lib/analytics/types";
import { Field, InfoBox, RiskBadge, SectionHeading, Select, SourceBadge } from "../primitives";

const WEAK_LEAGUES = new Set([
  "Liga MX",
  "Saudi Pro League",
  "Allsvenskan",
  "Bundesliga AUT",
  "Pro League",
]);

const RISK_FACTORS: Array<{ key: string; label: string }> = [
  { key: "minutesRisk", label: "Pocos minutos / muestra" },
  { key: "overperformanceRisk", label: "Sobre-rendimiento vs xG" },
  { key: "consistencyRisk", label: "Consistencia" },
  { key: "leagueAdjustmentRisk", label: "Competitividad de liga" },
  { key: "injuryRisk", label: "Lesiones (si la fuente lo muestra)" },
];

export function PlayerRiskReportTab() {
  const [playerId, setPlayerId] = useState(MOCK_SCOUTING_PLAYERS[6]?.id ?? MOCK_SCOUTING_PLAYERS[0].id);
  const player = MOCK_SCOUTING_PLAYERS.find((p) => p.id === playerId)!;

  const report = useMemo(
    () =>
      buildPlayerRiskReport(player, {
        weakLeague: WEAK_LEAGUES.has(player.league),
        recentTransfer: player.id === "sc-veiga",
      }),
    [player],
  );

  return (
    <div className="space-y-5">
      <InfoBox title="Player Risk Report">
        Evalúa el riesgo estadístico de apostar por un jugador: muestra de minutos, sobre-rendimiento de goles
        respecto a su xG, consistencia, competitividad de la liga y cambio reciente de club.
      </InfoBox>

      <div className="wc-card p-4">
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <Field label="Jugador">
            <Select
              value={playerId}
              onChange={setPlayerId}
              options={MOCK_SCOUTING_PLAYERS.map((p) => ({ value: p.id, label: `${p.name} · ${p.team}` }))}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-wc-muted">Riesgo global:</span>
            <RiskBadge risk={report.overallRisk} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <SectionHeading title="Desglose de riesgos" />
        <SourceBadge source="Demo" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {RISK_FACTORS.map((f) => (
          <div key={f.key} className="wc-card flex items-center justify-between gap-2 p-4">
            <span className="text-sm text-wc-text">{f.label}</span>
            <RiskBadge risk={report[f.key as keyof typeof report] as RiskLevel} />
          </div>
        ))}
      </div>

      <div className="wc-card border-l-4 border-wc-gold p-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-wc-gold">Explicación</div>
        <p className="text-sm text-wc-text">{report.explanation}</p>
      </div>
    </div>
  );
}
