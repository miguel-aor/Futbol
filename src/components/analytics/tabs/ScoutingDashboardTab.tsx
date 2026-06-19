"use client";

import { useEffect, useState } from "react";
import { MOCK_RECRUITMENT, MOCK_SCOUTING_PLAYERS } from "@/data/footballAnalyticsMock";
import type { ScoutingPlayer } from "@/lib/analytics/types";
import { InfoBox, TabNav, type TabItem } from "../primitives";
import { PlayerDiscoveryTab } from "./PlayerDiscoveryTab";
import { SimilarPlayersTab } from "./SimilarPlayersTab";
import { HiddenGemsTab } from "./HiddenGemsTab";
import { RecruitmentShortlistTab } from "./RecruitmentShortlistTab";
import { PlayerRiskReportTab } from "./PlayerRiskReportTab";

const SUBTABS: TabItem[] = [
  { key: "discovery", label: "Player Discovery" },
  { key: "similar", label: "Similar Players" },
  { key: "gems", label: "Hidden Gems" },
  { key: "shortlist", label: "Recruitment Shortlist" },
  { key: "risk", label: "Player Risk Report" },
];

const STORAGE_KEY = "analytics-shortlist";
const SEED_IDS = MOCK_RECRUITMENT.map((r) => r.id);

export function ScoutingDashboardTab() {
  const [sub, setSub] = useState("discovery");
  const [ids, setIds] = useState<string[]>(SEED_IDS);

  // Cargar shortlist guardada (solo en cliente, tras montar → sin desajuste SSR).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setIds(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [ids]);

  const shortlistIds = new Set(ids);
  const shortlist: ScoutingPlayer[] = ids
    .map((id) => MOCK_SCOUTING_PLAYERS.find((p) => p.id === id))
    .filter((p): p is ScoutingPlayer => Boolean(p));

  const onAdd = (p: ScoutingPlayer) =>
    setIds((prev) => (prev.includes(p.id) ? prev : [...prev, p.id]));
  const onRemove = (id: string) => setIds((prev) => prev.filter((x) => x !== id));

  return (
    <div className="space-y-5">
      <InfoBox>
        El scouting estadístico no reemplaza el análisis de video ni la evaluación humana. Su función es reducir
        el universo de jugadores, detectar perfiles interesantes y priorizar candidatos para revisión.
      </InfoBox>

      <div className="flex items-center justify-between gap-3">
        <TabNav tabs={SUBTABS} active={sub} onChange={setSub} variant="sub" label="Herramientas de scouting" />
        <span className="shrink-0 text-xs text-wc-muted">{shortlist.length} en shortlist</span>
      </div>

      {sub === "discovery" ? <PlayerDiscoveryTab shortlistIds={shortlistIds} onAdd={onAdd} /> : null}
      {sub === "similar" ? <SimilarPlayersTab /> : null}
      {sub === "gems" ? <HiddenGemsTab shortlistIds={shortlistIds} onAdd={onAdd} /> : null}
      {sub === "shortlist" ? <RecruitmentShortlistTab shortlist={shortlist} onRemove={onRemove} /> : null}
      {sub === "risk" ? <PlayerRiskReportTab /> : null}
    </div>
  );
}
