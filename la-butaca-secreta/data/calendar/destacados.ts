import type { PlatformKey } from "@/lib/platforms";

/**
 * Estrenos importantes que TMDb no trae en su calendario (le falta la
 * fecha de estreno en la plataforma). Se apuntan a mano: título tal como
 * lo busca TMDb, año, día de llegada a la plataforma y plataforma.
 *
 * Si TMDb ya trae ese título ese día por su cuenta, esta entrada se ignora.
 */
export type Destacado = {
  type: "movie" | "tv";
  // Título para buscarlo en TMDb (en español o en original)
  query: string;
  // Año de estreno original (ayuda a acertar con la búsqueda)
  year: number;
  // Día de llegada a la plataforma, «AAAA-MM-DD»
  date: string;
  platform: PlatformKey;
};

export const DESTACADOS: Destacado[] = [
  {
    type: "movie",
    query: "Vaiana",
    year: 2026,
    date: "2026-10-21",
    platform: "disney",
  },
];
