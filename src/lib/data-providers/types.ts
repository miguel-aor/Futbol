// =====================================================================
// Tipos centrales del dominio: Mundial 2026 + selecciones mundialistas.
// Estos tipos son consumidos por TODA la app (providers, prediccion,
// API y UI). No duplicar definiciones de entidades en otros archivos.
// =====================================================================

/** De donde viene un dato concreto. */
export type DataSource = "mock" | "manual" | "365scores";

/** Confederaciones FIFA. */
export type Confederation =
  | "UEFA"
  | "CONMEBOL"
  | "CONCACAF"
  | "CAF"
  | "AFC"
  | "OFC";

/** Tipo de partido internacional dentro del alcance del proyecto. */
export type InternationalFixtureType =
  | "mundial"
  | "amistoso"
  | "eliminatoria"
  | "internacional";

/** Estado de un partido. */
export type MatchStatus = "scheduled" | "live" | "finished";

/** Nivel de confianza de una oportunidad/pick. */
export type ConfidenceLabel = "baja" | "media" | "alta";

/** Recomendacion cualitativa de un pick. */
export type Recommendation = "buena" | "neutral" | "evitar";

/** Posicion de un jugador (simplificada). */
export type PlayerPosition = "POR" | "DEF" | "MED" | "DEL";

/** Identificador estable de un mercado de analisis. */
export type MarketKey =
  | "match_result"
  | "over_under_goals"
  | "btts"
  | "total_corners"
  | "total_cards"
  | "team_total_shots"
  | "team_shots_on_target"
  | "player_total_shots"
  | "player_shots_on_target"
  | "player_goal"
  | "player_assist"
  | "player_card"
  | "player_fouls";

/** Categoria de mercado para filtros de UI. */
export type MarketCategory =
  | "goles"
  | "corners"
  | "tarjetas"
  | "tiros"
  | "resultado"
  | "jugador";

/** Definicion estatica de un mercado. */
export interface Market {
  key: MarketKey;
  label: string;
  category: MarketCategory;
  /** true si el mercado aplica a un jugador individual. */
  isPlayerMarket: boolean;
  description: string;
}

/** Forma reciente agregada de una seleccion. */
export interface TeamRecentForm {
  /** Resultados ultimos partidos, mas reciente primero: W/D/L. */
  last5: Array<"W" | "D" | "L">;
  goalsFor: number;
  goalsAgainst: number;
  avgCorners: number;
  avgCards: number;
  avgShots: number;
  avgShotsOnTarget: number;
  /** Indice 0..1, mayor = mas volatil/impredecible. */
  volatility: number;
}

/** Seleccion nacional participante del Mundial. */
export interface Team {
  id: string;
  name: string;
  /** Codigo de 3 letras tipo FIFA. */
  code: string;
  flag: string; // emoji
  confederation: Confederation;
  /** Id del grupo del Mundial (A..L) o null si aun no asignado. */
  groupId: string | null;
  /** Ranking FIFA mock/placeholder. */
  fifaRanking: number;
  recentForm: TeamRecentForm;
  /** Promedio ofensivo (goles esperados a favor por partido). */
  attackStrength: number;
  /** Promedio defensivo (goles esperados en contra por partido). */
  defenseStrength: number;
  source: DataSource;
  updatedAt: string; // ISO
}

/** Grupo del Mundial. */
export interface Group {
  id: string; // "A".."L"
  name: string; // "Grupo A"
  teamIds: string[];
}

/** Fila de la tabla de posiciones de un grupo (simulada). */
export interface GroupStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

/** Prediccion agregada de un partido. */
export interface MatchPrediction {
  /** Probabilidades 1X2 (suman ~1). */
  homeWin: number;
  draw: number;
  awayWin: number;
  /** Goles esperados. */
  expectedGoals: number;
  /** Probabilidad over 2.5 goles. */
  over25: number;
  /** Probabilidad ambos anotan. */
  bttsYes: number;
  expectedCorners: number;
  expectedCards: number;
}

/** Tendencia corta de un equipo en un partido. */
export interface MatchTeamTrends {
  teamId: string;
  /** ultimos 5: goles por partido. */
  formGoals: number[];
  formCorners: number[];
  formCards: number[];
}

/** Registro head-to-head mock. */
export interface HeadToHeadRecord {
  date: string; // ISO
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  competition: string;
}

/** Partido internacional. */
export interface Match {
  id: string;
  fixtureType: InternationalFixtureType;
  competition: string;
  /** Grupo del Mundial si aplica. */
  groupId: string | null;
  homeTeamId: string;
  awayTeamId: string;
  /** Fecha-hora ISO. */
  kickoff: string;
  /** Sede / estadio mock. */
  venue: string;
  city: string;
  /** true si es campo neutral (tipico en Mundial). */
  neutralVenue: boolean;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  prediction: MatchPrediction;
  trends: MatchTeamTrends[];
  headToHead: HeadToHeadRecord[];
  source: DataSource;
  updatedAt: string; // ISO
}

/** Stats internacionales agregadas de un jugador. */
export interface PlayerStats {
  avgGoals: number;
  avgAssists: number;
  avgShots: number;
  avgShotsOnTarget: number;
  avgCards: number;
  avgFouls: number;
  avgMinutes: number;
}

/** Tipos de prop de jugador. */
export type PlayerPropType =
  | "shots_1plus"
  | "shots_2plus"
  | "shots_on_target_1plus"
  | "goal"
  | "assist"
  | "card"
  | "fouls";

/** Prop individual de un jugador con hit rates y edge. */
export interface PlayerProp {
  playerId: string;
  type: PlayerPropType;
  label: string;
  /** Hit rate ultimos 5 (0..1). */
  hitRateLast5: number;
  hitRateLast10: number;
  /** Hit rate de la temporada internacional (0..1). */
  hitRateSeason: number;
  modelProbability: number;
  fairOdds: number;
  marketOdds: number;
  edge: number;
  recommendation: Recommendation;
  source: DataSource;
  updatedAt: string;
}

/** Jugador convocado o convocable. */
export interface Player {
  id: string;
  name: string;
  teamId: string;
  position: PlayerPosition;
  shirtNumber: number;
  /** true si es titular probable. */
  likelyStarter: boolean;
  stats: PlayerStats;
  source: DataSource;
  updatedAt: string;
}

/** Oportunidad / pick sugerido por el modelo. */
export interface Opportunity {
  id: string;
  matchId: string;
  /** Mercado de equipo o de jugador. */
  marketKey: MarketKey;
  /** Solo para props de jugador. */
  playerId: string | null;
  /** Texto del pick sugerido, ej. "Over 2.5 goles". */
  pick: string;
  modelProbability: number;
  fairOdds: number;
  marketOdds: number;
  edge: number;
  confidence: ConfidenceLabel;
  /** Tamano de muestra usado en la estimacion. */
  sampleSize: number;
  /** Volatilidad 0..1 del mercado/jugador. */
  volatility: number;
  /** Razon corta y legible del modelo. */
  reason: string;
  source: DataSource;
  updatedAt: string;
}

// ---------------------------------------------------------------------
// Snapshots y metadata de proveedores
// ---------------------------------------------------------------------

/** Metadata de un proveedor de datos. */
export interface ProviderMetadata {
  id: DataSource;
  label: string;
  description: string;
  /** true si el proveedor esta operativo en este entorno. */
  available: boolean;
  /** ISO del dato mas reciente expuesto por el proveedor. */
  lastUpdated: string | null;
}

/** Snapshot persistido de datos (manual o 365scores). */
export interface DataSnapshot {
  /** Identificador del snapshot (ej. archivo o fuente). */
  id: string;
  source: DataSource;
  /** ISO de cuando se extrajeron/guardaron los datos. */
  capturedAt: string;
  /** URL o descripcion de la fuente. */
  origin: string;
  /** Conteos rapidos para mostrar en UI. */
  counts: {
    teams: number;
    matches: number;
    players: number;
    opportunities: number;
  };
}

/** Conjunto completo de datos que un provider entrega a la app. */
export interface DataBundle {
  meta: ProviderMetadata;
  groups: Group[];
  teams: Team[];
  matches: Match[];
  players: Player[];
  opportunities: Opportunity[];
  playerProps: PlayerProp[];
  markets: Market[];
  standings: Record<string, GroupStanding[]>; // groupId -> filas
}

/** Interfaz que TODOS los providers deben implementar. */
export interface DataProvider {
  readonly id: DataSource;
  getMetadata(): Promise<ProviderMetadata>;
  getBundle(): Promise<DataBundle>;
  /** Lista de snapshots disponibles (vacio para mock). */
  listSnapshots(): Promise<DataSnapshot[]>;
}
