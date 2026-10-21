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

const D = "2026-10-21";

export const DESTACADOS: Destacado[] = [
  // Disney+
  { type: "movie", query: "Vaiana", year: 2026, date: D, platform: "disney", note: "Estreno destacado" },
  { type: "tv", query: "Colgados en Filadelfia", date: D, platform: "disney", note: "Temporada 18" },
  { type: "tv", query: "The Drop: Una saga de Snowfall", date: D, platform: "disney", note: "Temporada 1" },
  { type: "tv", query: "La caza mortal", date: D, platform: "disney", note: "Temporada 1" },
  { type: "tv", query: "Asesinato en el aire: ¿Quién derribó el vuelo MH17?", date: D, platform: "disney", note: "Temporada 1" },

  // Netflix
  { type: "tv", query: "La Revuelta", date: D, platform: "netflix", note: "Temporada 3" },
  { type: "tv", query: "Pasapalabra", date: D, platform: "netflix", note: "Temporada 1" },
  { type: "tv", query: "El hormiguero", date: D, platform: "netflix", note: "Temporada 1" },
  { type: "tv", query: "Boruto: Naruto Next Generations", date: D, platform: "netflix", note: "Temporada 1" },
  { type: "tv", query: "Allegedly with Ellison Barber", date: D, platform: "netflix", match: false, note: "Temporada 1" },
  { type: "movie", query: "La noche de Halloween", date: D, platform: "netflix" },
  { type: "tv", query: "El experimento de la cárcel de Stanford: Un nuevo enfoque", date: D, platform: "netflix", note: "Temporada 1" },
  { type: "tv", query: "Las madres de los Pingüinos", date: D, platform: "netflix", note: "Temporada 2" },

  // Max
  { type: "tv", query: "Detrás de la máscara: Aileen Wuornos", date: D, platform: "max", match: false, note: "Temporada 1" },
  { type: "tv", query: "Chillin Island", date: D, platform: "max", match: false, note: "Temporada 1" },
  { type: "tv", query: "Superpiscinas", date: D, platform: "max", note: "Temporadas 2 y 3" },
  { type: "movie", query: "La maldición de Lizzie Borden", date: D, platform: "max" },

  // Prime Video
  { type: "movie", query: "Tiny Tim: Rey por un día", date: D, platform: "prime", match: false },
  { type: "movie", query: "James Bond contra Goldfinger", date: D, platform: "prime" },
  { type: "movie", query: "Víctima imperfecta", date: D, platform: "prime", match: false },
  { type: "movie", query: "Wilding, el regreso de la naturaleza", date: D, platform: "prime", match: false },
  { type: "movie", query: "Aprendiz de Asesino", date: D, platform: "prime", match: false },
  { type: "movie", query: "Red Rock West", date: D, platform: "prime" },
  { type: "movie", query: "La legión de los hombres sin alma", date: D, platform: "prime", match: false },
  { type: "movie", query: "Gigantes africanos", date: D, platform: "prime", match: false },

  // Filmin
  { type: "movie", query: "Let Our Mountains Live", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Rural", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Christiania", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Yanuni", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Power Station", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Elements Of(f) Balance", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Los sueños que compartimos", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Daughters of the Forest", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Social Landscapes", date: D, platform: "filmin", match: false },
  { type: "movie", query: "Children of Rohingya", date: D, platform: "filmin", match: false },
];
