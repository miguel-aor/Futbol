// =====================================================================
// oddsProvider.ts — capa genérica de fuentes de momios.
//
// REGLAS DE SEGURIDAD (no negociables):
//  - NO scraping de PlayDoit ni de ninguna casa de apuestas.
//  - NO automatizar login ni evadir protecciones anti-bot.
//  - NO depender de capturas como fuente automática.
//  - Una línea capturada a mano es "Manual input"; NUNCA se afirma que viene
//    de PlayDoit ni de otra casa.
//  - Una fuente real de momios solo se conecta vía API oficial/proveedor
//    autorizado (FutureApiOddsProvider), nunca por extracción directa de su web.
//
// Interfaz común para que el motor consuma momios sin importar el origen.
// =====================================================================

import { DEMO_MARKETS } from "@/data/betBuilderMock";
import type {
  BetMarket,
  BetSource,
  MarketCategory,
  MarketType,
  Reliability,
} from "./types";

/** Un momio de un mercado, con su procedencia. */
export interface OddsQuote {
  providerName: string;
  source: BetSource;
  matchId: string;
  marketType: MarketType;
  selection: string;
  line: number | null;
  americanOdds: number;
  decimalOdds: number;
  lastUpdated: string;
  reliability: Reliability;
  isLive: boolean;
  isManual: boolean;
  // Metadatos opcionales para el motor.
  label?: string;
  category?: MarketCategory;
  oppositeAmericanOdds?: number | null;
  modelLambda?: number | null;
  playerId?: string;
  teamId?: string;
}

/** Interfaz que cualquier fuente de momios debe cumplir. */
export interface OddsProvider {
  readonly providerName: string;
  readonly source: BetSource;
  /** ¿La fuente está conectada/lista para usarse? */
  isAvailable(): boolean;
  /** Devuelve momios (de un partido o todos). NUNCA lanza: en error → []. */
  getOdds(matchId?: string): Promise<OddsQuote[]>;
}

// --------------------------------------------------------------------- //
// Helpers de momios
// --------------------------------------------------------------------- //
function americanToDecimal(odds: number): number {
  if (odds === 0) return 1;
  return odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds);
}

function categoryOf(marketType: MarketType): MarketCategory {
  if (marketType.startsWith("player_") || marketType === "anytime_goalscorer" || marketType === "first_goalscorer" || marketType === "goalkeeper_saves")
    return "player";
  if (marketType.startsWith("team_")) return "team";
  return "match";
}

/** Convierte un OddsQuote en BetMarket que el motor (buildPicks) evalúa. */
export function oddsQuoteToMarket(q: OddsQuote, id: string): BetMarket {
  return {
    id,
    matchId: q.matchId,
    category: q.category ?? categoryOf(q.marketType),
    marketType: q.marketType,
    label: q.label ?? q.marketType,
    selection: q.selection,
    line: q.line,
    americanOdds: q.americanOdds,
    oppositeAmericanOdds: q.oppositeAmericanOdds ?? null,
    modelLambda: q.modelLambda ?? null,
    playerId: q.playerId,
    teamId: q.teamId,
    source: q.source,
    reliability: q.reliability,
    isDemo: q.source === "Demo",
    lastUpdated: q.lastUpdated,
  };
}

// --------------------------------------------------------------------- //
// 1) Manual — el usuario captura línea y momio a mano
// --------------------------------------------------------------------- //
export interface ManualQuoteInput {
  matchId: string;
  marketType: MarketType;
  selection: string;
  line: number | null;
  americanOdds: number;
  label?: string;
  oppositeAmericanOdds?: number | null;
  modelLambda?: number | null;
  playerId?: string;
  teamId?: string;
  isLive?: boolean;
}

/** Crea un OddsQuote a partir de una captura manual del usuario. */
export function createManualQuote(input: ManualQuoteInput, now: string): OddsQuote {
  return {
    providerName: "Manual input",
    source: "Manual input",
    matchId: input.matchId,
    marketType: input.marketType,
    selection: input.selection,
    line: input.line,
    americanOdds: input.americanOdds,
    decimalOdds: americanToDecimal(input.americanOdds),
    lastUpdated: now,
    reliability: "medium",
    isLive: input.isLive ?? false,
    isManual: true,
    label: input.label,
    category: categoryOf(input.marketType),
    oppositeAmericanOdds: input.oppositeAmericanOdds ?? null,
    modelLambda: input.modelLambda ?? null,
    playerId: input.playerId,
    teamId: input.teamId,
  };
}

export class ManualOddsProvider implements OddsProvider {
  readonly providerName = "Manual input";
  readonly source: BetSource = "Manual input";
  private quotes: OddsQuote[] = [];

  add(input: ManualQuoteInput, now: string): OddsQuote {
    const q = createManualQuote(input, now);
    this.quotes.push(q);
    return q;
  }
  clear(): void {
    this.quotes = [];
  }
  isAvailable(): boolean {
    return true;
  }
  async getOdds(matchId?: string): Promise<OddsQuote[]> {
    return matchId ? this.quotes.filter((q) => q.matchId === matchId) : this.quotes;
  }
}

// --------------------------------------------------------------------- //
// 2) Demo — momios de ejemplo (los del mock), claramente marcados
// --------------------------------------------------------------------- //
export class DemoOddsProvider implements OddsProvider {
  readonly providerName = "Demo";
  readonly source: BetSource = "Demo";
  isAvailable(): boolean {
    return true;
  }
  async getOdds(matchId?: string): Promise<OddsQuote[]> {
    const markets: BetMarket[] = matchId
      ? DEMO_MARKETS.filter((m) => m.matchId === matchId)
      : DEMO_MARKETS;
    return markets.map((m) => ({
      providerName: "Demo",
      source: "Demo",
      matchId: m.matchId,
      marketType: m.marketType,
      selection: m.selection,
      line: m.line,
      americanOdds: m.americanOdds,
      decimalOdds: americanToDecimal(m.americanOdds),
      lastUpdated: m.lastUpdated,
      reliability: "demo",
      isLive: false,
      isManual: false,
      label: m.label,
      category: m.category,
      oppositeAmericanOdds: m.oppositeAmericanOdds ?? null,
      modelLambda: m.modelLambda ?? null,
      playerId: m.playerId,
      teamId: m.teamId,
    }));
  }
}

// --------------------------------------------------------------------- //
// 3) FutureApi — placeholder para una fuente AUTORIZADA (API oficial)
// --------------------------------------------------------------------- //
/**
 * Provider para una futura API autorizada de momios. NO está conectado y NO
 * hace scraping: solo define el contrato. Cuando exista una fuente permitida,
 * se configura `baseUrl` + `apiKeyEnv` y se implementa el fetch a su API
 * oficial. Mientras `isAvailable()` sea false, devuelve [] sin romper nada.
 */
export class FutureApiOddsProvider implements OddsProvider {
  readonly providerName: string;
  readonly source: BetSource;
  private baseUrl: string | null;

  constructor(opts: { providerName?: string; baseUrl?: string | null } = {}) {
    this.providerName = opts.providerName ?? "Fallback";
    this.source = "Fallback";
    this.baseUrl = opts.baseUrl ?? null;
  }

  isAvailable(): boolean {
    return Boolean(this.baseUrl);
  }

  async getOdds(): Promise<OddsQuote[]> {
    // No conectado todavía. Cuando se autorice una fuente, aquí iría el fetch
    // a su API OFICIAL (no a su web). Por ahora no devuelve momios.
    if (!this.isAvailable()) return [];
    return [];
  }
}

// --------------------------------------------------------------------- //
// Registro / selección de provider activo
// --------------------------------------------------------------------- //
export type OddsProviderKind = "manual" | "demo" | "api";

/**
 * Devuelve el provider activo. Por defecto Demo (+ Manual siempre disponible).
 * Una API autorizada solo se activa configurando su base de forma explícita.
 */
export function getOddsProvider(kind?: OddsProviderKind): OddsProvider {
  switch (kind) {
    case "manual":
      return new ManualOddsProvider();
    case "api":
      return new FutureApiOddsProvider({
        providerName: process.env.ODDS_PROVIDER_NAME ?? "Fallback",
        baseUrl: process.env.ODDS_API_BASE_URL ?? null,
      });
    case "demo":
    default:
      return new DemoOddsProvider();
  }
}

/** Aviso visible para el usuario sobre captura manual de momios. */
export const ODDS_MANUAL_NOTICE =
  "Los momios pueden capturarse manualmente. Verifica línea y momio antes de usar la información.";
