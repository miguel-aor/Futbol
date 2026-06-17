// =====================================================================
// JUGADORES REALES DESTACADOS por seleccion (identidades reales de
// internacionales reconocidos de cada pais). 3 por equipo.
//
// IMPORTANTE: los NOMBRES y posiciones son reales; las stats por partido,
// probabilidades y props los ESTIMA el modelo (no son datos oficiales).
// Las convocatorias finales pueden variar. Fuente: conocimiento publico
// de las selecciones; editar/ampliar aqui.
// =====================================================================

import type { PlayerPosition } from "@/lib/data-providers/types";

export interface PlayerSeed {
  name: string;
  position: PlayerPosition;
}

/** teamId -> jugadores destacados (el primero suele ser la figura). */
export const WORLD_CUP_PLAYERS: Record<string, PlayerSeed[]> = {
  // Grupo A
  mex: [
    { name: "Santiago Gimenez", position: "DEL" },
    { name: "Edson Alvarez", position: "MED" },
    { name: "Hirving Lozano", position: "DEL" },
  ],
  kor: [
    { name: "Son Heung-min", position: "DEL" },
    { name: "Lee Kang-in", position: "MED" },
    { name: "Kim Min-jae", position: "DEF" },
  ],
  cze: [
    { name: "Patrik Schick", position: "DEL" },
    { name: "Tomas Soucek", position: "MED" },
    { name: "Vladimir Coufal", position: "DEF" },
  ],
  rsa: [
    { name: "Percy Tau", position: "DEL" },
    { name: "Themba Zwane", position: "MED" },
    { name: "Ronwen Williams", position: "POR" },
  ],

  // Grupo B
  can: [
    { name: "Jonathan David", position: "DEL" },
    { name: "Alphonso Davies", position: "DEF" },
    { name: "Tajon Buchanan", position: "MED" },
  ],
  sui: [
    { name: "Granit Xhaka", position: "MED" },
    { name: "Breel Embolo", position: "DEL" },
    { name: "Manuel Akanji", position: "DEF" },
  ],
  qat: [
    { name: "Akram Afif", position: "DEL" },
    { name: "Almoez Ali", position: "DEL" },
    { name: "Hassan Al-Haydos", position: "MED" },
  ],
  bih: [
    { name: "Edin Dzeko", position: "DEL" },
    { name: "Miralem Pjanic", position: "MED" },
    { name: "Sead Kolasinac", position: "DEF" },
  ],

  // Grupo C
  bra: [
    { name: "Vinicius Junior", position: "DEL" },
    { name: "Rodrygo", position: "DEL" },
    { name: "Casemiro", position: "MED" },
  ],
  mar: [
    { name: "Achraf Hakimi", position: "DEF" },
    { name: "Youssef En-Nesyri", position: "DEL" },
    { name: "Brahim Diaz", position: "MED" },
  ],
  sco: [
    { name: "Scott McTominay", position: "MED" },
    { name: "Che Adams", position: "DEL" },
    { name: "Andrew Robertson", position: "DEF" },
  ],
  hai: [
    { name: "Frantzdy Pierrot", position: "DEL" },
    { name: "Duckens Nazon", position: "DEL" },
    { name: "Derrick Etienne", position: "MED" },
  ],

  // Grupo D
  usa: [
    { name: "Christian Pulisic", position: "DEL" },
    { name: "Weston McKennie", position: "MED" },
    { name: "Tyler Adams", position: "MED" },
  ],
  aus: [
    { name: "Mitchell Duke", position: "DEL" },
    { name: "Jackson Irvine", position: "MED" },
    { name: "Mathew Ryan", position: "POR" },
  ],
  tur: [
    { name: "Arda Guler", position: "MED" },
    { name: "Kenan Yildiz", position: "DEL" },
    { name: "Hakan Calhanoglu", position: "MED" },
  ],
  par: [
    { name: "Miguel Almiron", position: "MED" },
    { name: "Antonio Sanabria", position: "DEL" },
    { name: "Gustavo Gomez", position: "DEF" },
  ],

  // Grupo E
  ger: [
    { name: "Jamal Musiala", position: "MED" },
    { name: "Florian Wirtz", position: "MED" },
    { name: "Kai Havertz", position: "DEL" },
  ],
  civ: [
    { name: "Sebastien Haller", position: "DEL" },
    { name: "Franck Kessie", position: "MED" },
    { name: "Simon Adingra", position: "DEL" },
  ],
  ecu: [
    { name: "Moises Caicedo", position: "MED" },
    { name: "Enner Valencia", position: "DEL" },
    { name: "Pervis Estupinan", position: "DEF" },
  ],
  cuw: [
    { name: "Leandro Bacuna", position: "MED" },
    { name: "Tahith Chong", position: "MED" },
    { name: "Cuco Martina", position: "DEF" },
  ],

  // Grupo F
  ned: [
    { name: "Virgil van Dijk", position: "DEF" },
    { name: "Frenkie de Jong", position: "MED" },
    { name: "Cody Gakpo", position: "DEL" },
  ],
  jpn: [
    { name: "Kaoru Mitoma", position: "DEL" },
    { name: "Takefusa Kubo", position: "MED" },
    { name: "Wataru Endo", position: "MED" },
  ],
  swe: [
    { name: "Alexander Isak", position: "DEL" },
    { name: "Viktor Gyokeres", position: "DEL" },
    { name: "Dejan Kulusevski", position: "MED" },
  ],
  tun: [
    { name: "Hannibal Mejbri", position: "MED" },
    { name: "Youssef Msakni", position: "MED" },
    { name: "Aissa Laidouni", position: "MED" },
  ],

  // Grupo G
  bel: [
    { name: "Kevin De Bruyne", position: "MED" },
    { name: "Romelu Lukaku", position: "DEL" },
    { name: "Jeremy Doku", position: "DEL" },
  ],
  irn: [
    { name: "Mehdi Taremi", position: "DEL" },
    { name: "Sardar Azmoun", position: "DEL" },
    { name: "Alireza Jahanbakhsh", position: "MED" },
  ],
  nzl: [
    { name: "Chris Wood", position: "DEL" },
    { name: "Liberato Cacace", position: "DEF" },
    { name: "Ben Old", position: "MED" },
  ],
  egy: [
    { name: "Mohamed Salah", position: "DEL" },
    { name: "Omar Marmoush", position: "DEL" },
    { name: "Mohamed Elneny", position: "MED" },
  ],

  // Grupo H
  esp: [
    { name: "Lamine Yamal", position: "DEL" },
    { name: "Nico Williams", position: "DEL" },
    { name: "Rodri", position: "MED" },
  ],
  uru: [
    { name: "Federico Valverde", position: "MED" },
    { name: "Darwin Nunez", position: "DEL" },
    { name: "Ronald Araujo", position: "DEF" },
  ],
  ksa: [
    { name: "Salem Al-Dawsari", position: "DEL" },
    { name: "Firas Al-Buraikan", position: "DEL" },
    { name: "Mohamed Kanno", position: "MED" },
  ],
  cpv: [
    { name: "Ryan Mendes", position: "DEL" },
    { name: "Garry Rodrigues", position: "MED" },
    { name: "Jovane Cabral", position: "DEL" },
  ],

  // Grupo I
  fra: [
    { name: "Kylian Mbappe", position: "DEL" },
    { name: "Ousmane Dembele", position: "DEL" },
    { name: "Aurelien Tchouameni", position: "MED" },
  ],
  sen: [
    { name: "Sadio Mane", position: "DEL" },
    { name: "Nicolas Jackson", position: "DEL" },
    { name: "Kalidou Koulibaly", position: "DEF" },
  ],
  nor: [
    { name: "Erling Haaland", position: "DEL" },
    { name: "Martin Odegaard", position: "MED" },
    { name: "Alexander Sorloth", position: "DEL" },
  ],
  irq: [
    { name: "Aymen Hussein", position: "DEL" },
    { name: "Bashar Resan", position: "MED" },
    { name: "Zidane Iqbal", position: "MED" },
  ],

  // Grupo J
  arg: [
    { name: "Lionel Messi", position: "DEL" },
    { name: "Julian Alvarez", position: "DEL" },
    { name: "Enzo Fernandez", position: "MED" },
  ],
  aut: [
    { name: "Marcel Sabitzer", position: "MED" },
    { name: "Marko Arnautovic", position: "DEL" },
    { name: "David Alaba", position: "DEF" },
  ],
  alg: [
    { name: "Riyad Mahrez", position: "DEL" },
    { name: "Ismael Bennacer", position: "MED" },
    { name: "Said Benrahma", position: "DEL" },
  ],
  jor: [
    { name: "Mousa Al-Tamari", position: "DEL" },
    { name: "Yazan Al-Naimat", position: "DEL" },
    { name: "Nour Al-Rawabdeh", position: "MED" },
  ],

  // Grupo K
  por: [
    { name: "Cristiano Ronaldo", position: "DEL" },
    { name: "Bruno Fernandes", position: "MED" },
    { name: "Rafael Leao", position: "DEL" },
  ],
  col: [
    { name: "Luis Diaz", position: "DEL" },
    { name: "James Rodriguez", position: "MED" },
    { name: "Jhon Duran", position: "DEL" },
  ],
  uzb: [
    { name: "Eldor Shomurodov", position: "DEL" },
    { name: "Abbosbek Faizullaev", position: "MED" },
    { name: "Jaloliddin Masharipov", position: "MED" },
  ],
  cod: [
    { name: "Yoane Wissa", position: "DEL" },
    { name: "Cedric Bakambu", position: "DEL" },
    { name: "Chancel Mbemba", position: "DEF" },
  ],

  // Grupo L
  eng: [
    { name: "Harry Kane", position: "DEL" },
    { name: "Jude Bellingham", position: "MED" },
    { name: "Bukayo Saka", position: "DEL" },
  ],
  cro: [
    { name: "Luka Modric", position: "MED" },
    { name: "Andrej Kramaric", position: "DEL" },
    { name: "Josko Gvardiol", position: "DEF" },
  ],
  gha: [
    { name: "Mohammed Kudus", position: "MED" },
    { name: "Inaki Williams", position: "DEL" },
    { name: "Thomas Partey", position: "MED" },
  ],
  pan: [
    { name: "Adalberto Carrasquilla", position: "MED" },
    { name: "Jose Fajardo", position: "DEL" },
    { name: "Anibal Godoy", position: "MED" },
  ],
};
