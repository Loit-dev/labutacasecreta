import {
  TMDBCredits,
  TMDBFullDetails,
  TMDBMovieDetails,
  TMDBResponse,
  TMDBWatchProviders,
} from "./types";

import { RecommendationFilters } from "@/lib/recommendation/filters";
import { toTvFilters } from "./tvGenres";

// Plataformas en las que se buscan y permiten recomendaciones.
// IDs de TMDB: Netflix (8), Prime Video (119), Disney+ (337),
// Max (1899 y 384) y Filmin (63). Incluye también los planes con
// anuncios de Netflix (1796) y Prime Video (2100).
export const ALLOWED_PROVIDER_IDS = [
  8, 1796, 119, 2100, 337, 1899, 384, 63,
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
  params.set(
    "with_watch_providers",
    filters.providerIds?.length
      ? filters.providerIds.join("|")
      : STREAMING_PROVIDERS
  );
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
      // "|" = cualquiera de ellos; "," = todos a la vez
      filters.withGenres.join(
        filters.withGenresAny ? "|" : ","
      )
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
      toTvFilters(filters),
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

// ======================================================
// CALENDARIO DE ESTRENOS
// ======================================================

// Estos datos cambian poco: se guardan en caché un día
const CALENDAR_REVALIDATE = 60 * 60 * 24;

/**
 * Títulos de las plataformas dadas (suscripción, España) que se
 * estrenan entre `from` y `to`. En películas se pide la fecha de
 * estreno digital (tipo 4), la más cercana a su llegada a la plataforma.
 */
export async function discoverCalendar(
  type: "movie" | "tv",
  options: {
    from: string;
    to: string;
    providerIds: number[];
    page?: number;
  }
) {
  const params = new URLSearchParams();

  params.set("language", "es-ES");
  params.set("page", String(options.page ?? 1));
  params.set("include_adult", "false");
  params.set("sort_by", "popularity.desc");
  params.set("watch_region", WATCH_REGION);
  params.set("with_watch_providers", options.providerIds.join("|"));
  params.set("with_watch_monetization_types", "flatrate");

  if (type === "movie") {
    // Sin «region»: vale que el estreno digital sea en cualquier país;
    // la fecha buena se comprueba después (España o, si no hay, EE. UU.)
    params.set("with_release_type", "4");
    params.set("release_date.gte", options.from);
    params.set("release_date.lte", options.to);
  } else {
    params.set("first_air_date.gte", options.from);
    params.set("first_air_date.lte", options.to);
  }

  return request<TMDBResponse>(
    `/discover/${type}?${params.toString()}`,
    CALENDAR_REVALIDATE
  );
}

interface TMDBReleaseDates {
  results?: {
    iso_3166_1: string;
    release_dates: { type: number; release_date: string }[];
  }[];
}

/**
 * Fecha de estreno digital («AAAA-MM-DD»): la de España y, si TMDb no la
 * tiene, la de EE. UU. o, si tampoco, la más temprana de cualquier país (muchas plataformas estrenan el mismo día en todo
 * el mundo, pero en TMDb solo está apuntada la de EE. UU.).
 */
export async function getDigitalDate(
  id: number
): Promise<{ date: string; region: "ES" | "US" | "OTHER" } | null> {
  const data = await request<TMDBReleaseDates>(
    `/movie/${id}/release_dates`,
    CALENDAR_REVALIDATE
  );

  for (const region of [WATCH_REGION, "US"] as const) {
    const entry = data.results?.find(
      (result) => result.iso_3166_1 === region
    );

    const digital = entry?.release_dates
      .filter((release) => release.type === 4)
      .map((release) => release.release_date.substring(0, 10))
      .sort()[0];

    if (digital) return { date: digital, region };
  }

  // Último recurso: el estreno digital más temprano en cualquier país
  const others = (data.results ?? [])
    .flatMap((entry) => entry.release_dates)
    .filter((release) => release.type === 4)
    .map((release) => release.release_date.substring(0, 10))
    .sort();

  return others[0] ? { date: others[0], region: "OTHER" } : null;
}

interface TMDBProviderList {
  results?: {
    provider_id: number;
    logo_path: string | null;
  }[];
}

/** Logos (url completa) por id de proveedor, para los que se piden. */
export async function getProviderLogos(
  ids: number[]
): Promise<Record<number, string>> {
  const data = await request<TMDBProviderList>(
    `/watch/providers/tv?watch_region=${WATCH_REGION}&language=es-ES`,
    CALENDAR_REVALIDATE
  );

  const logos: Record<number, string> = {};

  for (const provider of data.results ?? []) {
    if (ids.includes(provider.provider_id) && provider.logo_path) {
      logos[provider.provider_id] =
        `https://image.tmdb.org/t/p/w92${provider.logo_path}`;
    }
  }

  return logos;
}


// ------------------------------------------------------
// Series de TVmaze → TMDb
// ------------------------------------------------------

interface TMDBFindResponse {
  tv_results?: {
    id: number;
    name?: string;
    overview: string;
    poster_path: string | null;
    vote_average: number;
    popularity: number;
  }[];
}

/** Busca una serie de TMDb por su id de IMDb o de TheTVDB. */
export async function findTvByExternalId(
  externalId: string | number,
  source: "imdb_id" | "tvdb_id"
) {
  const data = await request<TMDBFindResponse>(
    `/find/${encodeURIComponent(String(externalId))}?external_source=${source}&language=es-ES`,
    CALENDAR_REVALIDATE
  );

  return data.tv_results?.[0] ?? null;
}

/** Ids de proveedor en suscripción (España) de una serie. */
export async function getTvFlatrateIds(id: number): Promise<number[]> {
  const data = await request<TMDBWatchProviders>(
    `/tv/${id}/watch/providers`,
    CALENDAR_REVALIDATE
  );

  const flatrate = data.results?.[WATCH_REGION]?.flatrate;

  return Array.isArray(flatrate)
    ? flatrate.map((provider) => provider.provider_id)
    : [];
}


// ------------------------------------------------------
// Estrenos destacados (lista manual)
// ------------------------------------------------------

/** Primera coincidencia de TMDb para un título y año. */
export async function searchTitle(
  type: "movie" | "tv",
  query: string,
  year?: number
) {
  const yearParam = !year
    ? ""
    : type === "movie"
      ? `&primary_release_year=${year}`
      : `&first_air_date_year=${year}`;

  const data = await request<TMDBResponse>(
    `/search/${type}?query=${encodeURIComponent(query)}&language=es-ES&include_adult=false${yearParam}`,
    CALENDAR_REVALIDATE
  );

  return data.results[0] ?? null;
}

/** Ids de proveedor en suscripción (España) de una película o serie. */
export async function getFlatrateIds(
  type: "movie" | "tv",
  id: number
): Promise<number[]> {
  const data = await request<TMDBWatchProviders>(
    `/${type}/${id}/watch/providers`,
    CALENDAR_REVALIDATE
  );

  const flatrate = data.results?.[WATCH_REGION]?.flatrate;

  return Array.isArray(flatrate)
    ? flatrate.map((provider) => provider.provider_id)
    : [];
}
