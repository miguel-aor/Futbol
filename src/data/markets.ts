// Catalogo central de mercados de analisis (no apuestas reales).
import type { Market } from "@/lib/data-providers/types";

export const MARKETS: Market[] = [
  { key: "match_result", label: "Resultado (1X2)", category: "resultado", isPlayerMarket: false, description: "Local / Empate / Visitante." },
  { key: "over_under_goals", label: "Over/Under goles", category: "goles", isPlayerMarket: false, description: "Total de goles del partido sobre o bajo una linea." },
  { key: "btts", label: "Ambos anotan", category: "goles", isPlayerMarket: false, description: "Ambas selecciones marcan al menos un gol." },
  { key: "total_corners", label: "Total de corners", category: "corners", isPlayerMarket: false, description: "Total de tiros de esquina del partido." },
  { key: "total_cards", label: "Total de tarjetas", category: "tarjetas", isPlayerMarket: false, description: "Total de tarjetas mostradas en el partido." },
  { key: "team_total_shots", label: "Tiros totales por equipo", category: "tiros", isPlayerMarket: false, description: "Tiros totales de una seleccion." },
  { key: "team_shots_on_target", label: "Tiros a puerta por equipo", category: "tiros", isPlayerMarket: false, description: "Tiros a puerta de una seleccion." },
  { key: "player_total_shots", label: "Tiros totales (jugador)", category: "jugador", isPlayerMarket: true, description: "Tiros totales de un jugador." },
  { key: "player_shots_on_target", label: "Tiros a puerta (jugador)", category: "jugador", isPlayerMarket: true, description: "Tiros a puerta de un jugador." },
  { key: "player_goal", label: "Gol de jugador", category: "jugador", isPlayerMarket: true, description: "El jugador anota al menos un gol." },
  { key: "player_assist", label: "Asistencia de jugador", category: "jugador", isPlayerMarket: true, description: "El jugador registra al menos una asistencia." },
  { key: "player_card", label: "Tarjeta de jugador", category: "jugador", isPlayerMarket: true, description: "El jugador recibe una tarjeta." },
  { key: "player_fouls", label: "Faltas cometidas (jugador)", category: "jugador", isPlayerMarket: true, description: "Faltas cometidas por un jugador sobre una linea." },
];

export const MARKET_BY_KEY = Object.fromEntries(MARKETS.map((m) => [m.key, m]));

export const MARKET_CATEGORIES: { value: string; label: string }[] = [
  { value: "resultado", label: "Resultado" },
  { value: "goles", label: "Goles" },
  { value: "corners", label: "Corners" },
  { value: "tarjetas", label: "Tarjetas" },
  { value: "tiros", label: "Tiros" },
  { value: "jugador", label: "Jugador" },
];
