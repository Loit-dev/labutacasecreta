import {
  TMDBCredits,
  TMDBMovieDetails,
  TMDBResponse,
  TMDBWatchProviders,
} from "./types";

import { RecommendationFilters } from "@/lib/recommendation/filters";

const TOKEN = process.env.TMDB_API_TOKEN!;
const BASE_URL = process.env.TMDB_BASE_URL!;

// IDs oficiales de TMDB: Netflix (8), Prime Video (119), Disney+ (337), Max (1899 y 384)
const STREAMING_PROVIDERS = "8|119|337|1899|384";
const WATCH_REGION = "ES"; // Cambia a "US", "MX", "AR", etc. según tu región objetivo

async function request<T>(
  endpoint: string
): Promise<T> {
  const response = await fetch(
    `${BASE_URL}${endpoint}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/json",
      },
      // 'no-store' para forzar la actualización limpia sin caché vieja
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

// ======================================================
// DISCOVER
// ======================================================

function buildDiscoverQuery(
  filters: RecommendationFilters,
  page: number
) {
  const params = new URLSearchParams();

  params.set("language", "es-ES");
  params.set("page", page.toString());
  params.set("include_adult", "false");

  // Filtros de calidad y puntuaciones
  params.set("vote_count.gte", "50");
  params.set("vote_average.gte", "6.0");

  // Filtro estricto por plataformas en suscripción activa (flatrate)
  params.set("watch_region", WATCH_REGION);
  params.set("with_watch_providers", STREAMING_PROVIDERS);
  params.set("with_watch_monetization_types", "flatrate");

  // Orden por popularidad descendente para mezclar estrenos recientes y populares
  params.set("sort_by", "popularity.desc");

  const today = new Date()
    .toISOString()
    .split("T")[0];

  if (filters.type === "movie") {
    params.set(
      "primary_release_date.lte",
      today
    );
  } else {
    params.set(
      "first_air_date.lte",
      today
    );
  }

  if (filters.withGenres?.length) {
    params.set(
      "with_genres",
      filters.withGenres.join(",")
    );
  }

  if (filters.withoutGenres?.length) {
    params.set(
      "without_genres",
      filters.withoutGenres.join(",")
    );
  }

  if (filters.releaseAfter) {
    if (filters.type === "movie") {
      params.set(
        "primary_release_date.gte",
        filters.releaseAfter
      );
    } else {
      params.set(
        "first_air_date.gte",
        filters.releaseAfter
      );
    }
  }

  if (filters.releaseBefore) {
    if (filters.type === "movie") {
      params.set(
        "primary_release_date.lte",
        filters.releaseBefore
      );
    } else {
      params.set(
        "first_air_date.lte",
        filters.releaseBefore
      );
    }
  }

  return params.toString();
}

export async function discoverMovies(
  filters: RecommendationFilters,
  page = 1
) {
  const endpoint =
    `/discover/movie?${buildDiscoverQuery(
      filters,
      page
    )}`;

  return request<TMDBResponse>(
    endpoint
  );
}

export async function discoverTV(
  filters: RecommendationFilters,
  page = 1
) {
  const endpoint =
    `/discover/tv?${buildDiscoverQuery(
      filters,
      page
    )}`;

  return request<TMDBResponse>(
    endpoint
  );
}

// ======================================================
// DETAILS
// ======================================================

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

// ======================================================
// PROVIDERS
// ======================================================

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

// ======================================================
// CREDITS
// ======================================================

export async function getMovieCredits(
  id: number
) {
  return request<TMDBCredits>(
    `/movie/${id}/credits?language=es-ES`
  );
}

export async function getTVCredits(
  id: number
) {
  return request<TMDBCredits>(
    `/tv/${id}/credits?language=es-ES`
  );
}