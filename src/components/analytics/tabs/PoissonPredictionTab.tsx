"use client";

import { useMemo, useState } from "react";
import { MOCK_TEAMS } from "@/data/footballAnalyticsMock";
import { predictPoisson } from "@/lib/footballModels";
import type { PoissonInputs } from "@/lib/analytics/types";
import {
  Field,
  InfoBox,
  MetricCard,
  ProbabilityBar,
  RangeInput,
  SectionHeading,
  Select,
  SourceBadge,
  pct,
} from "../primitives";
import { ScoreMatrix } from "../ScoreMatrix";

const AVG_OFF = MOCK_TEAMS.reduce((s, t) => s + t.offensiveRating, 0) / MOCK_TEAMS.length;
const AVG_DEF = MOCK_TEAMS.reduce((s, t) => s + t.defensiveRating, 0) / MOCK_TEAMS.length;

function strengthsFromTeams(homeId: string, awayId: string): PoissonInputs {
  const h = MOCK_TEAMS.find((t) => t.id === homeId)!;
  const a = MOCK_TEAMS.find((t) => t.id === awayId)!;
  return {
    homeAttack: +(h.offensiveRating / AVG_OFF).toFixed(2),
    homeDefense: +(AVG_DEF / h.defensiveRating).toFixed(2),
    awayAttack: +(a.offensiveRating / AVG_OFF).toFixed(2),
    awayDefense: +(AVG_DEF / a.defensiveRating).toFixed(2),
    homeAdvantage: 1.2,
    leagueHomeGoals: 1.5,
    leagueAwayGoals: 1.1,
  };
}

export function PoissonPredictionTab() {
  const [homeId, setHomeId] = useState("arg");
  const [awayId, setAwayId] = useState("bra");
  const [inputs, setInputs] = useState<PoissonInputs>(() => strengthsFromTeams("arg", "bra"));

  const home = MOCK_TEAMS.find((t) => t.id === homeId)!;
  const away = MOCK_TEAMS.find((t) => t.id === awayId)!;
  const out = useMemo(() => predictPoisson(inputs), [inputs]);

  const set = <K extends keyof PoissonInputs>(k: K, v: PoissonInputs[K]) =>
    setInputs((prev) => ({ ...prev, [k]: v }));

  const loadTeams = () => setInputs(strengthsFromTeams(homeId, awayId));

  return (
    <div className="space-y-5">
      <InfoBox title="Poisson / Dixon-Coles">
        El modelo Poisson estima la cantidad esperada de goles de cada equipo. Dixon-Coles mejora el modelo
        ajustando partidos de bajo marcador como 0-0, 1-0, 0-1 y 1-1, que son muy comunes en fútbol.
      </InfoBox>

      <div className="grid gap-5 lg:grid-cols-[5fr_7fr]">
        {/* Inputs */}
        <div className="wc-card space-y-4 p-4">
          <SectionHeading title="Entradas del modelo" right={<SourceBadge source="Demo" />} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Equipo local">
              <Select value={homeId} onChange={setHomeId} options={MOCK_TEAMS.map((t) => ({ value: t.id, label: t.name }))} />
            </Field>
            <Field label="Equipo visitante">
              <Select value={awayId} onChange={setAwayId} options={MOCK_TEAMS.map((t) => ({ value: t.id, label: t.name }))} />
            </Field>
          </div>
          <button
            type="button"
            onClick={loadTeams}
            className="w-full rounded-lg bg-wc-gold/15 px-3 py-2 text-sm font-semibold text-wc-gold transition-colors hover:bg-wc-gold/25"
          >
            Cargar fuerzas desde los ratings de los equipos
          </button>

          <div className="space-y-3 border-t border-white/10 pt-3">
            <Field label={`Fuerza ofensiva local: ${inputs.homeAttack.toFixed(2)}`}>
              <RangeInput value={inputs.homeAttack} onChange={(v) => set("homeAttack", v)} min={0.4} max={2} step={0.05} display={inputs.homeAttack.toFixed(2)} />
            </Field>
            <Field label={`Fuerza defensiva local: ${inputs.homeDefense.toFixed(2)}`} hint="menor = mejor defensa">
              <RangeInput value={inputs.homeDefense} onChange={(v) => set("homeDefense", v)} min={0.4} max={2} step={0.05} display={inputs.homeDefense.toFixed(2)} />
            </Field>
            <Field label={`Fuerza ofensiva visitante: ${inputs.awayAttack.toFixed(2)}`}>
              <RangeInput value={inputs.awayAttack} onChange={(v) => set("awayAttack", v)} min={0.4} max={2} step={0.05} display={inputs.awayAttack.toFixed(2)} />
            </Field>
            <Field label={`Fuerza defensiva visitante: ${inputs.awayDefense.toFixed(2)}`} hint="menor = mejor defensa">
              <RangeInput value={inputs.awayDefense} onChange={(v) => set("awayDefense", v)} min={0.4} max={2} step={0.05} display={inputs.awayDefense.toFixed(2)} />
            </Field>
            <Field label={`Ventaja de localía: ${inputs.homeAdvantage.toFixed(2)}`}>
              <RangeInput value={inputs.homeAdvantage} onChange={(v) => set("homeAdvantage", v)} min={1} max={1.6} step={0.05} display={inputs.homeAdvantage.toFixed(2)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={`Goles liga local: ${inputs.leagueHomeGoals.toFixed(1)}`}>
                <RangeInput value={inputs.leagueHomeGoals} onChange={(v) => set("leagueHomeGoals", v)} min={0.8} max={2.5} step={0.1} display={inputs.leagueHomeGoals.toFixed(1)} />
              </Field>
              <Field label={`Goles liga visita: ${inputs.leagueAwayGoals.toFixed(1)}`}>
                <RangeInput value={inputs.leagueAwayGoals} onChange={(v) => set("leagueAwayGoals", v)} min={0.6} max={2.2} step={0.1} display={inputs.leagueAwayGoals.toFixed(1)} />
              </Field>
            </div>
          </div>
        </div>

        {/* Outputs */}
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label={`xG ${home.name}`} value={out.homeXG.toFixed(2)} accent="gold" />
            <MetricCard label={`xG ${away.name}`} value={out.awayXG.toFixed(2)} accent="blue" />
            <MetricCard
              label="Marcador más probable"
              value={`${out.mostLikelyScore.home}-${out.mostLikelyScore.away}`}
              hint={`${pct(out.mostLikelyScore.prob, 1)} de prob.`}
            />
          </div>

          <div className="wc-card p-4">
            <SectionHeading title="Resultado 1X2" />
            <ProbabilityBar
              segments={[
                { label: home.name, value: out.homeWin, color: "bg-wc-gold" },
                { label: "Empate", value: out.draw, color: "bg-white/30" },
                { label: away.name, value: out.awayWin, color: "bg-wc-blue" },
              ]}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Over 2.5" value={pct(out.over25)} accent="green" />
            <MetricCard label="Under 2.5" value={pct(out.under25)} />
            <MetricCard label="Ambos anotan (BTTS)" value={pct(out.bttsYes)} accent="gold" />
          </div>

          <div className="wc-card p-4">
            <SectionHeading title="Matriz de marcadores (0-0 a 5-5)" subtitle="Con ajuste Dixon-Coles." right={<SourceBadge source="Demo" />} />
            <ScoreMatrix matrix={out.matrix} homeName={home.name} awayName={away.name} best={out.mostLikelyScore} />
          </div>
        </div>
      </div>
    </div>
  );
}
