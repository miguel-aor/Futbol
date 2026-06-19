"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TabNav } from "@/components/analytics/primitives";
import { DEMO_MATCH } from "@/data/betBuilderMock";
import { buildValuePicks } from "@/lib/bet/buildPicks";
import { getPlayersForMatch } from "@/lib/bet/marketHelpers";
import {
  isMatchEligibleForPicks,
  normalizeMatchStatus,
  statusLabel,
  type EligibilityMatch,
} from "@/lib/bet/eligibility";
import { rankBestValuePicks } from "@/lib/betBuilderModels";
import type { BetSelection, MatchModelParams } from "@/lib/bet/types";
import type { MatchupPrediction, WorldCupMatch } from "@/lib/worldcup-2026/types";
import { PickCard } from "./PickCard";
import { BetSlip } from "./BetSlip";
import { MarketEntryForm, type BuilderMatch } from "./MarketEntryForm";
import { DisclaimerBar, fmtSignedPct } from "./ui";

const DEFAULT_LAMBDAS = { cornersLambda: 10, cardsLambda: 4.6, offsidesLambda: 3.4, penaltyProb: 0.24 };

const TABS = [
  { key: "picks", label: "Picks recomendadas" },
  { key: "markets", label: "Mercados" },
  { key: "players", label: "Jugadores" },
  { key: "ticket", label: "Ticket" },
];

interface MatchMeta {
  id: string;
  homeName: string;
  awayName: string;
  homeId: string;
  awayId: string;
  kickoff: string;
  competition: string;
  status: ReturnType<typeof normalizeMatchStatus>;
  eligible: boolean;
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

export function MatchAnalysisClient({ matchId }: { matchId: string }) {
  const [tab, setTab] = useState("picks");
  const [meta, setMeta] = useState<MatchMeta | null>(null);
  const [params, setParams] = useState<MatchModelParams | null>(null);
  const [picks, setPicks] = useState<BetSelection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (matchId === DEMO_MATCH.id) {
        const el: EligibilityMatch = { kickoff: DEMO_MATCH.kickoff, status: "scheduled" };
        if (!active) return;
        setMeta({
          id: DEMO_MATCH.id,
          homeName: DEMO_MATCH.params.homeName,
          awayName: DEMO_MATCH.params.awayName,
          homeId: DEMO_MATCH.params.homeId,
          awayId: DEMO_MATCH.params.awayId,
          kickoff: DEMO_MATCH.kickoff,
          competition: DEMO_MATCH.competition,
          status: normalizeMatchStatus(el),
          eligible: isMatchEligibleForPicks(el),
          isDemo: true,
        });
        setParams(DEMO_MATCH.params);
        setPicks(buildValuePicks().filter((p) => p.matchId === DEMO_MATCH.id));
        setLoading(false);
        return;
      }
      const [matches, vp] = await Promise.all([
        getJson<WorldCupMatch[]>("/api/worldcup-2026/matches"),
        getJson<BetSelection[]>("/api/value-picks?limit=16"),
      ]);
      const m = matches?.find((x) => x.id === matchId);
      if (!m) {
        if (active) setLoading(false);
        return;
      }
      const pred = await getJson<MatchupPrediction>(`/api/worldcup-2026/matchup?home=${m.homeId}&away=${m.awayId}`);
      if (!active) return;
      setMeta({
        id: m.id,
        homeName: m.homeName,
        awayName: m.awayName,
        homeId: m.homeId,
        awayId: m.awayId,
        kickoff: m.kickoff,
        competition: `Mundial 2026 · Grupo ${m.group}`,
        status: normalizeMatchStatus(m),
        eligible: isMatchEligibleForPicks(m),
        isDemo: false,
      });
      setParams({
        homeId: m.homeId,
        awayId: m.awayId,
        homeName: m.homeName,
        awayName: m.awayName,
        homeXG: pred?.homeXG ?? 1.4,
        awayXG: pred?.awayXG ?? 1.1,
        ...DEFAULT_LAMBDAS,
      });
      setPicks((vp ?? []).filter((p) => p.matchId === matchId));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [matchId]);

  const builderMatch: BuilderMatch | null = useMemo(
    () => (meta && params ? { id: meta.id, name: `${meta.homeName} vs ${meta.awayName}`, params, isDemo: meta.isDemo, eligible: meta.eligible } : null),
    [meta, params],
  );

  if (loading) {
    return <p className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-wc-muted">Cargando partido…</p>;
  }
  if (!meta) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-wc-muted">Partido no encontrado.</p>
        <Link href="/partidos" className="text-sm text-wc-gold hover:underline">← Volver a Partidos</Link>
      </div>
    );
  }

  const positive = rankBestValuePicks(picks.filter((p) => p.expectedValue > 0));
  const avoid = picks.filter((p) => p.rating === "avoid" || p.expectedValue <= 0);
  const playerPicks = picks.filter((p) => p.category === "player");
  const players = getPlayersForMatch(meta.id);

  return (
    <div className="space-y-5">
      <Link href="/partidos" className="text-xs text-wc-muted hover:text-wc-text">← Partidos</Link>

      <header className="wc-card wc-ring p-5">
        <h1 className="text-2xl font-bold text-wc-text">
          {meta.homeName} <span className="text-wc-muted">vs</span> {meta.awayName}
        </h1>
        <p className="text-xs text-wc-muted">{meta.competition}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`chip ${meta.eligible ? "bg-wc-green/15 text-wc-green" : "bg-amber-400/15 text-amber-300"}`}>
            {statusLabel(meta.status)}
          </span>
          {meta.isDemo ? <span className="chip bg-amber-400/15 text-amber-300">Demo data</span> : <span className="chip border border-white/10 bg-white/5 text-wc-muted">Momios demo (modelo)</span>}
        </div>
      </header>

      <DisclaimerBar compact />

      {!meta.eligible ? (
        <div className="rounded-xl border border-wc-red/30 bg-wc-red/5 p-4 text-sm text-wc-red">
          Este partido no es elegible para nuevas picks (finalizado o sin verificar). Revisa su histórico en{" "}
          <Link href="/analytics" className="underline">Research</Link>.
        </div>
      ) : (
        <>
          <TabNav tabs={TABS} active={tab} onChange={setTab} variant="primary" label="Análisis del partido" />

          <div role="tabpanel">
            {tab === "picks" ? (
              <div className="space-y-5">
                {positive.length ? (
                  <div>
                    <h2 className="mb-3 text-lg font-semibold text-wc-text">Mejores picks</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {positive.slice(0, 9).map((p) => (
                        <PickCard key={p.id} pick={p} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-wc-muted">
                    No hay picks con valor estimado positivo para este partido. Usa Mercados para capturar líneas.
                  </div>
                )}
                {avoid.length ? (
                  <div>
                    <h2 className="mb-3 text-lg font-semibold text-wc-text">Picks a evitar</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {avoid.slice(0, 6).map((p) => (
                        <PickCard key={p.id} pick={p} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === "markets" && builderMatch ? <MarketEntryForm match={builderMatch} /> : null}

            {tab === "players" ? (
              <div className="space-y-4">
                {players.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-sm text-wc-muted">
                    No hay jugadores confirmados para este partido. Puedes capturar props por jugador manualmente en
                    la pestaña <strong className="text-wc-text">Mercados</strong> (categoría Jugador); el riesgo será mayor.
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-wc-muted">{players.length} jugadores del partido. Props disponibles:</p>
                    {playerPicks.length ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {rankBestValuePicks(playerPicks).map((p) => (
                          <PickCard key={p.id} pick={p} />
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {players.map((pl) => (
                          <div key={pl.id} className="wc-card p-3 text-sm">
                            <div className="font-medium text-wc-text">{pl.name}</div>
                            <div className="text-xs text-wc-muted">{pl.position}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : null}

            {tab === "ticket" ? (
              <div className="lg:max-w-md">
                <BetSlip />
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
