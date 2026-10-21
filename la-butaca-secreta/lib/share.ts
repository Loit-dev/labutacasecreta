import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Lógica pura del botón «Compartir» (sin React ni navegador),
 * para poder probarla.
 */

export type ShareKind = "movie" | "tv";

export type ShareItem = {
  id?: number;
  title: string;
  year?: number;
  rating?: number;
  role?: "main" | "surprise";
  // De dónde se carga el póster (ya en nuestro propio dominio)
  posterUrl?: string;
};

// Los pósters de TMDb se piden a través de nuestro servidor
// para que el navegador pueda dibujarlos en un canvas sin
// problemas de permisos (CORS).
const TMDB_POSTER = /\/t\/p\/w\d+(\/[A-Za-z0-9_-]+\.(?:jpe?g|png))$/;

export const POSTER_PATH = /^\/[A-Za-z0-9_-]{5,80}\.(?:jpe?g|png)$/;

/** Dirección desde la que dibujar el póster, o undefined si no hay. */
export function posterSource(
  poster?: string
): string | undefined {
  if (!poster) return undefined;

  const match = TMDB_POSTER.exec(poster);

  if (match) {
    return `/api/poster?p=${encodeURIComponent(match[1])}`;
  }

  // Imagen local (por ejemplo, el póster por defecto)
  return poster.startsWith("/") ? poster : undefined;
}

/** Texto que acompaña a la imagen al compartirla. */
export function buildShareText(
  titles: string[],
  kind: ShareKind,
  link: string = SITE_URL,
  audience?: string,
  percent?: number
): string {
  const what = kind === "tv" ? "series" : "películas";

  const list = titles.filter(Boolean).join(", ");

  if (list && audience) {
    const match =
      percent === undefined ? "" : ` (${percent} % de coincidencia)`;

    return `Sugerencias de ${what} para ${audience}${match}: ${list}. Míralas aquí, en ${SITE_NAME}: ${link}`;
  }

  return list
    ? `Mis sugerencias de ${what} para hoy: ${list}. Míralas aquí, en ${SITE_NAME}: ${link}`
    : `Encuentra tus ${what} para hoy en ${SITE_NAME}: ${link}`;
}

export const SHARE_FILE_NAME = "mis-sugerencias-la-butaca-secreta.png";

/**
 * Recorre una lista de elementos con el teclado (Tab / Shift+Tab)
 * sin salirse: del último pasa al primero y al revés.
 */
export function cycleIndex(
  current: number,
  length: number,
  backwards: boolean
): number {
  if (length <= 0) return -1;

  if (current < 0 || current >= length) {
    return backwards ? length - 1 : 0;
  }

  return backwards
    ? (current - 1 + length) % length
    : (current + 1) % length;
}
