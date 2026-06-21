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
  /** Id del arbitro designado (si se conoce) o null. */
  refereeId: string | null;
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
  /** Club actual (real) o "" si se desconoce. */
  club: string;
  /** true si es titular probable. */
  likelyStarter: boolean;
  stats: PlayerStats;
  /** Foto del jugador (Mundial 2026 o reciente) o null -> avatar de iniciales. */
  imageUrl: string | null;
  /** Origen/atribucion de la imagen. */
  imageSource: string;
  /** ISO de actualizacion de la imagen o null. */
  imageUpdatedAt: string | null;
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
  // --- World Cup Intelligence Mapping (datos base) ---
  coaches: Coach[];
  referees: Referee[];
  /** Partidos historicos relevantes para selecciones del Mundial. */
  historicalMatches: HistoricalMatch[];
}

/** Interfaz que TODOS los providers deben implementar. */
export interface DataProvider {
  readonly id: DataSource;
  getMetadata(): Promise<ProviderMetadata>;
  getBundle(): Promise<DataBundle>;
  /** Lista de snapshots disponibles (vacio para mock). */
  listSnapshots(): Promise<DataSnapshot[]>;
}

// =====================================================================
// World Cup Intelligence Mapping
// Entidades para construir un mapa analitico profundo de cada seleccion
// y de cada partido proximo. Datos base (Coach, Referee, HistoricalMatch)
// viajan en el DataBundle; los PERFILES y REPORTES son DERIVADOS y se
// computan en @/lib/prediction/intelligence.ts (no se persisten).
// =====================================================================

/** Clasificacion de competicion para partidos historicos. */
export type CompetitionType =
  | "mundial"
  | "eliminatoria"
  | "amistoso"
  | "continental" // Copa America / Euro / AFC Asian Cup / AFCON / Gold Cup
  | "nations_league";

/** Flujo de juego tipico de un arbitro. */
export type RefereeStyle = "permisivo" | "promedio" | "estricto";

/** Nivel cualitativo (calidad de datos, riesgo, etc.). */
export type QualityLevel = "alta" | "media" | "baja";

/** Ventana de mercados que filtra getRelevantHistoricalMatches. */
export type HistoricalMarketFocus =
  | "goles"
  | "corners"
  | "tarjetas"
  | "tiros"
  | "jugador";

// ---------------------------------------------------------------------
// Entrenador
// ---------------------------------------------------------------------

/** Entrenador de una seleccion. */
export interface Coach {
  id: string;
  name: string;
  nationality: string;
  teamId: string;
  /** ISO de designacion (mock/real si existe) o null. */
  appointedDate: string | null;
  preferredFormation: string; // ej "4-3-3"
  tacticalStyle: string; // resumen legible
  matchesManaged: number;
  winRate: number; // 0..1
  goalsForPerMatch: number;
  goalsAgainstPerMatch: number;
  cardsPerMatch: number;
  cornersPerMatch: number;
  notes: string;
  source: DataSource;
  lastUpdated: string;
}

/** Factores de ajuste derivados del estilo del entrenador. */
export interface CoachImpact {
  /** Estabilidad del proyecto 0..1 (mas = mas estable). */
  projectStability: number;
  /** Sesgo ofensivo/defensivo -1 (defensivo) .. 1 (ofensivo). */
  attackingBias: number;
  /** Presion alta 0..1. */
  pressIntensity: number;
  /** Disciplina 0..1 (mas = menos tarjetas). */
  discipline: number;
  /** Tendencia a rotar jugadores 0..1. */
  rotationTendency: number;
  /** Diferencia de rendimiento oficiales vs amistosos -1..1. */
  officialVsFriendly: number;
}

// ---------------------------------------------------------------------
// Arbitro
// ---------------------------------------------------------------------

/** Confiabilidad de la designación arbitral. */
export type RefereeReliability = "confirmed" | "reported" | "unconfirmed" | "demo";

/** Arbitro de un partido. */
export interface Referee {
  id: string;
  name: string;
  nationality: string;
  matchesCount: number;
  yellowCardsPerMatch: number;
  redCardsPerMatch: number;
  foulsPerMatch: number;
  penaltiesPerMatch: number;
  /** Sesgo local mock/placeholder -1..1 (no aplica en sede neutral). */
  homeBiasIndex: number;
  gameFlowStyle: RefereeStyle;
  source: DataSource;
  lastUpdated: string;
  /** true solo si la designación viene de fuente oficial/confiable. */
  isConfirmed: boolean;
  reliability: RefereeReliability;
  /** Fuente y URL de la DESIGNACIÓN (separada de la fuente de estadísticas). */
  designationSource?: string;
  designationSourceUrl?: string;
  /** Fuente de las estadísticas históricas (si se cargaron). */
  statsSource?: string;
  /** false = sin stats reales; el impacto disciplinario queda neutral. */
  statsLoaded?: boolean;
}

/** Ajustes de mercado derivados del perfil del arbitro. */
export interface RefereeImpact {
  /** Multiplicador sobre mercado de tarjetas (~0.8..1.25). */
  cardsMultiplier: number;
  /** Multiplicador sobre faltas. */
  foulsMultiplier: number;
  /** Multiplicador sobre probabilidad de penal. */
  penaltyMultiplier: number;
  /** Explicacion legible para la UI. */
  explanation: string;
}

// ---------------------------------------------------------------------
// Partido historico
// ---------------------------------------------------------------------

/** Estadisticas agregadas de un partido historico. */
export interface HistoricalMatchStats {
  homeCorners: number;
  awayCorners: number;
  homeCards: number;
  awayCards: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homeFouls: number;
  awayFouls: number;
  /** Posesion local 0..100 (visitante = 100 - este valor). */
  homePossession: number;
  homeXg: number | null;
  awayXg: number | null;
}

/** Evento puntual de un partido historico. */
export interface HistoricalMatchEvent {
  minute: number;
  type: "goal" | "yellow" | "red" | "penalty" | "sub";
  teamId: string;
  player: string;
}

/** Partido anterior relevante para una seleccion del Mundial. */
export interface HistoricalMatch {
  id: string;
  date: string; // ISO
  homeTeam: string; // teamId
  awayTeam: string; // teamId
  competition: string;
  matchType: CompetitionType;
  isRelevantToWorldCupTeam: boolean;
  homeScore: number;
  awayScore: number;
  stats: HistoricalMatchStats;
  lineups: { home: string[]; away: string[] } | null;
  events: HistoricalMatchEvent[];
  odds: { home: number; draw: number; away: number } | null;
  refereeId: string | null;
  venue: string;
  source: DataSource;
  sourceUrl: string | null;
  ingestedAt: string;
}

/** Opciones de getRelevantHistoricalMatches. */
export interface HistoricalMatchQuery {
  /** Limite de partidos (ej 5/10/20). */
  limit?: number;
  /** Solo partidos oficiales (excluye amistosos). */
  officialOnly?: boolean;
  /** Solo amistosos. */
  friendliesOnly?: boolean;
  /** Solo contra rivales fuertes (ranking FIFA top). */
  vsStrongOnly?: boolean;
  /** Solo contra rivales parecidos al proximo rival. */
  similarToOpponentId?: string;
  /** Filtrar por confederacion del rival. */
  confederation?: Confederation;
  /** Enfoque de mercado (ordena por relevancia del mercado). */
  marketFocus?: HistoricalMarketFocus;
}

// ---------------------------------------------------------------------
// Rendimiento agregado
// ---------------------------------------------------------------------

/** Agregados de rendimiento sobre una ventana de partidos. */
export interface PerformanceWindow {
  /** Partidos considerados realmente. */
  sampleSize: number;
  wins: number;
  draws: number;
  losses: number;
  /** Promedios por partido. */
  goalsFor: number;
  goalsAgainst: number;
  /** Proporciones 0..1. */
  cleanSheets: number;
  bttsRate: number;
  over15: number;
  over25: number;
  over35: number;
  cornersFor: number;
  cornersAgainst: number;
  cardsFor: number;
  cardsAgainst: number;
  shots: number;
  shotsOnTarget: number;
  foulsCommitted: number;
  foulsDrawn: number;
  possession: number; // promedio 0..100
  xg: number | null;
  xga: number | null;
}

/** Split de rendimiento contextual. */
export interface ContextualSplit {
  label: string;
  sampleSize: number;
  winRate: number; // 0..1
  goalsFor: number;
  goalsAgainst: number;
}

/** Rendimiento contextual de una seleccion. */
export interface TeamContextualPerformance {
  vsStrong: ContextualSplit;
  vsWeak: ContextualSplit;
  neutralVenue: ContextualSplit;
  official: ContextualSplit;
  friendlies: ContextualSplit;
  sameConfederation: ContextualSplit;
  otherConfederation: ContextualSplit;
  /** Goles a favor promedio 1er tiempo. */
  firstHalfGoalsFor: number;
  /** Goles a favor promedio 2do tiempo. */
  secondHalfGoalsFor: number;
  /** Goles a favor antes del minuto 20 (promedio). */
  earlyGoalsFor: number;
  /** Goles en contra antes del minuto 20 (promedio). */
  earlyGoalsAgainst: number;
  /** Capacidad de cerrar partidos 0..1. */
  closingStrength: number;
}

// ---------------------------------------------------------------------
// Calidad de datos
// ---------------------------------------------------------------------

/** Score de calidad de datos de un perfil/pick. */
export interface DataQualityScore {
  completeness: number; // 0..1
  recency: number; // 0..1
  sourceReliability: number; // 0..1
  sampleSize: number; // 0..1 normalizado
  consistency: number; // 0..1
  finalScore: number; // 0..1
  level: QualityLevel;
  warnings: string[];
}

// ---------------------------------------------------------------------
// Perfil de jugador (Intelligence)
// ---------------------------------------------------------------------

/** Ventana de forma de un jugador. */
export interface PlayerFormWindow {
  sampleSize: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  cards: number;
  minutes: number;
}

/** Perfil analitico expandido de un jugador. */
export interface PlayerIntelligenceProfile {
  playerId: string;
  name: string;
  teamId: string;
  position: PlayerPosition;
  likelyStarter: boolean;
  expectedMinutes: number;
  last5: PlayerFormWindow;
  last10: PlayerFormWindow;
  /** Promedios internacionales. */
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  foulsCommitted: number;
  foulsDrawn: number;
  tackles: number;
  passes: number;
  cards: number;
  goalContributions: number; // goles + asistencias por partido
  setPieceRole: string;
  penaltyTaker: boolean;
  freeKicks: boolean;
  corners: boolean;
  rotationRisk: QualityLevel;
  fitness: string; // "disponible" / mock
  source: DataSource;
  lastUpdated: string;
}

// ---------------------------------------------------------------------
// Identidad y perfil de seleccion (Intelligence)
// ---------------------------------------------------------------------

/** Identidad analitica de una seleccion. */
export interface TeamIdentity {
  teamId: string;
  teamName: string;
  groupId: string | null;
  confederation: Confederation;
  fifaRanking: number;
  coachName: string;
  captain: string;
  playStyle: string;
  commonFormation: string;
  source: DataSource;
  lastUpdated: string;
}

/** Desglose de scores 0..100 de una seleccion. */
export interface TeamScoreBreakdown {
  form: number;
  attack: number;
  defense: number;
  /** Mas alto = mas disciplinado (menos tarjetas). */
  discipline: number;
  corners: number;
  shots: number;
}

/** Referencia ligera a una seleccion. */
export interface TeamRef {
  id: string;
  name: string;
  code: string;
  flag: string;
}

/** Perfil de inteligencia completo de una seleccion (DERIVADO). */
export interface TeamIntelligenceProfile {
  identity: TeamIdentity;
  coach: Coach | null;
  coachImpact: CoachImpact | null;
  recent: {
    last5: PerformanceWindow;
    last10: PerformanceWindow;
    last20: PerformanceWindow;
  };
  contextual: TeamContextualPerformance;
  scores: TeamScoreBreakdown;
  keyPlayers: PlayerIntelligenceProfile[];
  relevantMatches: HistoricalMatch[];
  dataQuality: DataQualityScore;
  source: DataSource;
  lastUpdated: string;
}

// ---------------------------------------------------------------------
// Reporte de inteligencia de partido (DERIVADO)
// ---------------------------------------------------------------------

/** Comparacion de un mercado entre local y visitante. */
export interface MarketComparison {
  label: string;
  home: number;
  away: number;
  /** A quien favorece la comparacion. */
  edgeTo: "home" | "away" | "even";
}

/** Factor que afecta un mercado del partido. */
export interface IntelligenceFactor {
  label: string;
  impact: QualityLevel; // alta/media/baja
  /** A quien/que favorece: teamId, "local"/"visitante" o mercado. */
  favors: string;
  detail: string;
}

/** Pick recomendado dentro del reporte. */
export interface MatchPick {
  market: string;
  pick: string;
  modelProbability: number;
  fairOdds: number;
  marketOdds: number;
  edge: number;
  confidence: ConfidenceLabel;
  reasonsFor: string[];
  reasonsAgainst: string[];
  dataQuality: DataQualityScore;
}

/** Reporte de inteligencia completo de un partido proximo. */
export interface MatchIntelligenceReport {
  matchId: string;
  kickoff: string;
  venue: string;
  city: string;
  groupId: string | null;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  referee: Referee | null;
  refereeImpact: RefereeImpact | null;
  homeCoach: Coach | null;
  awayCoach: Coach | null;
  /** Forma reciente (ultimos 10) de cada lado. */
  homeForm: PerformanceWindow;
  awayForm: PerformanceWindow;
  comparisons: {
    attack: MarketComparison;
    defense: MarketComparison;
    corners: MarketComparison;
    cards: MarketComparison;
    shots: MarketComparison;
  };
  h2h: HeadToHeadRecord[];
  homeRelevantMatches: HistoricalMatch[];
  awayRelevantMatches: HistoricalMatch[];
  keyPlayers: PlayerIntelligenceProfile[];
  /** Ausencias mock/si estan disponibles. */
  absences: Array<{ teamId: string; player: string; reason: string }>;
  factorsResult: IntelligenceFactor[];
  factorsGoals: IntelligenceFactor[];
  factorsCorners: IntelligenceFactor[];
  factorsCards: IntelligenceFactor[];
  picks: MatchPick[];
  narrative: string;
  dataQuality: DataQualityScore;
  source: DataSource;
  lastUpdated: string;
}
