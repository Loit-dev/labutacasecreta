import type { PlatformKey } from "@/lib/platforms";

/**
 * Novedades que TMDb no trae en su calendario (le falta la fecha en la
 * plataforma). Se apuntan a mano, a partir de JustWatch («Nuevo» del día).
 *
 * - `query`: título tal como lo busca TMDb (en español o en original).
 * - `year`: año de estreno original; ayuda a acertar si se conoce.
 * - `match: false`: no buscar en TMDb (títulos poco conocidos, donde la
 *   búsqueda podría traer otra cosa); sale solo con el título.
 * - `note`: texto bajo el título («Temporada 3»…).
 *
 * Si TMDb ya trae ese título ese día, la entrada se ignora. Salen por
 * delante de las demás en su día, en el orden de esta lista.
 */
export type Destacado = {
  type: "movie" | "tv";
  query: string;
  year?: number;
  date: string;
  platform: PlatformKey;
  match?: boolean;
  note?: string;
};

const D = "2026-11-04";

export const DESTACADOS: Destacado[] = [
  // Disney+
  // (HBO Max no trajo ningún título nuevo este día, por eso no tiene
  // bloque propio hoy)
  { type: "tv", query: "VisionQuest", date: D, platform: "disney", match: false, note: "Temporada 1" },
  { type: "tv", query: "Dragon Ball Super: Beerus", date: D, platform: "disney", match: false, note: "Temporada 1" },
  { type: "tv", query: "The Drop: Una saga de Snowfall", date: D, platform: "disney", note: "Temporada 1" },
  { type: "tv", query: "Colgados en Filadelfia", date: D, platform: "disney", note: "Temporada 18" },
  // ("Todas las de la ley" T2 ya está en decine21.ts este mismo día)
  { type: "tv", query: "Amor, dulce amor", date: D, platform: "disney", match: false, note: "Temporada 1" },
  { type: "tv", query: "Minnie Toons: Hotel para mascotas", date: D, platform: "disney", match: false, note: "Temporada 1" },
  { type: "tv", query: "Prodigiosa: Las aventuras de Ladybug", date: D, platform: "disney", match: false, note: "Temporada 6" },

  // Netflix
  { type: "tv", query: "El amor es ciego", date: D, platform: "netflix", match: false, note: "Temporada 11" },
  { type: "tv", query: "Pasapalabra", date: D, platform: "netflix", note: "Temporada 1" },
  { type: "tv", query: "El hormiguero", date: D, platform: "netflix", note: "Temporada 1" },
  // ("Desaparecida: Natalee Holloway" ya está en decine21.ts este mismo día)
  { type: "movie", query: "Rockstar", date: D, platform: "netflix", match: false },
  { type: "movie", query: "Sorda", year: 2025, date: D, platform: "netflix" },
  // ("La razón de estar contigo: Una Navidad perfecta" ya está en decine21.ts este mismo día)
  { type: "movie", query: "Los milagros del cielo", year: 2016, date: D, platform: "netflix" },
  { type: "movie", query: "Manmarziyaan", date: D, platform: "netflix", match: false },
  { type: "tv", query: "La Revuelta", date: D, platform: "netflix", note: "Temporada 3" },

  // Prime Video
  { type: "movie", query: "Medianoche en París", year: 2011, date: D, platform: "prime" },
  // ("Sticks: Cracks del golf" ya está en decine21.ts este mismo día)
  { type: "movie", query: "A Roma con amor", year: 2012, date: D, platform: "prime" },
  // ("El más grande" ya está en decine21.ts este mismo día)
  { type: "movie", query: "Luger", date: D, platform: "prime", match: false },
  // ("La mangosta" ya está en decine21.ts este mismo día)
  { type: "tv", query: "Covert Affairs", date: D, platform: "prime", match: false, note: "Temporadas 1 y 2" },
  { type: "movie", query: "Amor a lo bestia", year: 2024, date: D, platform: "prime" },
  { type: "movie", query: "Lady Outlaw", date: D, platform: "prime", match: false },

  // Filmin
  { type: "movie", query: "Eric, oficial de la reina", date: D, platform: "filmin", match: false },
  { type: "movie", query: "El visitante nocturno", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Bienvenido a Los Ángeles", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Cómo destruir al más famoso agente secreto del mundo", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Muchas gracias, Mr. Scrooge", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Scott en la Antártida", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Magic: El muñeco diabólico", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Cromwell, el rey de los bárbaros", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Los diez mandamientos", year: 1923, date: D, platform: "filmin", match: false },
  { type: "movie", query: "I... como Ícaro", date: D, platform: "filmin", match: false },
];
