// =====================================================================
// Tipos del Odds Feed.
//
// Este proyecto NO realiza scraping de casas de apuestas. Los momios pueden
// venir de input manual, importación CSV/JSON o una API autorizada. Estos
// tipos describen un feed genérico para Value Picks.
// =====================================================================

import type { BetSource, MarketCategory, MarketType, Reliability } from "@/lib/bet/types";

export type OddsProviderType = "manual" | "demo" | "imported" | "api";

export interface OddsProviderInfo {
  id: string;
  name: string;
  type: OddsProviderType;
  enabled: boolean;
  reliability: Reliability;
  lastSync: string | null;
  notes?: string;
}

export interface OddsFeedEvent {
  id: string;
  providerEventId: string | null;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string | null;
  competition: string | null;
  provider: string;
  source: BetSource;
  reliability: Reliability;
  lastUpdated: string;
}

export interface OddsFeedMarket {
  id: string;
  eventId: string;
  matchId: string;
  marketType: MarketType;
  marketCategory: MarketCategory;
  label: string;
  source: BetSource;
  reliability: Reliability;
  lastUpdated: string;
}

export interface OddsFeedSelection {
  id: string;
  marketId: string;
  matchId: string;
  marketType: MarketType;
  selection: string;
  team: string | null;
  playerName: string | null;
  line: number | null;
  americanOdds: number;
  decimalOdds: number;
  impliedProbability: number;
  provider: string;
  source: BetSource;
  reliability: Reliability;
  lastUpdated: string;
  isLive: boolean;
  isManual: boolean;
  isDemo: boolean;
  isImported: boolean;
}
