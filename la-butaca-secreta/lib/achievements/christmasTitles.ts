/**
 * Lista corta de títulos navideños conocidos (id de TMDb), usada como
 * fallback para el logro "Navideño": TMDb no tiene un género
 * "navideño", así que lo ideal sería mirar las keywords del título
 * (hay una como "christmas"), pero eso exige una llamada a la API de
 * TMDb por título. Mientras no se implemente esa consulta, esta lista
 * cubre los clásicos más vistos — se puede ampliar sin tocar el resto
 * de la lógica (ver claude/sistema-logros.md, nota de implementación).
 */
export const CHRISTMAS_TITLE_IDS: { tmdbId: number; mediaType: "movie" | "tv" }[] = [
  { tmdbId: 5255, mediaType: "movie" }, // Love Actually
  { tmdbId: 10719, mediaType: "movie" }, // Scrooged
  { tmdbId: 771, mediaType: "movie" }, // Solo en casa
  { tmdbId: 772, mediaType: "movie" }, // Solo en casa 2
  { tmdbId: 9479, mediaType: "movie" }, // Pesadilla antes de Navidad
  { tmdbId: 2224, mediaType: "movie" }, // Elf
  { tmdbId: 9556, mediaType: "movie" }, // Polar Express
  { tmdbId: 2900, mediaType: "movie" }, // Qué bello es vivir
  { tmdbId: 503, mediaType: "movie" }, // El Grinch (2000)
  { tmdbId: 324849, mediaType: "movie" }, // El Grinch (2018)
  { tmdbId: 133365, mediaType: "movie" }, // Klaus
];

export function isKnownChristmasTitle(
  tmdbId: number,
  mediaType: "movie" | "tv"
): boolean {
  return CHRISTMAS_TITLE_IDS.some(
    (t) => t.tmdbId === tmdbId && t.mediaType === mediaType
  );
}
