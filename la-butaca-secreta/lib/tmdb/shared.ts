import type { SharedSet } from "@/lib/shareLink";

import { getMovieFull, getTVFull } from "./api";
import { mapRecommendation, type Recommendation } from "./mapper";
import type { TMDBFullDetails, TMDBMovie } from "./types";

// /movie/{id} y /tv/{id} devuelven también los datos básicos
type DetailsWithBasics = TMDBFullDetails & {
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  original_language?: string;
  popularity?: number;
};

/** Convierte la ficha completa en el formato de un resultado de búsqueda. */
export function detailsToItem(
  id: number,
  details: DetailsWithBasics
): TMDBMovie {
  return {
    id,
    title: details.title,
    name: details.name,
    overview: details.overview ?? "",
    poster_path: details.poster_path ?? null,
    backdrop_path: details.backdrop_path ?? null,
    release_date: details.release_date,
    first_air_date: details.first_air_date,
    vote_average: details.vote_average ?? 0,
    vote_count: details.vote_count ?? 0,
    genre_ids: (details.genres ?? []).map((genre) => genre.id),
    adult: false,
    original_language: details.original_language ?? "",
    popularity: details.popularity ?? 0,
  };
}

/**
 * Datos de los títulos de un enlace compartido, en el mismo orden.
 * Si alguno no se puede cargar, se omite sin romper el resto.
 */
export async function getSharedRecommendations(
  set: SharedSet
): Promise<Recommendation[]> {
  const loaded = await Promise.all(
    set.entries.map(async (entry): Promise<Recommendation | null> => {
      try {
        const details = (
          set.type === "movie"
            ? await getMovieFull(entry.id)
            : await getTVFull(entry.id)
        ) as DetailsWithBasics;

        return {
          ...mapRecommendation(
            detailsToItem(entry.id, details),
            details,
            details["watch/providers"],
            details.credits
          ),
          role: entry.role,
        };
      } catch (error) {
        console.error(
          "No se pudo cargar un título compartido:",
          error
        );

        return null;
      }
    })
  );

  return loaded.filter(
    (item): item is Recommendation => item !== null
  );
}

/**
 * Ficha completa de un único título (para /pelicula/[id] y
 * /serie/[id]). Null si TMDb no lo tiene o la petición falla, para
 * que la página pueda responder con un 404 en vez de reventar.
 */
export async function getTitleDetails(
  type: "movie" | "tv",
  id: number
): Promise<Recommendation | null> {
  try {
    const details = (
      type === "movie" ? await getMovieFull(id) : await getTVFull(id)
    ) as DetailsWithBasics;

    return mapRecommendation(
      detailsToItem(id, details),
      details,
      details["watch/providers"],
      details.credits
    );
  } catch (error) {
    console.error(`No se pudo cargar ${type}/${id}:`, error);

    return null;
  }
}
