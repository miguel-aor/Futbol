// =====================================================================
// Eventos y estadísticas REALES de partidos del Mundial 2026.
//
// Fuentes: Opta Analyst (theanalyst.com), Wikipedia (Group A/B), ESPN, Sky.
// Captura 2026-06-19.
//
// Se incluye lo VERIFICABLE: goles (autor, minuto, asistente, penal/autogol),
// tarjetas, y stats de EQUIPO por partido (posesión, tiros, tiros a puerta,
// xG). Lo no publicado queda en `null` (regla: nunca 0, nunca inventar). Los
// tiros/pases por JUGADOR no se publican aún para estos partidos → no se
// incluyen. Cubre la jornada 2 de los grupos A y B (recién jugada).
// =====================================================================

export interface MatchGoal {
  minute: string; // "50'", "90+7'"
  player: string;
  teamId: string; // equipo al que se acredita el gol
  assist?: string; // asistente (si la fuente lo acredita)
  penalty?: boolean;
  ownGoal?: boolean;
}

export interface MatchCard {
  minute: string;
  player: string;
  teamId: string;
  type: "yellow" | "red";
}

/** Stats de un equipo en un partido (null = no publicado). */
export interface TeamMatchStat {
  teamId: string;
  possession: number | null; // %
  shots: number | null;
  shotsOnTarget: number | null;
  xg: number | null;
}

export interface MatchEvents {
  matchId: string;
  group: string;
  round: number;
  goals: MatchGoal[];
  cards: MatchCard[];
  teamStats: TeamMatchStat[];
  source: string;
  sourceUrl: string;
  collectedAt: string;
}

const SRC_A = "https://theanalyst.com/articles/czechia-vs-south-africa-stats-world-cup-2026";
const SRC_A4 = "https://theanalyst.com/articles/mexico-vs-south-korea-stats-world-cup-2026-live";
const SRC_B3 = "https://theanalyst.com/articles/switzerland-vs-bosnia-herzegovina-stats-world-cup-2026-live";
const SRC_B4 = "https://theanalyst.com/articles/canada-vs-qatar-stats-world-cup-2026-live";
const AT = "2026-06-19T18:00:00.000Z";

export const WORLD_CUP_2026_EVENTS: MatchEvents[] = [
  {
    matchId: "wc-A-3",
    group: "A",
    round: 2,
    goals: [
      { minute: "6'", player: "Michal Sadílek", teamId: "cze", assist: "Alexandr Sojka" },
      { minute: "83'", player: "Teboho Mokoena", teamId: "rsa", penalty: true },
    ],
    cards: [
      { minute: "75'", player: "Ladislav Krejčí", teamId: "cze", type: "yellow" },
      { minute: "33'", player: "Teboho Mokoena", teamId: "rsa", type: "yellow" },
      { minute: "40'", player: "Thalente Mbatha", teamId: "rsa", type: "yellow" },
      { minute: "74'", player: "Nkosinathi Sibisi", teamId: "rsa", type: "yellow" },
    ],
    teamStats: [
      { teamId: "cze", possession: 60, shots: 14, shotsOnTarget: 3, xg: 1.02 },
      { teamId: "rsa", possession: 40, shots: 17, shotsOnTarget: 4, xg: 1.37 },
    ],
    source: "Opta Analyst / Wikipedia",
    sourceUrl: SRC_A,
    collectedAt: AT,
  },
  {
    matchId: "wc-A-4",
    group: "A",
    round: 2,
    goals: [{ minute: "50'", player: "Luis Romo", teamId: "mex" }],
    cards: [
      { minute: "4'", player: "Lee Kang-in", teamId: "kor", type: "yellow" },
      { minute: "58'", player: "Paik Seung-ho", teamId: "kor", type: "yellow" },
    ],
    teamStats: [
      { teamId: "mex", possession: 42, shots: null, shotsOnTarget: null, xg: 0.48 },
      { teamId: "kor", possession: 58, shots: null, shotsOnTarget: 2, xg: 0.67 },
    ],
    source: "Opta Analyst / Wikipedia",
    sourceUrl: SRC_A4,
    collectedAt: AT,
  },
  {
    matchId: "wc-B-3",
    group: "B",
    round: 2,
    goals: [
      { minute: "74'", player: "Johan Manzambi", teamId: "sui" },
      { minute: "84'", player: "Rubén Vargas", teamId: "sui" },
      { minute: "90'", player: "Johan Manzambi", teamId: "sui", assist: "Rubén Vargas" },
      { minute: "90+7'", player: "Granit Xhaka", teamId: "sui", penalty: true },
      { minute: "90+3'", player: "Ermin Mahmić", teamId: "bih" },
    ],
    cards: [
      { minute: "65'", player: "Nico Elvedi", teamId: "sui", type: "yellow" },
      { minute: "59'", player: "Amar Dedić", teamId: "bih", type: "yellow" },
      { minute: "61'", player: "Edin Džeko", teamId: "bih", type: "yellow" },
      { minute: "80'", player: "Tarik Muharemović", teamId: "bih", type: "red" },
    ],
    teamStats: [
      { teamId: "sui", possession: null, shots: null, shotsOnTarget: null, xg: 2.01 },
      { teamId: "bih", possession: null, shots: 5, shotsOnTarget: null, xg: 0.24 },
    ],
    source: "Opta Analyst / Wikipedia",
    sourceUrl: SRC_B3,
    collectedAt: AT,
  },
  {
    matchId: "wc-B-4",
    group: "B",
    round: 2,
    goals: [
      { minute: "16'", player: "Cyle Larin", teamId: "can", assist: "Jonathan David" },
      { minute: "29'", player: "Jonathan David", teamId: "can", assist: "Tajon Buchanan" },
      { minute: "45+3'", player: "Jonathan David", teamId: "can", assist: "Cyle Larin" },
      { minute: "64'", player: "Nathan Saliba", teamId: "can" },
      { minute: "75'", player: "Mohammed Al Manai (en propia)", teamId: "can", ownGoal: true },
      { minute: "90+2'", player: "Jonathan David", teamId: "can", assist: "Nathan Saliba" },
    ],
    cards: [
      { minute: "9'", player: "Derek Cornelius", teamId: "can", type: "yellow" },
      { minute: "33'", player: "Homam Ahmed", teamId: "qat", type: "red" },
      { minute: "51'", player: "Assim Madibo", teamId: "qat", type: "red" },
      { minute: "62'", player: "Ahmed Fathy", teamId: "qat", type: "yellow" },
    ],
    teamStats: [
      { teamId: "can", possession: null, shots: 32, shotsOnTarget: 10, xg: 4.46 },
      { teamId: "qat", possession: null, shots: 2, shotsOnTarget: 0, xg: null },
    ],
    source: "Opta Analyst / Wikipedia",
    sourceUrl: SRC_B4,
    collectedAt: AT,
  },
];

export function eventsByMatchId(): Map<string, MatchEvents> {
  return new Map(WORLD_CUP_2026_EVENTS.map((e) => [e.matchId, e]));
}
