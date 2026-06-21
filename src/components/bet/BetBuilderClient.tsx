"use client";

import { useEffect, useMemo, useState } from "react";
import { Field, Select } from "@/components/analytics/primitives";
import { DEMO_MATCH } from "@/data/betBuilderMock";
import { buildValuePicks, selectionToSlipPick } from "@/lib/bet/buildPicks";
import {
  getUpcomingEligibleMatches,
  isMatchEligibleForPicks,
  type EligibilityMatch,
} from "@/lib/bet/eligibility";
import { dedupeMatches } from "@/lib/bet/dedupe";
import { filterBettable, isDemoEnabled } from "@/lib/bet/bettable";
import type { MatchModelParams } from "@/lib/bet/types";
import type { MatchupPrediction, WorldCupMatch } from "@/lib/worldcup-2026/types";
import { MarketEntryForm, type BuilderMatch } from "./MarketEntryForm";
import { BetSlip } from "./BetSlip";
import { AIParlayGenerator } from "./AIParlayGenerator";
import { DisclaimerBar } from "./ui";
import { useBetSlip } from "./BetSlipProvider";

const DEFAULT_LAMBDAS = { cornersLambda: 10, cardsLambda: 4.6, offsidesLambda: 3.4, penaltyProb: 0.24 };

interface SelMatch extends EligibilityMatch {
  id: string;
  name: string;
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  isDemo: boolean;
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    const j = await r.json();
    return j?.ok ? (j.data as T) : null;
  } catch {
    return null;
  }
}

export function BetBuilderClient() {
  const { picks } = useBetSlip();
  const [wc, setWc] = useState<WorldCupMatch[]>([]);
  const [selectedId, setSelectedId] = useState<string>(DEMO_MATCH.id);
  const [match, setMatch] = useState<BuilderMatch>({
    id: DEMO_MATCH.id,
    name: DEMO_MATCH.name,
    params: DEMO_MATCH.params,
    isDemo: true,
    eligible: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<WorldCupMatch[]>("/api/worldcup-2026/matches").then((m) => active && m && setWc(m));
    try {
      const q = new URLSearchParams(window.location.search).get("match");
      if (q) setSelectedId(q);
    } catch {
      /* ignore */
    }
    return () => {
      active = false;
    };
  }, []);

  // Lista unificada (demo + reales) y SOLO próximos elegibles (máx 8).
  const eligibleMatches = useMemo<SelMatch[]>(() => {
    const demo: SelMatch = {
      id: DEMO_MATCH.id,
      name: DEMO_MATCH.name,
      homeId: DEMO_MATCH.params.homeId,
      awayId: DEMO_MATCH.params.awayId,
      homeName: DEMO_MATCH.params.homeName,
      awayName: DEMO_MATCH.params.awayName,
      isDemo: true,
      kickoff: DEMO_MATCH.kickoff,
      status: "scheduled",
      homeScore: null,
      awayScore: null,
    };
    const real: SelMatch[] = wc.map((m) => ({
      id: m.id,
      name: `${m.homeName} vs ${m.awayName}`,
      homeId: m.homeId,
      awayId: m.awayId,
      homeName: m.homeName,
      awayName: m.awayName,
      isDemo: false,
      kickoff: m.kickoff,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
    }));
    const deduped = dedupeMatches([demo, ...real], (m) => ({ home: m.homeName, away: m.awayName, kickoff: m.kickoff, isDemo: m.isDemo }));
    return getUpcomingEligibleMatches(deduped, { limit: 8 });
  }, [wc]);

  // Construir el modelo del partido seleccionado.
  useEffect(() => {
    let active = true;
    const sel = eligibleMatches.find((m) => m.id === selectedId) ?? eligibleMatches[0];
    if (!sel) return;
    const eligible = isMatchEligibleForPicks(sel);
    if (sel.isDemo) {
      setMatch({ id: DEMO_MATCH.id, name: DEMO_MATCH.name, params: DEMO_MATCH.params, isDemo: true, eligible });
      return;
    }
    setLoading(true);
    getJson<MatchupPrediction>(`/api/worldcup-2026/matchup?home=${sel.homeId}&away=${sel.awayId}`).then((pred) => {
      if (!active) return;
      const params: MatchModelParams = {
        homeId: sel.homeId,
        awayId: sel.awayId,
        homeName: sel.homeName,
        awayName: sel.awayName,
        homeXG: pred?.homeXG ?? 1.4,
        awayXG: pred?.awayXG ?? 1.1,
        ...DEFAULT_LAMBDAS,
      };
      setMatch({ id: sel.id, name: sel.name, params, isDemo: false, eligible });
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [selectedId, eligibleMatches]);

  const matchOptions = eligibleMatches.map((m) => ({
    value: m.id,
    label: `${m.name}${m.isDemo ? " (demo)" : ""} — ${m.kickoff.slice(5, 10)} ${m.kickoff.slice(11, 16)} UTC`,
  }));

  const demoPool = useMemo(() => (isDemoEnabled() ? buildValuePicks().map(selectionToSlipPick) : []), []);
  const pool = useMemo(() => {
    const seen = new Set(picks.map((p) => p.selectionId));
    return filterBettable([...picks, ...demoPool.filter((p) => !seen.has(p.selectionId))]);
  }, [picks, demoPool]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-wc-text">Bet Builder</h1>
        <p className="text-sm text-wc-muted">
          Bet Builder usa captura manual. Verifica línea y momio antes de usar la información. Elige un partido
          próximo, captura mercado/línea/momio y el motor calcula edge, EV, confianza y riesgo.
        </p>
      </div>

      <DisclaimerBar compact />

      <div className="wc-card p-4">
        {eligibleMatches.length === 0 ? (
          <p className="text-sm text-wc-muted">No hay partidos próximos elegibles para capturar picks.</p>
        ) : (
          <Field label="Selecciona un partido próximo">
            <Select value={selectedId} onChange={setSelectedId} options={matchOptions} />
          </Field>
        )}
        {loading ? <p className="mt-2 text-xs text-wc-muted">Cargando modelo del partido…</p> : null}
      </div>

      {eligibleMatches.length > 0 ? <MarketEntryForm match={match} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <AIParlayGenerator pool={pool} />
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <BetSlip />
        </aside>
      </div>
    </div>
  );
}
