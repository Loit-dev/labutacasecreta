import { ScoredItem } from "@/lib/recommendation/scoring/types";

import {
  TMDBCredits,
  TMDBMovie,
  TMDBMovieDetails,
  TMDBWatchProviders,
} from "./types";

const IMAGE_URL = process.env.TMDB_IMAGE_URL!;

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

  return providerName.trim();
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
  const esProviders =
    providers?.results?.ES?.flatrate ?? [];


console.log(
  "PROVIDERS TMDB:",
  esProviders.map(p => p.provider_name)
);





  const director = credits?.crew.find(
    (person) => person.job === "Director"
  );

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
      : "/placeholder-poster.jpg",

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
).slice(0, 3),

    director: director?.name,

    cast:
      credits?.cast
        .slice(0, 5)
        .map((actor) => actor.name) ?? [],
  };
}