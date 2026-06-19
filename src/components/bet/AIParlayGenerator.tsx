"use client";

import { useState } from "react";
import { Field, Select } from "@/components/analytics/primitives";
import {
  generateParlayCombinations,
  rankParlays,
  type ParlaySort,
} from "@/lib/parlayGenerator";
import type {
  AIParlayAdvice,
  BetSlipPick,
  ParlayCandidate,
  ParlayGenerationSettings,
  ParlayStrategy,
  RiskLevel,
} from "@/lib/bet/types";
import { RiskBadge, fmtAmerican, fmtPct, fmtSignedPct } from "./ui";
import { useBetSlip } from "./BetSlipProvider";

const STRATEGY_LABEL: Record<ParlayStrategy, string> = {
  conservative: "Conservador",
  balanced: "Balanceado",
  aggressive: "Agresivo",
  same_game: "Same Game",
  player_props: "Props jugador",
};

function ParlayResultCard({ p }: { p: ParlayCandidate }) {
  const { addPick } = useBetSlip();
  return (
    <div className="wc-card flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="chip bg-wc-gold/15 text-wc-gold">{STRATEGY_LABEL[p.strategy]}</span>
        <span className="text-sm font-bold tabular-nums text-wc-gold">{fmtAmerican(p.combinedAmericanOdds)}</span>
      </div>
      <ul className="space-y-0.5 text-xs text-wc-text">
        {p.picks.map((x) => (
          <li key={x.id} className="flex justify-between gap-2">
            <span className="truncate">{x.selection}</span>
            <span className="shrink-0 tabular-nums text-wc-muted">{fmtAmerican(x.americanOdds)}</span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-3 gap-1 text-center text-[11px]">
        <div>
          <div className={`font-bold tabular-nums ${p.estimatedEV >= 0 ? "text-wc-green" : "text-wc-red"}`}>{fmtSignedPct(p.estimatedEV)}</div>
          <div className="text-wc-muted">EV</div>
        </div>
        <div>
          <div className="font-bold tabular-nums text-wc-text">{fmtPct(p.estimatedJointProbability, 1)}</div>
          <div className="text-wc-muted">Prob.</div>
        </div>
        <div>
          <div className="font-bold tabular-nums text-wc-text">{p.confidenceScore}</div>
          <div className="text-wc-muted">Conf.</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1 text-[10px] text-wc-muted">
        Correlación <RiskBadge risk={p.correlationRisk} />
      </div>
      {p.warnings.length ? (
        <p className="text-[10px] text-amber-200/80">{p.warnings.join(" · ")}</p>
      ) : null}
      <button
        type="button"
        onClick={() => p.picks.forEach((x) => addPick(x))}
        className="min-h-[36px] rounded-lg bg-white/5 px-2 py-1.5 text-xs font-semibold text-wc-text hover:bg-white/10"
      >
        Cargar al ticket
      </button>
    </div>
  );
}

export function AIParlayGenerator({ pool }: { pool: BetSlipPick[] }) {
  const [count, setCount] = useState<ParlayGenerationSettings["combinationCount"]>(250);
  const [strategy, setStrategy] = useState<ParlayStrategy | "all">("all");
  const [maxRisk, setMaxRisk] = useState<RiskLevel>("medium");
  const [minConfidence, setMinConfidence] = useState(35);
  const [includeDemo, setIncludeDemo] = useState(true);
  const [sort, setSort] = useState<ParlaySort>("balance");
  const [parlays, setParlays] = useState<ParlayCandidate[] | null>(null);
  const [advice, setAdvice] = useState<AIParlayAdvice | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const eligibleCount = pool.filter((p) => p.edge > 0 && p.expectedValue > 0).length;

  const generate = () => {
    const settings: ParlayGenerationSettings = {
      combinationCount: count,
      maxPickCount: 5,
      minConfidence,
      maxRisk,
      includeDemo,
      strategy,
    };
    let result = generateParlayCombinations(pool, settings);
    if (strategy !== "all") result = result.filter((p) => p.strategy === strategy);
    setParlays(rankParlays(result, sort));
    setAdvice(null);
  };

  const analyzeWithAI = async () => {
    if (!parlays) return;
    setLoadingAI(true);
    try {
      const res = await fetch("/api/ai-parlay-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: parlays.slice(0, 50) }),
      });
      const json = await res.json();
      setAdvice(json?.ok ? (json.data as AIParlayAdvice) : null);
    } catch {
      setAdvice(null);
    } finally {
      setLoadingAI(false);
    }
  };

  const top = parlays ? rankParlays(parlays, sort).slice(0, 12) : [];

  return (
    <div className="space-y-4">
      <div className="wc-card space-y-3 p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-wc-text">AI Parlay Generator</h3>
            <p className="text-xs text-wc-muted">
              Genera combinaciones con <strong>valor estadístico y riesgo medido</strong>. La IA solo explica y
              clasifica; no inventa picks. {eligibleCount} picks elegibles (edge y EV positivos).
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Combinaciones">
            <Select value={`${count}`} onChange={(v) => setCount(Number(v) as ParlayGenerationSettings["combinationCount"])} options={[100, 250, 500, 1000].map((n) => ({ value: `${n}`, label: `${n}` }))} />
          </Field>
          <Field label="Estrategia">
            <Select value={strategy} onChange={(v) => setStrategy(v as ParlayStrategy | "all")} options={[{ value: "all", label: "Todas" }, { value: "conservative", label: "Conservador" }, { value: "balanced", label: "Balanceado" }, { value: "aggressive", label: "Agresivo" }, { value: "same_game", label: "Same Game" }, { value: "player_props", label: "Props jugador" }]} />
          </Field>
          <Field label="Ordenar por">
            <Select value={sort} onChange={(v) => setSort(v as ParlaySort)} options={[{ value: "balance", label: "Mejor balance" }, { value: "ev", label: "Mejor EV" }, { value: "confidence", label: "Mayor confianza" }, { value: "risk", label: "Menor riesgo" }, { value: "odds", label: "Momio más alto" }]} />
          </Field>
          <Field label={`Confianza mínima: ${minConfidence}`}>
            <input type="range" min={0} max={90} step={5} value={minConfidence} onChange={(e) => setMinConfidence(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-wc-gold" />
          </Field>
          <Field label="Riesgo máximo">
            <Select value={maxRisk} onChange={(v) => setMaxRisk(v as RiskLevel)} options={[{ value: "low", label: "Bajo" }, { value: "medium", label: "Medio" }, { value: "high", label: "Alto" }]} />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-xs text-wc-muted">
            <input type="checkbox" checked={includeDemo} onChange={(e) => setIncludeDemo(e.target.checked)} className="accent-wc-gold" />
            Incluir datos demo
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={generate} className="min-h-[40px] rounded-lg bg-wc-gold/15 px-4 py-2 text-sm font-semibold text-wc-gold hover:bg-wc-gold/25">
            Generar parleys
          </button>
          {parlays ? (
            <button type="button" onClick={analyzeWithAI} disabled={loadingAI} className="min-h-[40px] rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-wc-text hover:bg-white/5 disabled:opacity-50">
              {loadingAI ? "Analizando…" : "Analizar con IA"}
            </button>
          ) : null}
        </div>
      </div>

      {advice ? (
        <div className="wc-card space-y-2 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-wc-text">Análisis {advice.fromAI ? "(IA)" : "(ranking local)"}</h4>
            {!advice.fromAI ? <span className="chip bg-amber-400/15 text-amber-300">Fallback local</span> : <span className="chip bg-wc-green/15 text-wc-green">IA</span>}
          </div>
          <p className="text-sm text-wc-text">{advice.userFriendlySummary}</p>
          <p className="text-xs text-wc-muted">{advice.explanation}</p>
          {advice.finalRecommendation ? <p className="text-xs text-wc-gold">{advice.finalRecommendation}</p> : null}
          {advice.riskWarnings.length ? (
            <ul className="space-y-1 text-[11px] text-amber-100/90">
              {advice.riskWarnings.map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {parlays ? (
        parlays.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-wc-muted">
            No se generaron combinaciones con esos filtros (se necesitan ≥2 picks con edge y EV positivos).
          </p>
        ) : (
          <div>
            <p className="mb-2 text-xs text-wc-muted">{parlays.length} combinaciones generadas · mostrando top {top.length}.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {top.map((p) => (
                <ParlayResultCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
