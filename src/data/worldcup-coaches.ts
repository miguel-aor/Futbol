// =====================================================================
// ENTRENADORES de las selecciones del Mundial 2026.
//
// Los NOMBRES son de conocimiento publico (referencia, no verificados al
// 100% ni oficiales) y pueden cambiar antes/durante el torneo. Las
// METRICAS (winRate, partidos, goles/partido, etc.) las ESTIMA el modelo
// de forma determinista en el builder -> por eso el registro Coach se
// marca source: "mock". Editar/ampliar aqui.
//
// attackingBias: -1 muy defensivo .. 1 muy ofensivo.
// press: 0 bloque bajo .. 1 presion alta.
// rotation: 0 once fijo .. 1 rota mucho.
// =====================================================================

export interface CoachSeed {
  name: string;
  nationality: string;
  formation: string;
  style: string;
  attackingBias: number;
  press: number;
  rotation: number;
}

/** teamId -> entrenador (identidad publica de referencia). */
export const WORLD_CUP_COACHES: Record<string, CoachSeed> = {
  // Grupo A
  mex: { name: "Javier Aguirre", nationality: "Mexico", formation: "4-3-3", style: "Intensidad y transiciones rapidas", attackingBias: 0.3, press: 0.6, rotation: 0.4 },
  kor: { name: "Hong Myung-bo", nationality: "Corea del Sur", formation: "4-2-3-1", style: "Posesion vertical y presion media", attackingBias: 0.2, press: 0.55, rotation: 0.45 },
  cze: { name: "Miroslav Koubek", nationality: "Chequia", formation: "4-2-3-1", style: "Bloque compacto y balon parado", attackingBias: -0.1, press: 0.45, rotation: 0.5 },
  rsa: { name: "Hugo Broos", nationality: "Belgica", formation: "4-3-3", style: "Salida limpia y juventud ofensiva", attackingBias: 0.25, press: 0.6, rotation: 0.4 },

  // Grupo B
  can: { name: "Jesse Marsch", nationality: "Estados Unidos", formation: "4-2-3-1", style: "Presion alta agresiva, gegenpressing", attackingBias: 0.4, press: 0.85, rotation: 0.45 },
  sui: { name: "Murat Yakin", nationality: "Suiza", formation: "4-2-3-1", style: "Orden defensivo y solidez", attackingBias: -0.05, press: 0.45, rotation: 0.4 },
  qat: { name: "Julen Lopetegui", nationality: "Espana", formation: "4-3-3", style: "Posesion y presion media", attackingBias: 0.15, press: 0.6, rotation: 0.45 },
  bih: { name: "Sergej Barbarez", nationality: "Bosnia y Herzegovina", formation: "4-2-3-1", style: "Verticalidad y pegada", attackingBias: 0.3, press: 0.55, rotation: 0.5 },

  // Grupo C
  bra: { name: "Carlo Ancelotti", nationality: "Italia", formation: "4-3-3", style: "Talento liberado, equilibrio veterano", attackingBias: 0.45, press: 0.55, rotation: 0.5 },
  mar: { name: "Mohamed Ouahbi", nationality: "Marruecos", formation: "4-3-3", style: "Bloque solido y transiciones letales", attackingBias: 0.2, press: 0.65, rotation: 0.4 },
  sco: { name: "Steve Clarke", nationality: "Escocia", formation: "3-5-2", style: "Intensidad fisica y juego directo", attackingBias: 0.0, press: 0.55, rotation: 0.35 },
  hai: { name: "Sébastien Migné", nationality: "Francia", formation: "4-4-2", style: "Contragolpe y entrega", attackingBias: 0.1, press: 0.5, rotation: 0.55 },

  // Grupo D
  usa: { name: "Mauricio Pochettino", nationality: "Argentina", formation: "4-3-3", style: "Presion alta y posesion ambiciosa", attackingBias: 0.45, press: 0.8, rotation: 0.45 },
  aus: { name: "Tony Popovic", nationality: "Australia", formation: "4-4-2", style: "Orden, intensidad y balon parado", attackingBias: -0.05, press: 0.55, rotation: 0.4 },
  tur: { name: "Vincenzo Montella", nationality: "Italia", formation: "4-2-3-1", style: "Asociacion y creatividad ofensiva", attackingBias: 0.4, press: 0.6, rotation: 0.5 },
  par: { name: "Gustavo Alfaro", nationality: "Argentina", formation: "4-4-2", style: "Competitivo, intenso y aplicado", attackingBias: 0.05, press: 0.6, rotation: 0.4 },

  // Grupo E
  ger: { name: "Julian Nagelsmann", nationality: "Alemania", formation: "4-2-3-1", style: "Posesion posicional y presion alta", attackingBias: 0.5, press: 0.8, rotation: 0.5 },
  civ: { name: "Emerse Fae", nationality: "Costa de Marfil", formation: "4-3-3", style: "Poderio fisico y transiciones", attackingBias: 0.25, press: 0.65, rotation: 0.45 },
  ecu: { name: "Sebastian Beccacece", nationality: "Argentina", formation: "4-3-3", style: "Presion intensa y juventud", attackingBias: 0.35, press: 0.8, rotation: 0.5 },
  cuw: { name: "Dick Advocaat", nationality: "Paises Bajos", formation: "4-3-3", style: "Orden veterano y eficiencia", attackingBias: 0.0, press: 0.45, rotation: 0.4 },

  // Grupo F
  ned: { name: "Ronald Koeman", nationality: "Paises Bajos", formation: "4-3-3", style: "Posesion total y construccion", attackingBias: 0.45, press: 0.65, rotation: 0.45 },
  jpn: { name: "Hajime Moriyasu", nationality: "Japon", formation: "3-4-2-1", style: "Asociacion rapida y presion coordinada", attackingBias: 0.4, press: 0.75, rotation: 0.55 },
  swe: { name: "Graham Potter", nationality: "Inglaterra", formation: "3-4-3", style: "Estructura flexible y posesion", attackingBias: 0.2, press: 0.6, rotation: 0.5 },
  tun: { name: "Sabri Lamouchi", nationality: "Tunez", formation: "4-3-3", style: "Bloque ordenado y transiciones", attackingBias: -0.05, press: 0.5, rotation: 0.5 },

  // Grupo G
  bel: { name: "Rudi Garcia", nationality: "Francia", formation: "4-2-3-1", style: "Talento ofensivo y posesion", attackingBias: 0.4, press: 0.6, rotation: 0.5 },
  irn: { name: "Amir Ghalenoei", nationality: "Iran", formation: "4-2-3-1", style: "Bloque compacto y contragolpe", attackingBias: -0.1, press: 0.5, rotation: 0.45 },
  nzl: { name: "Darren Bazeley", nationality: "Inglaterra", formation: "3-4-2-1", style: "Fisico aereo y orden", attackingBias: -0.05, press: 0.5, rotation: 0.5 },
  egy: { name: "Hossam Hassan", nationality: "Egipto", formation: "4-2-3-1", style: "Intensidad y peso de Salah", attackingBias: 0.2, press: 0.6, rotation: 0.45 },

  // Grupo H
  esp: { name: "Luis de la Fuente", nationality: "Espana", formation: "4-3-3", style: "Posesion, presion alta y banda", attackingBias: 0.55, press: 0.8, rotation: 0.5 },
  uru: { name: "Marcelo Bielsa", nationality: "Argentina", formation: "3-3-1-3", style: "Presion extrema y verticalidad", attackingBias: 0.5, press: 0.95, rotation: 0.4 },
  ksa: { name: "Georgios Donis", nationality: "Grecia", formation: "4-2-3-1", style: "Orden defensivo y transiciones", attackingBias: -0.05, press: 0.5, rotation: 0.5 },
  cpv: { name: "Pedro Brito (Bubista)", nationality: "Cabo Verde", formation: "4-4-2", style: "Bloque compacto y contragolpe", attackingBias: 0.0, press: 0.5, rotation: 0.45 },

  // Grupo I
  fra: { name: "Didier Deschamps", nationality: "Francia", formation: "4-2-3-1", style: "Pragmatismo con talento de elite", attackingBias: 0.35, press: 0.6, rotation: 0.45 },
  sen: { name: "Pape Thiaw", nationality: "Senegal", formation: "4-3-3", style: "Poderio fisico y transiciones", attackingBias: 0.2, press: 0.65, rotation: 0.45 },
  nor: { name: "Stale Solbakken", nationality: "Noruega", formation: "4-3-3", style: "Juego directo a sus estrellas", attackingBias: 0.35, press: 0.6, rotation: 0.4 },
  irq: { name: "Graham Arnold", nationality: "Australia", formation: "4-2-3-1", style: "Intensidad y orden", attackingBias: -0.05, press: 0.55, rotation: 0.5 },

  // Grupo J
  arg: { name: "Lionel Scaloni", nationality: "Argentina", formation: "4-3-3", style: "Equilibrio, presion selectiva y jerarquia", attackingBias: 0.35, press: 0.65, rotation: 0.45 },
  aut: { name: "Ralf Rangnick", nationality: "Alemania", formation: "4-2-2-2", style: "Gegenpressing puro y verticalidad", attackingBias: 0.45, press: 0.9, rotation: 0.5 },
  alg: { name: "Vladimir Petković", nationality: "Bosnia", formation: "3-4-3", style: "Tecnica y transiciones rapidas", attackingBias: 0.25, press: 0.6, rotation: 0.5 },
  jor: { name: "Jamal Sellami", nationality: "Marruecos", formation: "4-2-3-1", style: "Bloque medio y balon parado", attackingBias: -0.05, press: 0.5, rotation: 0.5 },

  // Grupo K
  por: { name: "Roberto Martinez", nationality: "Espana", formation: "4-3-3", style: "Posesion ofensiva y talento desatado", attackingBias: 0.5, press: 0.65, rotation: 0.5 },
  col: { name: "Nestor Lorenzo", nationality: "Argentina", formation: "4-2-3-1", style: "Posesion paciente y banda", attackingBias: 0.35, press: 0.6, rotation: 0.4 },
  uzb: { name: "Fabio Cannavaro", nationality: "Italia", formation: "4-2-3-1", style: "Orden y crecimiento generacional", attackingBias: 0.1, press: 0.55, rotation: 0.5 },
  cod: { name: "Sebastien Desabre", nationality: "Francia", formation: "4-3-3", style: "Fisico, presion y transiciones", attackingBias: 0.25, press: 0.7, rotation: 0.45 },

  // Grupo L
  eng: { name: "Thomas Tuchel", nationality: "Alemania", formation: "4-2-3-1", style: "Control posicional y presion estructurada", attackingBias: 0.4, press: 0.7, rotation: 0.5 },
  cro: { name: "Zlatko Dalic", nationality: "Croacia", formation: "4-3-3", style: "Dominio de medio campo y posesion", attackingBias: 0.3, press: 0.55, rotation: 0.4 },
  gha: { name: "Carlos Queiroz", nationality: "Portugal", formation: "4-3-3", style: "Orden, intensidad y transiciones", attackingBias: 0.2, press: 0.6, rotation: 0.45 },
  pan: { name: "Thomas Christiansen", nationality: "Dinamarca", formation: "4-2-3-1", style: "Orden, intensidad y contragolpe", attackingBias: 0.1, press: 0.6, rotation: 0.45 },
};
