import { ScoredItem } from "@/lib/recommendation/scoring/types";

import {
  TMDBCredits,
  TMDBMovie,
  TMDBMovieDetails,
  TMDBVideo,
  TMDBWatchProviders,
} from "./types";

const IMAGE_URL =
  process.env.TMDB_IMAGE_URL ??
  "https://image.tmdb.org/t/p/w500";

const PLACEHOLDER_POSTER = "/placeholder-poster.svg";

// Plataformas principales primero, para que no queden fuera
// al mostrar solo los 3 primeros logos.
const PROVIDER_PRIORITY = [
  "Netflix",
  "Prime Video",
  "Disney+",
  "Max",
];

const GENRES: Record<number, string> = {
  12: "Aventura",
  14: "Fantasía",
  16: "Animación",
  18: "Drama",
  27: "Terror",
  28: "Acción",
  35: "Comedia",
  36: "Historia",
  37: "Western",
  53: "Thriller",
  80: "Crimen",
  878: "Ciencia ficción",
  9648: "Misterio",
  10402: "Música",
  10749: "Romance",
  10751: "Familia",
  10752: "Bélica",
};

function normalizeProviderName(providerName: string) {
  const name = providerName
    .trim()
    .toLowerCase();

  if (
    name.includes("amazon") ||
    name.includes("prime")
  ) {
    return "Prime Video";
  }

  if (
    name.includes("netflix")
  ) {
    return "Netflix";
  }

  if (
    name.includes("disney")
  ) {
    return "Disney+";
  }

  if (
    name.includes("hbo") ||
    name.includes("max")
  ) {
    return "Max";
  }

  if (
    name.includes("apple")
  ) {
    return "Apple TV+";
  }

  if (
    name.includes("movistar")
  ) {
    return "Movistar+";
  }

  if (
    name.includes("mubi")
  ) {
    return "MUBI";
  }

  if (
    name.includes("filmin")
  ) {
    return "Filmin";
  }

  if (
    name.includes("flixole")
  ) {
    return "FlixOlé";
  }

  if (name.includes("crunchyroll")) {
    return "Crunchyroll";
  }

  return providerName.trim();
}

function priorityOf(name: string) {
  const index = PROVIDER_PRIORITY.indexOf(name);

  return index === -1
    ? PROVIDER_PRIORITY.length
    : index;
}

export interface Recommendation {
  id: number;
  title: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
  overview: string;
  poster: string;
  providers: {
    id: number;
    name: string;
    logo: string;
  }[];
  director?: string;
  cast: string[];
  reason?: string;
  tagline?: string;
  // Clave de YouTube del tráiler (si existe)
  trailerKey?: string;
  // Página de JustWatch con todas las plataformas en España
  watchLink?: string;
}

/**
 * Elige el mejor tráiler de YouTube: oficial > en español > cualquiera.
 */
function pickTrailer(videos: TMDBVideo[] = []) {
  const trailers = videos.filter(
    (video) =>
      video.site === "YouTube" &&
      video.type === "Trailer"
  );

  const score = (video: TMDBVideo) =>
    (video.official ? 2 : 0) +
    (video.iso_639_1 === "es" ? 1 : 0);

  return [...trailers].sort(
    (a, b) => score(b) - score(a)
  )[0]?.key;
}


export function mapToScoredItem(
  item: TMDBMovie
): ScoredItem {
  return {
    id: item.id,

    title:
      item.title ??
      item.name ??
      "Sin título",

    genres: item.genre_ids,

    voteAverage: item.vote_average,

    voteCount: item.vote_count,

    popularity: item.popularity,

    runtime: 0,

    releaseDate:
      item.release_date ??
      item.first_air_date,

    originalLanguage:
      item.original_language,

    score: 0,
  };
}

export function mapRecommendation(
  item: TMDBMovie,
  details?: TMDBMovieDetails,
  providers?: TMDBWatchProviders,
  credits?: TMDBCredits
): Recommendation {
  // Sin logo no podemos pintar el proveedor, así que se descarta
  const esProviders = (
    providers?.results?.ES?.flatrate ?? []
  ).filter((provider) => provider.logo_path);

  const director =
    credits?.crew.find(
      (person) => person.job === "Director"
    )?.name ??
    // Las series no suelen tener "Director": usamos el creador
    details?.created_by?.[0]?.name;

  return {
    id: item.id,

    title:
      item.title ??
      item.name ??
      "Sin título",

    year: Number(
      (
        item.release_date ??
        item.first_air_date ??
        "0"
      ).substring(0, 4)
    ),

    rating: Number(
      item.vote_average.toFixed(1)
    ),

    runtime:
      details?.runtime ??
      details?.episode_run_time?.[0] ??
      0,

    genres:
      details?.genres?.length
        ? details.genres.map(
            (genre) => genre.name
          )
        : item.genre_ids
            .map((id) => GENRES[id])
            .filter(Boolean),

    overview: item.overview,

    poster: item.poster_path
      ? `${IMAGE_URL}${item.poster_path}`
      : PLACEHOLDER_POSTER,

    providers: Array.from(
      new Map(
        esProviders.map((provider) => {
          const name = normalizeProviderName(
            provider.provider_name
          );

          return [
            name,
            {
              id: provider.provider_id,
              name,
              logo: `${IMAGE_URL}${provider.logo_path}`,
            },
          ];
        })
      ).values()
    )
      .sort(
        (a, b) =>
          priorityOf(a.name) -
          priorityOf(b.name)
      )
      .slice(0, 3),

    director,

    tagline: details?.tagline || undefined,

    trailerKey: pickTrailer(
      details?.videos?.results
    ),

    watchLink:
      providers?.results?.ES?.link,

    cast:
      credits?.cast
        .slice(0, 5)
        .map((actor) => actor.name) ?? [],
  };
}