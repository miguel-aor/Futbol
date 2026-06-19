"use client";

import { useMemo, useState } from "react";
import { MOCK_TEAMS } from "@/data/footballAnalyticsMock";
import { calculateEloChange, eloMatchProbabilities } from "@/lib/footballModels";
import {
  Field,
  FormDots,
  InfoBox,
  MetricCard,
  ProbabilityBar,
  RadialScore,
  SectionHeading,
  Select,
  Sparkline,
  SourceBadge,
  StatBar,
  pct,
} from "../primitives";
import { PlayerRankingTable, type Column } from "../PlayerRankingTable";
import type { Team } from "@/lib/analytics/types";

type ResultKey = "W" | "D" | "L";

export function EloModelTab() {
  const [homeId, setHomeId] = useState("arg");
  const [awayId, setAwayId] = useState("bra");
  const [result, setResult] = useState<ResultKey>("W");
  const [goalDiff, setGoalDiff] = useState(1);

  const home = MOCK_TEAMS.find((t) => t.id === homeId)!;
  const away = MOCK_TEAMS.find((t) => t.id === awayId)!;

  const probs = useMemo(
    () => eloMatchProbabilities(home.eloRating, away.eloRating, 65),
    [home, away],
  );

  const change = useMemo(() => {
    const resultA = result === "W" ? 1 : result === "D" ? 0.5 : 0;
    return calculateEloChange(home.eloRating, away.eloRating, resultA, {
      k: 20,
      homeAdvantage: 65,
      goalDiff,
    });
  }, [home, away, result, goalDiff]);

  const ranking = [...MOCK_TEAMS].sort((a, b) => b.eloRating - a.eloRating);

  const columns: Column<Team>[] = [
    { key: "rank", label: "#", render: (_t, i) => <span className="text-wc-muted">{i + 1}</span> },
    { key: "name", label: "Selección", render: (t) => <span className="font-medium">{t.name}</span> },
    { key: "elo", label: "Elo/SPI", align: "right", render: (t) => <span className="font-bold text-wc-gold">{Math.round(t.eloRating)}</span> },
    { key: "off", label: "Ataque", align: "right", render: (t) => t.offensiveRating },
    { key: "def", label: "Defensa", align: "right", render: (t) => t.defensiveRating },
    { key: "form", label: "Forma", align: "right", render: (t) => <div className="flex justify-end"><FormDots form={t.recentForm} /></div> },
  ];

  return (
    <div className="space-y-5">
      <InfoBox title="Elo / SPI">
        El modelo Elo/SPI mide la fuerza dinámica de un equipo considerando resultados, fuerza del rival,
        localía y diferencia de goles. Sirve para estimar qué tan fuerte es un equipo más allá de su posición
        actual en la tabla.
      </InfoBox>

      {/* Enfrentamiento */}
      <div className="wc-card p-4">
        <SectionHeading
          title="Enfrentamiento directo"
          subtitle="Probabilidad estimada solo con los ratings Elo (incluye ventaja de localía)."
          right={<SourceBadge source="Demo" />}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Local">
            <Select value={homeId} onChange={setHomeId} options={MOCK_TEAMS.map((t) => ({ value: t.id, label: t.name }))} />
          </Field>
          <Field label="Visitante">
            <Select value={awayId} onChange={setAwayId} options={MOCK_TEAMS.map((t) => ({ value: t.id, label: t.name }))} />
          </Field>
        </div>
        <div className="mt-4">
          <ProbabilityBar
            segments={[
              { label: `${home.name}`, value: probs.homeWin, color: "bg-wc-gold" },
              { label: "Empate", value: probs.draw, color: "bg-white/30" },
              { label: `${away.name}`, value: probs.awayWin, color: "bg-wc-blue" },
            ]}
          />
        </div>
      </div>

      {/* Cards del equipo seleccionado */}
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="wc-card flex flex-col items-center justify-center gap-3 p-4">
          <RadialScore value={home.eloRating} max={2200} label={`Rating Elo · ${home.name}`} />
          <FormDots form={home.recentForm} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Rating total" value={Math.round(home.eloRating)} accent="gold" hint={home.name} />
          <MetricCard label="Rating ofensivo" value={home.offensiveRating} accent="green" />
          <MetricCard label="Rating defensivo" value={home.defensiveRating} accent="blue" />
          <div className="wc-card p-4 sm:col-span-3">
            <SectionHeading title="Evolución del rating" subtitle="Últimas ventanas (demo)." />
            <Sparkline values={home.ratingHistory} width={520} height={70} />
          </div>
        </div>
      </div>

      {/* Cambio de rating tras un partido */}
      <div className="wc-card p-4">
        <SectionHeading title="Cambio de rating tras un partido" subtitle={`${home.name} vs ${away.name}`} />
        <div className="grid items-end gap-4 sm:grid-cols-3">
          <Field label="Resultado de local">
            <Select
              value={result}
              onChange={(v) => setResult(v as ResultKey)}
              options={[
                { value: "W", label: `Gana ${home.name}` },
                { value: "D", label: "Empate" },
                { value: "L", label: `Gana ${away.name}` },
              ]}
            />
          </Field>
          <Field label="Diferencia de goles">
            <Select
              value={`${goalDiff}`}
              onChange={(v) => setGoalDiff(Number(v))}
              options={[1, 2, 3, 4].map((g) => ({ value: `${g}`, label: `${g} gol(es)` }))}
            />
          </Field>
          <MetricCard
            label={`Δ rating ${home.name}`}
            value={`${change.delta >= 0 ? "+" : ""}${change.delta.toFixed(1)}`}
            accent={change.delta >= 0 ? "green" : "red"}
            hint={`Prob. previa de ganar: ${pct(change.expectedA)}`}
          />
        </div>
      </div>

      {/* Ranking */}
      <div>
        <SectionHeading title="Ranking general de equipos" subtitle="Ordenado por rating Elo/SPI." />
        <PlayerRankingTable columns={columns} rows={ranking} rowKey={(t) => t.id} highlightTop={3} />
        <div className="mt-2 flex justify-end">
          <SourceBadge source="Demo" />
        </div>
      </div>
    </div>
  );
}
