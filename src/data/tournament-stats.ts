// =====================================================================
// ESTADISTICAS REALES del Mundial 2026 — solo lo ya ocurrido.
//
// Lideres del torneo tras la JORNADA 1 (primera fecha de grupos, 11-17
// jun 2026; 24 partidos jugados). Datos REALES verificados en la web:
//   - Goleadores / asistencias: crónicas y tablas oficiales (FIFA, NBC,
//     Sky, medios) + box scores de ESPN/Opta.
//   - Tiros / tiros a puerta / faltas: tabla de stats de FOX Sports.
//   - Entradas (tackles): Yahoo + Opta (cobertura limitada por jugador).
//
// NO son proyecciones del modelo. Valores bajos = un solo partido/equipo.
// El detalle COMPLETO de tiros/entradas/faltas por jugador no se publica
// asi de temprano, por eso estas tablas son "líderes" (top N), no la
// estadística de cada uno de los ~1180 convocados.
// =====================================================================

export interface StatEntry {
  name: string;
  teamId: string;
  country: string;
  value: number;
}

export interface RealLeaderboard {
  key: string;
  label: string;
  /** Unidad legible (ej "goles"). */
  unit: string;
  /** Cobertura real de la fuente. */
  note: string;
  entries: StatEntry[];
}

export const TOURNAMENT_STATS_AS_OF = "2026-06-18";

export const TOURNAMENT_STATS_SOURCES = [
  "FIFA.com",
  "FOX Sports (stats)",
  "ESPN / Opta (The Analyst)",
  "NBC Sports",
  "Sky Sports",
  "Yahoo Sports",
];

export const REAL_LEADERBOARDS: RealLeaderboard[] = [
  {
    key: "scorers",
    label: "Máximos goleadores",
    unit: "goles",
    note: "Tras la jornada 1. Bota de Oro provisional.",
    entries: [
      { name: "Lionel Messi", teamId: "arg", country: "Argentina", value: 3 },
      { name: "Kylian Mbappé", teamId: "fra", country: "Francia", value: 2 },
      { name: "Erling Haaland", teamId: "nor", country: "Noruega", value: 2 },
      { name: "Harry Kane", teamId: "eng", country: "Inglaterra", value: 2 },
      { name: "Kai Havertz", teamId: "ger", country: "Alemania", value: 2 },
      { name: "Folarin Balogun", teamId: "usa", country: "Estados Unidos", value: 2 },
      { name: "Yasin Ayari", teamId: "swe", country: "Suecia", value: 2 },
      { name: "Elijah Just", teamId: "nzl", country: "Nueva Zelanda", value: 2 },
      { name: "Vinícius Júnior", teamId: "bra", country: "Brasil", value: 1 },
      { name: "Jude Bellingham", teamId: "eng", country: "Inglaterra", value: 1 },
      { name: "Marcus Rashford", teamId: "eng", country: "Inglaterra", value: 1 },
      { name: "Alexander Isak", teamId: "swe", country: "Suecia", value: 1 },
      { name: "Viktor Gyökeres", teamId: "swe", country: "Suecia", value: 1 },
      { name: "Raúl Jiménez", teamId: "mex", country: "México", value: 1 },
      { name: "Julián Quiñones", teamId: "mex", country: "México", value: 1 },
      { name: "Cyle Larin", teamId: "can", country: "Canadá", value: 1 },
      { name: "Virgil van Dijk", teamId: "ned", country: "Países Bajos", value: 1 },
      { name: "Ismael Saibari", teamId: "mar", country: "Marruecos", value: 1 },
      { name: "Luis Díaz", teamId: "col", country: "Colombia", value: 1 },
      { name: "Daichi Kamada", teamId: "jpn", country: "Japón", value: 1 },
      { name: "John McGinn", teamId: "sco", country: "Escocia", value: 1 },
      { name: "Emam Ashour", teamId: "egy", country: "Egipto", value: 1 },
      { name: "Aymen Hussein", teamId: "irq", country: "Irak", value: 1 },
      { name: "Abdulelah Al-Amri", teamId: "ksa", country: "Arabia Saudita", value: 1 },
    ],
  },
  {
    key: "assists",
    label: "Máximas asistencias",
    unit: "asistencias",
    note: "Tras la jornada 1. Asistencias menos corroboradas que goles.",
    entries: [
      { name: "Chris Wood", teamId: "nzl", country: "Nueva Zelanda", value: 2 },
      { name: "Alexander Isak", teamId: "swe", country: "Suecia", value: 2 },
      { name: "Ryan Gravenberch", teamId: "ned", country: "Países Bajos", value: 2 },
      { name: "Joshua Kimmich", teamId: "ger", country: "Alemania", value: 2 },
      { name: "Deniz Undav", teamId: "ger", country: "Alemania", value: 2 },
      { name: "Florian Wirtz", teamId: "ger", country: "Alemania", value: 1 },
      { name: "Michael Olise", teamId: "fra", country: "Francia", value: 1 },
      { name: "Luis Díaz", teamId: "col", country: "Colombia", value: 1 },
      { name: "Hannibal Mejbri", teamId: "tun", country: "Túnez", value: 1 },
    ],
  },
  {
    key: "shots",
    label: "Más tiros",
    unit: "tiros",
    note: "Tabla de tiros de FOX Sports tras la jornada 1.",
    entries: [
      { name: "Arda Güler", teamId: "tur", country: "Turquía", value: 8 },
      { name: "Son Heung-min", teamId: "kor", country: "Corea del Sur", value: 6 },
      { name: "Dan Ndoye", teamId: "sui", country: "Suiza", value: 6 },
      { name: "Harry Kane", teamId: "eng", country: "Inglaterra", value: 6 },
      { name: "Kenan Yıldız", teamId: "tur", country: "Turquía", value: 6 },
      { name: "Erling Haaland", teamId: "nor", country: "Noruega", value: 5 },
      { name: "Malik Tillman", teamId: "usa", country: "Estados Unidos", value: 5 },
      { name: "Folarin Balogun", teamId: "usa", country: "Estados Unidos", value: 5 },
      { name: "Federico Viñas", teamId: "uru", country: "Uruguay", value: 5 },
      { name: "Omar Marmoush", teamId: "egy", country: "Egipto", value: 5 },
      { name: "Lionel Messi", teamId: "arg", country: "Argentina", value: 5 },
      { name: "Julián Quiñones", teamId: "mex", country: "México", value: 5 },
      { name: "Viktor Gyökeres", teamId: "swe", country: "Suecia", value: 5 },
      { name: "Hakan Çalhanoğlu", teamId: "tur", country: "Turquía", value: 5 },
      { name: "Raúl Jiménez", teamId: "mex", country: "México", value: 4 },
    ],
  },
  {
    key: "shotsOnTarget",
    label: "Más tiros a puerta",
    unit: "t. a puerta",
    note: "Tabla de FOX Sports (columna SOG) tras la jornada 1.",
    entries: [
      { name: "Lionel Messi", teamId: "arg", country: "Argentina", value: 4 },
      { name: "Harry Kane", teamId: "eng", country: "Inglaterra", value: 4 },
      { name: "Erling Haaland", teamId: "nor", country: "Noruega", value: 4 },
      { name: "Kylian Mbappé", teamId: "fra", country: "Francia", value: 4 },
      { name: "Folarin Balogun", teamId: "usa", country: "Estados Unidos", value: 3 },
      { name: "Federico Viñas", teamId: "uru", country: "Uruguay", value: 3 },
      { name: "Raúl Jiménez", teamId: "mex", country: "México", value: 3 },
      { name: "Felix Nmecha", teamId: "ger", country: "Alemania", value: 3 },
      { name: "Arda Güler", teamId: "tur", country: "Turquía", value: 3 },
      { name: "Donyell Malen", teamId: "ned", country: "Países Bajos", value: 3 },
      { name: "Dan Ndoye", teamId: "sui", country: "Suiza", value: 2 },
      { name: "Kai Havertz", teamId: "ger", country: "Alemania", value: 2 },
      { name: "Alexander Isak", teamId: "swe", country: "Suecia", value: 2 },
      { name: "Breel Embolo", teamId: "sui", country: "Suiza", value: 2 },
      { name: "Rubén Vargas", teamId: "sui", country: "Suiza", value: 2 },
    ],
  },
  {
    key: "fouls",
    label: "Más faltas cometidas",
    unit: "faltas",
    note: "Tabla de disciplina de FOX Sports tras la jornada 1.",
    entries: [
      { name: "Aleksandar Pavlović", teamId: "ger", country: "Alemania", value: 5 },
      { name: "Thomas Meunier", teamId: "bel", country: "Bélgica", value: 5 },
      { name: "Carlos Harvey", teamId: "pan", country: "Panamá", value: 5 },
      { name: "Lawrence Shankland", teamId: "sco", country: "Escocia", value: 4 },
      { name: "Che Adams", teamId: "sco", country: "Escocia", value: 4 },
      { name: "Neil El Aynaoui", teamId: "mar", country: "Marruecos", value: 4 },
      { name: "Andrés Cubas", teamId: "par", country: "Paraguay", value: 4 },
      { name: "Frantzdy Pierrot", teamId: "hai", country: "Haití", value: 4 },
      { name: "Ermedin Demirović", teamId: "bih", country: "Bosnia", value: 4 },
      { name: "Yan Valery", teamId: "tun", country: "Túnez", value: 3 },
      { name: "Elliot Anderson", teamId: "eng", country: "Inglaterra", value: 3 },
      { name: "Vladimír Coufal", teamId: "cze", country: "Chequia", value: 3 },
      { name: "Moisés Caicedo", teamId: "ecu", country: "Ecuador", value: 3 },
      { name: "Yoane Wissa", teamId: "cod", country: "RD Congo", value: 3 },
    ],
  },
  {
    key: "tackles",
    label: "Más entradas",
    unit: "entradas",
    note: "Cobertura limitada (Yahoo/Opta); pocas fuentes publican entradas por jugador.",
    entries: [
      { name: "Douglas Santos", teamId: "bra", country: "Brasil", value: 8 },
      { name: "Mohanad Lasheen", teamId: "egy", country: "Egipto", value: 6 },
      { name: "Marvin Senaya", teamId: "gha", country: "Ghana", value: 5 },
      { name: "Mohamed Hany", teamId: "egy", country: "Egipto", value: 5 },
      { name: "Juninho Bacuna", teamId: "cuw", country: "Curazao", value: 4 },
      { name: "Jude Bellingham", teamId: "eng", country: "Inglaterra", value: 3 },
      { name: "Ryan Gravenberch", teamId: "ned", country: "Países Bajos", value: 2 },
      { name: "Hannes Delcroix", teamId: "hai", country: "Haití", value: 2 },
    ],
  },
];
