// =====================================================================
// ARBITROS internacionales (pool de referencia para el Mundial 2026).
//
// Los NOMBRES son de conocimiento publico (arbitros FIFA de elite); la
// designacion por partido NO es oficial: se asigna de forma determinista
// en el builder. Las METRICAS (tarjetas/faltas/penales por partido) las
// ESTIMA el modelo a partir de `cardTendency` y `style` -> source "mock".
//
// cardTendency: 0.8 (muestra pocas) .. 1.3 (muestra muchas).
// =====================================================================

import type { RefereeReliability, RefereeStyle } from "@/lib/data-providers/types";

export interface RefereeSeed {
  id: string;
  name: string;
  nationality: string;
  style: RefereeStyle;
  cardTendency: number;
}

/**
 * Designaciones arbitrales CONFIRMADAS por fuente oficial (matchId → árbitro).
 * VACÍO por ahora: FIFA aún no publica designaciones para estos partidos, así
 * que NINGÚN partido tiene árbitro asignado y la app muestra "Árbitro no
 * confirmado". Cuando FIFA designe, agregar aquí { matchId: { refereeId,
 * source, reliability } } y la app lo usará automáticamente.
 */
export interface ConfirmedRefereeAssignment {
  refereeId: string;
  source: string;
  reliability: Extract<RefereeReliability, "confirmed" | "reported">;
  lastUpdated: string;
}

export const CONFIRMED_REFEREE_ASSIGNMENTS: Record<string, ConfirmedRefereeAssignment> = {
  // Ejemplo (cuando haya designación oficial):
  // "wc-C-4": { refereeId: "ref-turpin", source: "FIFA Match Centre", reliability: "confirmed", lastUpdated: "2026-06-18" },
};

/** Pool de arbitros (referencia publica). */
export const WORLD_CUP_REFEREES: RefereeSeed[] = [
  { id: "ref-marciniak", name: "Szymon Marciniak", nationality: "Polonia", style: "promedio", cardTendency: 1.0 },
  { id: "ref-vincic", name: "Slavko Vincic", nationality: "Eslovenia", style: "promedio", cardTendency: 1.05 },
  { id: "ref-turpin", name: "Clement Turpin", nationality: "Francia", style: "promedio", cardTendency: 0.95 },
  { id: "ref-taylor", name: "Anthony Taylor", nationality: "Inglaterra", style: "estricto", cardTendency: 1.2 },
  { id: "ref-oliver", name: "Michael Oliver", nationality: "Inglaterra", style: "promedio", cardTendency: 1.0 },
  { id: "ref-ramos", name: "Cesar Arturo Ramos", nationality: "Mexico", style: "estricto", cardTendency: 1.15 },
  { id: "ref-tello", name: "Facundo Tello", nationality: "Argentina", style: "estricto", cardTendency: 1.3 },
  { id: "ref-sampaio", name: "Wilton Sampaio", nationality: "Brasil", style: "promedio", cardTendency: 1.05 },
  { id: "ref-elfath", name: "Ismail Elfath", nationality: "Estados Unidos", style: "permisivo", cardTendency: 0.85 },
  { id: "ref-ndiaye", name: "Maguette Ndiaye", nationality: "Senegal", style: "promedio", cardTendency: 1.0 },
  { id: "ref-ghorbal", name: "Mustapha Ghorbal", nationality: "Argelia", style: "estricto", cardTendency: 1.15 },
  { id: "ref-maning", name: "Ma Ning", nationality: "China", style: "estricto", cardTendency: 1.2 },
  { id: "ref-claus", name: "Raphael Claus", nationality: "Brasil", style: "promedio", cardTendency: 1.0 },
  { id: "ref-valenzuela", name: "Jesus Valenzuela", nationality: "Venezuela", style: "promedio", cardTendency: 1.1 },
  { id: "ref-makkelie", name: "Danny Makkelie", nationality: "Paises Bajos", style: "permisivo", cardTendency: 0.9 },
  { id: "ref-meler", name: "Halil Umut Meler", nationality: "Turquia", style: "estricto", cardTendency: 1.2 },
];
