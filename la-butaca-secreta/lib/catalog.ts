/**
 * Páginas SEO de «género + plataforma» (/pelis/terror/netflix,
 * /series/comedia/prime...). No son resultado del cuestionario: son
 * listados fijos, pensados para aparecer en búsquedas y traer gente
 * nueva, que luego invitamos a probar el cuestionario o Butaca Exprés.
 *
 * Reutiliza el mismo motor de discover/scoring que el resto de la
 * app (lib/recommendation, lib/tmdb) en vez de duplicar lógica.
 */

import { discoverMovies, discoverTV } from "@/lib/tmdb/api";
import { mapRecommendation, type Recommendation } from "@/lib/tmdb/mapper";
import {
  PreferredGenreMap,
  RecommendationFilters,
} from "@/lib/recommendation/filters";
import { PLATFORMS, type PlatformKey } from "@/lib/platforms";

export type CatalogType = "movie" | "tv";

export type CatalogGenre = {
  // Segmento de la URL
  slug: string;
  // Clave del cuestionario (profile.preferredGenre / PreferredGenreMap)
  key: string;
  // Para frases como «películas de terror»
  label: string;
};

export const CATALOG_GENRES: CatalogGenre[] = [
  { slug: "terror", key: "horror", label: "terror" },
  { slug: "comedia", key: "comedy", label: "comedia" },
  { slug: "accion", key: "action", label: "acción" },
  { slug: "thriller", key: "thriller", label: "thriller" },
  { slug: "drama", key: "drama", label: "drama" },
  { slug: "romance", key: "romance", label: "romance" },
  { slug: "ciencia-ficcion", key: "scifi", label: "ciencia ficción" },
  { slug: "familia", key: "family", label: "familia" },
];

export function genreBySlug(slug: string): CatalogGenre | undefined {
  return CATALOG_GENRES.find((genre) => genre.slug === slug);
}

export function platformBySlug(
  slug: string
): (typeof PLATFORMS)[number] | undefined {
  return PLATFORMS.find((platform) => platform.key === slug);
}

export function catalogParams(): {
  genero: string;
  plataforma: PlatformKey;
}[] {
  return CATALOG_GENRES.flatMap((genre) =>
    PLATFORMS.map((platform) => ({
      genero: genre.slug,
      plataforma: platform.key,
    }))
  );
}

const RESULTS_LIMIT = 12;

export type CatalogPage = {
  genre: CatalogGenre;
  platform: (typeof PLATFORMS)[number];
  items: Recommendation[];
};

/**
 * Carga los títulos de una combinación género+plataforma. Devuelve
 * null si el género o la plataforma no existen (404 en la página).
 */
export async function fetchCatalogPage(
  type: CatalogType,
  generoSlug: string,
  plataformaSlug: string
): Promise<CatalogPage | null> {
  const genre = genreBySlug(generoSlug);
  const platform = platformBySlug(plataformaSlug);

  if (!genre || !platform) return null;

  const targetGenres = PreferredGenreMap[genre.key] ?? [];

  const filters: RecommendationFilters = {
    type,
    withGenres: targetGenres,
    withGenresAny: targetGenres.length > 1,
    // Igual que en el cuestionario: en "familia" no queremos que se
    // cuele terror, thriller o crimen.
    withoutGenres: genre.key === "family" ? [27, 53, 80] : [],
    providerIds: platform.ids,
    sortBy: "popularity.desc",
  };

  const response =
    type === "movie"
      ? await discoverMovies(filters)
      : await discoverTV(filters);

  const items = (response.results ?? [])
    .slice(0, RESULTS_LIMIT)
    .map((item) => mapRecommendation(item));

  return { genre, platform, items };
}
