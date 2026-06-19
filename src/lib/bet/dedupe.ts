// =====================================================================
// dedupe.ts — evita que un mismo partido aparezca dos veces (p. ej. el demo
// USA vs Australia y el fixture real wc-D-3).
//
// Reglas:
//  - El fixture REAL del Mundial prevalece como match base sobre el demo.
//  - Los mercados/momios demo se conservan, pero "cuelgan" del matchId real
//    (se reasigna su matchId al real), no crean otro partido.
//  - Mismos equipos + misma fecha = duplicado.
//  - En selecciones idénticas (mismo mercado/línea) se conserva la de mayor
//    prioridad de fuente: API > Imported > Manual > Demo.
// =====================================================================

import type { BetSelection, BetSource } from "./types";

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Prioridad de fuente (menor = mejor). */
export function sourceRank(s: BetSource): number {
  if (s === "365Scores") return 0;
  if (s === "Fallback") return 0; // API autorizada genérica
  if (s === "Manual input") return 2;
  if (s === "Demo") return 3;
  return 4;
}

/** ¿Es un matchId de fixture real del Mundial? */
function isRealMatchId(id: string): boolean {
  return id.startsWith("wc-");
}

/**
 * Deduplica selecciones: reasigna las de partidos duplicados al matchId real y
 * elimina selecciones repetidas (mismo mercado/selección/línea) conservando la
 * de mayor prioridad de fuente.
 */
export function dedupeSelections(selections: BetSelection[]): BetSelection[] {
  // 1) matchId canónico por partido (clave = nombre del partido). Real gana.
  const realByName = new Map<string, { id: string; name: string }>();
  const anyByName = new Map<string, { id: string; name: string }>();
  for (const s of selections) {
    const key = norm(s.matchName);
    if (!anyByName.has(key)) anyByName.set(key, { id: s.matchId, name: s.matchName });
    if (isRealMatchId(s.matchId) && !realByName.has(key)) realByName.set(key, { id: s.matchId, name: s.matchName });
  }
  const canonical = (matchName: string) => {
    const key = norm(matchName);
    return realByName.get(key) ?? anyByName.get(key)!;
  };

  // 2) Reasignar al matchId canónico y deduplicar por mercado/selección/línea.
  const best = new Map<string, BetSelection>();
  for (const s of selections) {
    const canon = canonical(s.matchName);
    const remapped: BetSelection = { ...s, matchId: canon.id, matchName: canon.name };
    const dkey = `${canon.id}|${s.marketType}|${norm(s.selection)}|${s.line ?? "-"}`;
    const existing = best.get(dkey);
    if (!existing || sourceRank(s.source) < sourceRank(existing.source)) best.set(dkey, remapped);
  }
  return [...best.values()];
}

/**
 * Deduplica partidos para selectores/listas: mismo home+away+fecha → uno solo,
 * prefiriendo el real (no demo). Mantiene el orden de aparición.
 */
export function dedupeMatches<T>(
  items: T[],
  get: (t: T) => { home: string; away: string; kickoff: string; isDemo: boolean },
): T[] {
  const seen = new Map<string, T>();
  for (const it of items) {
    const g = get(it);
    const key = `${norm(g.home)}|${norm(g.away)}|${g.kickoff.slice(0, 10)}`;
    const cur = seen.get(key);
    if (!cur) {
      seen.set(key, it);
    } else if (get(cur).isDemo && !g.isDemo) {
      seen.set(key, it); // el real reemplaza al demo (conserva posición)
    }
  }
  return [...seen.values()];
}
