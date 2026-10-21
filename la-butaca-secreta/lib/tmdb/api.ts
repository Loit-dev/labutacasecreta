import {
  TMDBCredits,
  TMDBFullDetails,
  TMDBMovieDetails,
  TMDBResponse,
  TMDBWatchProviders,
} from "./types";

import { RecommendationFilters } from "@/lib/recommendation/filters";

// Plataformas en las que se buscan y permiten recomendaciones.
// IDs de TMDB: Netflix (8), Prime Video (119), Disney+ (337),
// Max (1899 y 384) y Filmin (63).
export const ALLOWED_PROVIDER_IDS = [
  8, 119, 337, 1899, 384, 63,
];

// Formato de TMDB para "cualquiera de estas": ids separados por |
const STREAMING_PROVIDERS =
  ALLOWED_PROVIDER_IDS.join("|");
const WATCH_REGION = "ES"; // Cambia a "US", "MX", "AR", etc. según tu región objetivo

// Tiempos de caché (segundos). Los detalles de una película
// casi no cambian; los listados de "discover" sí un poco más.
const DISCOVER_REVALIDATE = 60 * 30;
const DETAILS_REVALIDATE = 60 * 60 * 6;

function getConfig() {
  const token = process.env.TMDB_API_TOKEN;

  if (!token) {
    throw new Error(
      "Falta la variable de entorno TMDB_API_TOKEN (revisa .env.local o los ajustes de Vercel)."
    );
  }

  return {
    token,
    baseUrl:
      process.env.TMDB_BASE_URL ??
      "https://api.themoviedb.org/3",
  };
}

async function request<T>(
  endpoint: string,
  revalidate?: number
): Promise<T> {
  const { token, baseUrl } = getConfig();

  const response = await fetch(
    `${baseUrl}${endpoint}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      ...(revalidate
        ? { next: { revalidate } }
        : { cache: "no-store" as const }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `TMDb ${response.status} en ${endpoint.split("?")[0]}: ${await response.text()}`
    );
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
  params.set(
    "vote_count.gte",
    String(filters.minVotes ?? 50)
  );

  if (filters.maxVotes) {
    params.set(
      "vote_count.lte",
      String(filters.maxVotes)
    );
  }

  params.set(
    "vote_average.gte",
    String(filters.minRating ?? 6)
  );

  // Filtro estricto por plataformas en suscripción activa (flatrate)
  params.set("watch_region", WATCH_REGION);
  params.set("with_watch_providers", STREAMING_PROVIDERS);
  params.set("with_watch_monetization_types", "flatrate");

  // Por defecto popularidad (mezcla estrenos y títulos conocidos);
  // "impacto" y "joya oculta" ordenan por nota.
  params.set(
    "sort_by",
    filters.sortBy ?? "popularity.desc"
  );

  // Duración: solo en películas (en series el runtime es por episodio)
  if (filters.type === "movie") {
    if (filters.runtimeGte) {
      params.set(
        "with_runtime.gte",
        String(filters.runtimeGte)
      );
    }

    if (filters.runtimeLte) {
      params.set(
        "with_runtime.lte",
        String(filters.runtimeLte)
      );
    }
  }

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
    endpoint,
    DISCOVER_REVALIDATE
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
    endpoint,
    DISCOVER_REVALIDATE
  );
}

// ======================================================
// DETAILS + CREDITS + PROVIDERS EN UNA SOLA LLAMADA
// ======================================================

export async function getMovieFull(
  id: number
) {
  return request<TMDBFullDetails>(
    `/movie/${id}?language=es-ES&append_to_response=credits,watch/providers,videos&include_video_language=es,en`,
    DETAILS_REVALIDATE
  );
}

export async function getTVFull(
  id: number
) {
  return request<TMDBFullDetails>(
    `/tv/${id}?language=es-ES&append_to_response=credits,watch/providers,videos&include_video_language=es,en`,
    DETAILS_REVALIDATE
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