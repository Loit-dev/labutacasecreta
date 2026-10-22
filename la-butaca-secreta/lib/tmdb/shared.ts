import type { SharedSet } from "@/lib/shareLink";

import { getMovieFull, getPersonFull, getTVFull } from "./api";
import { IMAGE_URL, mapRecommendation, type Recommendation } from "./mapper";
import type { TMDBCastCredit, TMDBFullDetails, TMDBMovie } from "./types";

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

/** Una aparición en la filmografía de un actor, para la rejilla de /actor/[id]. */
export type ActorCredit = {
  id: number;
  type: "movie" | "tv";
  title: string;
  year: number | null;
  poster: string | null;
  character?: string;
};

export type ActorDetails = {
  id: number;
  name: string;
  photo: string | null;
  credits: ActorCredit[];
};

// Algunos actores tienen filmografías enormes: se corta en las más
// populares para que la rejilla no sea interminable.
const MAX_ACTOR_CREDITS = 24;

function toActorCredit(item: TMDBCastCredit): ActorCredit {
  return {
    id: item.id,
    type: item.media_type,
    title: item.title ?? item.name ?? "Sin título",
    year:
      Number(
        (item.release_date ?? item.first_air_date ?? "").slice(0, 4)
      ) || null,
    poster: item.poster_path ? `${IMAGE_URL}${item.poster_path}` : null,
    character: item.character || undefined,
  };
}

/**
 * Ficha de un actor/actriz (/actor/[id]): foto, nombre y su
 * filmografía, cada título enlazando a su propia ficha (que ya
 * resuelve dónde verla). Null si TMDb no lo tiene o la petición falla.
 */
export async function getActorDetails(
  id: number
): Promise<ActorDetails | null> {
  try {
    const data = await getPersonFull(id);

    // Sin póster no hay nada que enseñar en la rejilla, y se
    // descartan duplicados (p. ej. un mismo título con dos personajes)
    const seen = new Set<string>();

    const credits = (data.combined_credits?.cast ?? [])
      .filter((item) => {
        if (!item.poster_path) return false;

        const key = `${item.media_type}-${item.id}`;

        if (seen.has(key)) return false;

        seen.add(key);

        return true;
      })
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, MAX_ACTOR_CREDITS)
      .map(toActorCredit);

    return {
      id: data.id,
      name: data.name,
      photo: data.profile_path ? `${IMAGE_URL}${data.profile_path}` : null,
      credits,
    };
  } catch (error) {
    console.error(`No se pudo cargar actor/${id}:`, error);

    return null;
  }
}
