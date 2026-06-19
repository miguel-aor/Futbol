"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Field, Select } from "@/components/analytics/primitives";
import { buildValuePicks, selectionToSlipPick } from "@/lib/bet/buildPicks";
import { rankBestValuePicks } from "@/lib/betBuilderModels";
import { dedupeSelections } from "@/lib/bet/dedupe";
import type { BetSelection, MarketCategory, RiskLevel } from "@/lib/bet/types";
import { PickTable } from "./PickTable";
import { BetSlip } from "./BetSlip";
import { AIParlayGenerator } from "./AIParlayGenerator";
import { DisclaimerBar } from "./ui";

const RISK_RANK: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2 };
type Sort = "ev" | "edge" | "confidence" | "risk" | "odds";

export function ValuePicksClient() {
  // Demo USA (local) + value picks de los próximos 8 partidos (API, server).
  const demoUsa = useMemo(() => buildValuePicks(), []);
  const [upcoming, setUpcoming] = useState<BetSelection[]>([]);
  const [imported, setImported] = useState<BetSelection[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/value-picks?limit=8")
      .then((r) => r.json())
      .then((j) => active && j?.ok && setUpcoming(j.data as BetSelection[]))
      .catch(() => {});
    try {
      const raw = window.localStorage.getItem("imported-picks");
      if (raw) setImported(JSON.parse(raw) as BetSelection[]);
    } catch {
      /* ignore */
    }
    return () => {
      active = false;
    };
  }, []);
  // Prioridad en duplicados: importado > upcoming(demo) > demo USA.
  const all = useMemo(
    () => dedupeSelections([...imported, ...upcoming, ...demoUsa]),
    [imported, upcoming, demoUsa],
  );
  const [category, setCategory] = useState<MarketCategory | "all">("all");
  const [source, setSource] = useState<"all" | "imported" | "manual" | "demo">("all");
  const [minConf, setMinConf] = useState(0);
  const [minEdge, setMinEdge] = useState(-20);
  const [maxRisk, setMaxRisk] = useState<RiskLevel>("high");
  const [onlyReal, setOnlyReal] = useState(false);
  const [sort, setSort] = useState<Sort>("ev");
  const [showParlays, setShowParlays] = useState(false);

  const filtered = useMemo(() => {
    let rows = all.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (source === "imported" && !p.source.startsWith("Imported")) return false;
      if (source === "manual" && p.source !== "Manual input") return false;
      if (source === "demo" && p.source !== "Demo") return false;
      if (p.confidenceScore < minConf) return false;
      if (p.edge * 100 < minEdge) return false;
      if (RISK_RANK[p.riskLevel] > RISK_RANK[maxRisk]) return false;
      if (onlyReal && p.isDemo) return false;
      return true;
    });
    const sorters: Record<Sort, (a: BetSelection, b: BetSelection) => number> = {
      ev: (a, b) => b.expectedValue - a.expectedValue,
      edge: (a, b) => b.edge - a.edge,
      confidence: (a, b) => b.confidenceScore - a.confidenceScore,
      risk: (a, b) => RISK_RANK[a.riskLevel] - RISK_RANK[b.riskLevel],
      odds: (a, b) => b.americanOdds - a.americanOdds,
    };
    rows = [...rows].sort(sorters[sort]);
    return sort === "ev" ? rankBestValuePicks(rows) : rows;
  }, [all, category, source, minConf, minEdge, maxRisk, onlyReal, sort]);

  const pool = useMemo(() => filtered.map(selectionToSlipPick), [filtered]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-wc-text">Value Picks</h1>
          <p className="text-sm text-wc-muted">Ranking de oportunidades por valor estadístico. {filtered.length} picks.</p>
          <p className="text-[11px] text-wc-muted/80">
            Mostrando próximos partidos no jugados. Los partidos finalizados solo se usan como histórico para el
            modelo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/importar"
            className="min-h-[40px] rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-wc-text hover:bg-white/5"
          >
            Importar momios
          </Link>
          <button
            type="button"
            onClick={() => setShowParlays((v) => !v)}
            className="min-h-[40px] rounded-lg bg-wc-gold/15 px-4 py-2 text-sm font-semibold text-wc-gold hover:bg-wc-gold/25"
          >
            {showParlays ? "Ocultar parleys" : "Generar parleys"}
          </button>
        </div>
      </div>

      <DisclaimerBar compact />

      <div className="wc-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Mercado">
          <Select value={category} onChange={(v) => setCategory(v as MarketCategory | "all")} options={[{ value: "all", label: "Todos" }, { value: "match", label: "Partido" }, { value: "team", label: "Equipo" }, { value: "player", label: "Jugador" }]} />
        </Field>
        <Field label="Fuente">
          <Select value={source} onChange={(v) => setSource(v as "all" | "imported" | "manual" | "demo")} options={[{ value: "all", label: "Todas" }, { value: "imported", label: "Imported CSV/JSON" }, { value: "manual", label: "Manual input" }, { value: "demo", label: "Demo" }]} />
        </Field>
        <Field label="Ordenar por">
          <Select value={sort} onChange={(v) => setSort(v as Sort)} options={[{ value: "ev", label: "Mejor EV" }, { value: "edge", label: "Mayor edge" }, { value: "confidence", label: "Mayor confianza" }, { value: "risk", label: "Menor riesgo" }, { value: "odds", label: "Momio más alto" }]} />
        </Field>
        <Field label="Riesgo máximo">
          <Select value={maxRisk} onChange={(v) => setMaxRisk(v as RiskLevel)} options={[{ value: "high", label: "Cualquiera" }, { value: "medium", label: "Medio o menos" }, { value: "low", label: "Solo bajo" }]} />
        </Field>
        <Field label={`Confianza mínima: ${minConf}`}>
          <input type="range" min={0} max={90} step={5} value={minConf} onChange={(e) => setMinConf(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-wc-gold" />
        </Field>
        <Field label={`Edge mínimo: ${minEdge}%`}>
          <input type="range" min={-20} max={20} step={1} value={minEdge} onChange={(e) => setMinEdge(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-wc-gold" />
        </Field>
        <label className="flex items-end gap-2 pb-2 text-xs text-wc-muted">
          <input type="checkbox" checked={onlyReal} onChange={(e) => setOnlyReal(e.target.checked)} className="accent-wc-gold" />
          Solo datos reales (excluir demo)
        </label>
      </div>

      {showParlays ? <AIParlayGenerator pool={pool} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <PickTable rows={filtered} />
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <BetSlip />
        </aside>
      </div>
    </div>
  );
}
