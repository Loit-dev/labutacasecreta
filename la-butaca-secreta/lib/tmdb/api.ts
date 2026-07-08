import { RecommendationFilters } from "@/lib/recommendation/filters";

import {
  TMDBMovie,
  TMDBMovieDetails,
  TMDBResponse,
  TMDBWatchProviders,
} from "./types";

const TOKEN = process.env.TMDB_API_TOKEN!;
const BASE_URL = process.env.TMDB_BASE_URL!;

async function request<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    },
    next: {
      revalidate: 3600,
    },
  });

  if (!response.ok) {
    console.error(await response.text());
    throw new Error("Error al conectar con TMDB");
  }

  return response.json();
}

function buildQuery(
  filters: RecommendationFilters,
  page: number
) {
  const params = new URLSearchParams();

  params.set("language", "es-ES");
  params.set("page", page.toString());
  params.set("include_adult", "false");
  params.set("vote_average.gte", "6.5");
  params.set("vote_count.gte", "300");
  params.set("sort_by", "popularity.desc");

  const today = new Date()
    .toISOString()
    .split("T")[0];

  if (filters.type === "movie") {
    params.set("include_video", "false");
    params.set("release_date.lte", today);

    if (filters.releaseAfter)
      params.set(
        "release_date.gte",
        filters.releaseAfter
      );

    if (filters.releaseBefore)
      params.set(
        "release_date.lte",
        filters.releaseBefore
      );
  } else {
    params.set("first_air_date.lte", today);

    if (filters.releaseAfter)
      params.set(
        "first_air_date.gte",
        filters.releaseAfter
      );

    if (filters.releaseBefore)
      params.set(
        "first_air_date.lte",
        filters.releaseBefore
      );
  }

  if (filters.withGenres.length) {
    params.set(
      "with_genres",
      filters.withGenres.join(",")
    );
  }

  if (filters.withoutGenres.length) {
    params.set(
      "without_genres",
      filters.withoutGenres.join(",")
    );
  }

  if (
    filters.type === "movie" &&
    filters.runtimeGte
  ) {
    params.set(
      "with_runtime.gte",
      filters.runtimeGte.toString()
    );
  }

  if (
    filters.type === "movie" &&
    filters.runtimeLte
  ) {
    params.set(
      "with_runtime.lte",
      filters.runtimeLte.toString()
    );
  }

  return params.toString();
}

export async function discoverMovies(
  filters: RecommendationFilters,
  page = 1
) {
  return request<TMDBResponse>(
    `/discover/movie?${buildQuery(
      filters,
      page
    )}`
  );
}

export async function discoverTV(
  filters: RecommendationFilters,
  page = 1
) {
  return request<TMDBResponse>(
    `/discover/tv?${buildQuery(
      filters,
      page
    )}`
  );
}

export async function getMovieDetails(
  id: number
) {
  return request<TMDBMovieDetails>(
    `/movie/${id}?language=es-ES`
  );
}

export async function getTVDetails(
  id: number
) {
  return request<TMDBMovieDetails>(
    `/tv/${id}?language=es-ES`
  );
}

export async function getMovieProviders(
  id: number
) {
  return request<TMDBWatchProviders>(
    `/movie/${id}/watch/providers`
  );
}

export async function getTVProviders(
  id: number
) {
  return request<TMDBWatchProviders>(
    `/tv/${id}/watch/providers`
  );
}

export async function getMovieCredits(
  id: number
) {
  return request(
    `/movie/${id}/credits?language=es-ES`
  );
}

export async function getTVCredits(
  id: number
) {
  return request(
    `/tv/${id}/credits?language=es-ES`
  );
}