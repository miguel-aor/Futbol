// =====================================================================
// modelAgreement.ts — coincidencia entre modelos independientes.
//
// Para mercados de resultado compara dos señales independientes:
//   1) Poisson/Dixon-Coles (probabilidad ya calculada desde xG)
//   2) Elo derivado de la fuerza de selección (teamStrength → rating Elo)
// Si coinciden, sube la confianza; si se contradicen, baja y sube el riesgo.
// Para mercados con una sola señal devuelve "modelo único" (coincidencia media).
// =====================================================================

import { eloMatchProbabilities } from "@/lib/footballModels";
import type { MarketType } from "@/lib/bet/types";
import type { StrengthContext } from "@/lib/teamStrength";

export interface ModelAgreementResult {
  /** 0-1: 1 = modelos totalmente de acuerdo. */
  score: number;
  label: string;
  note: string;
  /** Nº de modelos independientes comparados. */
  models: number;
}

export interface AgreementInput {
  marketType: MarketType;
  selection: string;
  modelProbability: number;
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  teamId?: string;
  ctx: StrengthContext;
}

/** Convierte fuerza 0-100 en un rating Elo aproximado. */
function strengthToElo(strength: number): number {
  return 1500 + strength * 7; // 18→1626, 96→2172
}

function side(input: AgreementInput): "home" | "away" | "draw" | "none" {
  const sel = input.selection.toLowerCase();
  if (sel.includes("empate") || sel.includes("draw")) return "draw";
  if (input.teamId === input.awayId || sel.includes(input.awayName.toLowerCase())) return "away";
  if (input.teamId === input.homeId || sel.includes(input.homeName.toLowerCase())) return "home";
  return "none";
}

const RESULT_MARKETS: MarketType[] = ["match_result", "double_chance", "asian_handicap", "team_win_either_half"];

function labelFor(score: number, models: number): { label: string; note: string } {
  if (models < 2) return { label: "Modelo único", note: "Sin segunda señal independiente para este mercado." };
  if (score >= 0.75) return { label: "Alta coincidencia entre modelos", note: "Poisson y Elo concuerdan." };
  if (score >= 0.45) return { label: "Coincidencia parcial", note: "Poisson y Elo difieren algo." };
  return { label: "Modelos divididos", note: "Poisson y Elo se contradicen: pick de mayor riesgo." };
}

export function calculateModelAgreement(input: AgreementInput): ModelAgreementResult {
  const isResult = RESULT_MARKETS.includes(input.marketType);
  if (!isResult) {
    const { label, note } = labelFor(0.6, 1);
    return { score: 0.6, label, note, models: 1 };
  }

  const elo = eloMatchProbabilities(
    strengthToElo(input.ctx.home.strength),
    strengthToElo(input.ctx.away.strength),
  );
  const s = side(input);

  // Probabilidad Elo equivalente a la selección.
  let pElo: number;
  const sel = input.selection.toLowerCase();
  if (input.marketType === "double_chance") {
    const hasHome = sel.includes(input.homeName.toLowerCase());
    const hasAway = sel.includes(input.awayName.toLowerCase());
    const hasDraw = sel.includes("empate") || sel.includes("draw");
    if (hasHome && hasDraw) pElo = elo.homeWin + elo.draw;
    else if (hasAway && hasDraw) pElo = elo.awayWin + elo.draw;
    else if (hasHome && hasAway) pElo = elo.homeWin + elo.awayWin;
    else pElo = elo.homeWin + elo.draw;
  } else if (s === "draw") {
    pElo = elo.draw;
  } else if (s === "away") {
    pElo = elo.awayWin;
  } else if (s === "home") {
    pElo = elo.homeWin;
  } else {
    // No se pudo mapear el lado → tratar como modelo único.
    const { label, note } = labelFor(0.6, 1);
    return { score: 0.6, label, note, models: 1 };
  }

  const diff = Math.abs(input.modelProbability - pElo);
  const score = Number(Math.max(0, Math.min(1, 1 - diff / 0.22)).toFixed(2));
  const { label, note } = labelFor(score, 2);
  return { score, label, note, models: 2 };
}
