import { NextRequest, NextResponse } from "next/server";

import {
  DiscoveryMode,
  UserProfile,
} from "@/lib/conversation/types";
import {
  RecommendationEngine,
} from "@/lib/recommendation/engine";
import { recentPoolFilters } from "@/lib/recommendation/eras";
import { RecommendationFilters } from "@/lib/recommendation/filters";
import {
  ALL_PLATFORM_KEYS,
  providerIdsFor,
} from "@/lib/platforms";
import { sortByScore } from "@/lib/recommendation/scoring";
import {
  buildSurpriseReason,
  buildTrios,
} from "@/lib/recommendation/surprise";
import { buildRecommendationReason } from "@/lib/recommendation/prompt";
import {
  ALLOWED_PROVIDER_IDS,
  discoverMovies,
  discoverTV,
  getMovieFull,
  getTVFull,
} from "@/lib/tmdb/api";

import {
  mapRecommendation,
  mapToScoredItem,
} from "@/lib/tmdb/mapper";

import {
  TMDBFullDetails,
  TMDBMovie,
} from "@/lib/tmdb/types";

// Siempre dinámico: depende de los parámetros de la URL.
export const dynamic = "force-dynamic";

// La primera búsqueda (sin caché) hace ~50 llamadas a TMDb:
// damos margen para que no se corte por tiempo en Vercel.
export const maxDuration = 30;

const DISCOVERY_MODES: DiscoveryMode[] = [
  "impact",
  "relax",
  "hidden-gem",
  "surprise",
];

// Dos modos de búsqueda:
// - "quick": una primera tanda rápida (pocas páginas y candidatos) para
//   que el usuario vea algo enseguida.
// - "full": la búsqueda completa (4 tandas de 3), que se pide justo después.
// Cada página de "discover" trae 20 títulos y cada candidato cuesta
// 1 llamada a TMDb para sus detalles.
const SEARCH_MODES = {
  quick: {
    pages: [1, 2, 3],
    minCandidates: 10,
    maxCandidates: 15,
    trios: 1,
  },
  full: {
    pages: [1, 2, 3, 4, 5, 6, 7],
    minCandidates: 30,
    maxCandidates: 40,
    trios: 4,
  },
} as const;

// Llamadas simultáneas a TMDb al enriquecer candidatos
const ENRICH_CONCURRENCY = 10;

// ======================================================
// HELPERS
// ======================================================

function parseProfile(
  params: URLSearchParams
): UserProfile {
  const discoveryMode = params.get(
    "discoveryMode"
  ) as DiscoveryMode | null;

  return {
    contentType:
      params.get("type") === "tv"
        ? "tv"
        : "movie",

    mood: params.get("mood") ?? undefined,

    preferredGenre:
      params.get("preferredGenre") ??
      undefined,

    company: params.get("company") ?? undefined,

    duration:
      params.get("duration") ?? undefined,

    pace: params.get("pace") ?? undefined,

    freshness:
      params.get("freshness") ?? undefined,

    // Solo aceptamos valores conocidos
    discoveryMode:
      discoveryMode &&
      DISCOVERY_MODES.includes(discoveryMode)
        ? discoveryMode
        : undefined,

    language:
      params.get("language") ?? undefined,

    animation:
      params.get("animation") ?? undefined,

    platforms: params.get("platforms") ?? undefined,

    restrictions: params
      .get("restrictions")
      ?.split(",")
      .filter(Boolean),
  };
}

/**
 * Lee una lista de números positivos separados por comas
 * ("12,34,56"), ignorando lo que no lo sea y limitando el tamaño.
 */
function parseIdList(
  value: string | null,
  max: number
): number[] {
  if (!value) return [];

  return value
    .split(",")
    .map(Number)
    .filter(
      (id) => Number.isInteger(id) && id > 0
    )
    .slice(0, max);
}

/**
 * Valida los parámetros que, si llegan con un valor raro, antes se
 * ignoraban en silencio y devolvían recomendaciones genéricas. Aquí
 * se rechazan con 400 para que el error no pase desapercibido.
 */
function validationError(
  params: URLSearchParams
): string | null {
  const type = params.get("type");

  if (type && type !== "movie" && type !== "tv") {
    return `"type" debe ser "movie" o "tv" (recibido: "${type}").`;
  }

  const platforms = params.get("platforms");

  if (platforms) {
    const unknown = platforms
      .split(",")
      .filter(Boolean)
      .filter(
        (key) => !ALL_PLATFORM_KEYS.includes(key as never)
      );

    if (unknown.length > 0) {
      return `"platforms" tiene valores desconocidos: ${unknown.join(", ")}.`;
    }
  }

  return null;
}

function shiftYears(
  date: string,
  years: number
) {
  const year = Number(date.substring(0, 4));

  return `${year - years}${date.substring(4)}`;
}

/**
 * Lista de intentos, del más preciso al más amplio.
 * Se detiene en cuanto uno devuelve candidatos suficientes.
 */
function buildAttempts(
  filters: RecommendationFilters
): RecommendationFilters[] {
  const attempts: RecommendationFilters[] = [
    filters,
  ];

  // 1) Ampliar el rango de fechas en "algo nuevo"
  if (filters.releaseAfter) {
    for (const years of [2, 4]) {
      attempts.push({
        ...filters,
        releaseAfter: shiftYears(
          filters.releaseAfter,
          years
        ),
      });
    }
  }

  // 2) Quitar los ajustes de "qué busco hoy" (nota / nº de votos)
  if (
    filters.sortBy ||
    filters.minVotes ||
    filters.maxVotes ||
    filters.minRating
  ) {
    attempts.push({
      ...filters,
      sortBy: undefined,
      minVotes: undefined,
      maxVotes: undefined,
      minRating: undefined,
      releaseAfter: filters.releaseAfter
        ? shiftYears(filters.releaseAfter, 4)
        : undefined,
    });
  }

  return attempts;
}

async function fetchCandidates(
  filters: RecommendationFilters,
  pageNumbers: readonly number[]
): Promise<TMDBMovie[]> {
  // Además de la búsqueda normal, otra con títulos recientes (si procede)
  const searches = [filters, recentPoolFilters(filters)].filter(
    (search): search is RecommendationFilters => search !== null
  );

  const pages = await Promise.all(
    searches.flatMap((search) =>
      pageNumbers.map((page) =>
        search.type === "movie"
          ? discoverMovies(search, page)
          : discoverTV(search, page)
      )
    )
  );

  const items = pages.flatMap(
    (page) => page.results
  );

  // Sin duplicados
  return Array.from(
    new Map(
      items.map((item) => [item.id, item])
    ).values()
  );
}

/**
 * Ejecuta `task` sobre cada elemento con un máximo de
 * `limit` llamadas simultáneas. Si una falla, se descarta
 * ese elemento (devuelve null) sin tumbar toda la petición.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(
    items.length
  ).fill(null);

  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;

      try {
        results[index] = await task(
          items[index]
        );
      } catch (error) {
        console.error(
          "No se pudo enriquecer un candidato:",
          error
        );
      }
    }
  }

  await Promise.all(
    Array.from(
      {
        length: Math.min(limit, items.length),
      },
      worker
    )
  );

  return results;
}

// ======================================================
// GET /api/tmdb
// ======================================================

export async function GET(
  request: NextRequest
) {
  try {
    const params = request.nextUrl.searchParams;

    const invalid = validationError(params);

    if (invalid) {
      return NextResponse.json(
        { error: invalid },
        { status: 400 }
      );
    }

    const profile = parseProfile(params);

    const mode =
      SEARCH_MODES[
        params.get("quick") === "1"
          ? "quick"
          : "full"
      ];

    // Títulos que no queremos volver a ver ("ya la vi", ya mostrados...)
    const excluded = new Set(
      parseIdList(params.get("exclude"), 300)
    );

    // Géneros de los títulos que el usuario ha rechazado
    // (se repite un género tantas veces como veces se rechazó)
    const dislikedGenres = parseIdList(
      params.get("avoid"),
      100
    );

    const filters: RecommendationFilters = {
      ...new RecommendationEngine(profile).build(),
      providerIds: providerIdsFor(profile.platforms),
    };

    // ----------------------------------------------
    // 1) Candidatos (con intentos cada vez más amplios)
    // ----------------------------------------------

    let uniqueItems: TMDBMovie[] = [];

    for (const attempt of buildAttempts(
      filters
    )) {
      const found = (
        await fetchCandidates(attempt, mode.pages)
      ).filter((item) => !excluded.has(item.id));

      if (found.length > uniqueItems.length) {
        uniqueItems = found;
      }

      if (uniqueItems.length >= mode.minCandidates) {
        break;
      }
    }

    if (uniqueItems.length === 0) {
      return NextResponse.json([]);
    }

    // ----------------------------------------------
    // 2) Primera puntuación (sin detalles) y top N
    // ----------------------------------------------

    const byId = new Map(
      uniqueItems.map((item) => [item.id, item])
    );

    const candidates = sortByScore(
      uniqueItems.map(mapToScoredItem),
      { profile, dislikedGenres }
    )
      .slice(0, mode.maxCandidates)
      .map((scored) => byId.get(scored.id)!);

    // ----------------------------------------------
    // 3) Detalles + créditos + plataformas (1 llamada)
    // ----------------------------------------------

    const enriched = (
      await mapWithConcurrency(
        candidates,
        ENRICH_CONCURRENCY,
        async (movie) => {
          const details: TMDBFullDetails =
            filters.type === "movie"
              ? await getMovieFull(movie.id)
              : await getTVFull(movie.id);

          return { movie, details };
        }
      )
    ).filter(
      (entry): entry is NonNullable<typeof entry> =>
        entry !== null
    );

    // ----------------------------------------------
    // 4) Filtro estricto: solo Netflix, Prime, Disney+, Max o Filmin
    // ----------------------------------------------

    const finalPool = enriched.filter(
      ({ details }) => {
        const flatrate =
          details["watch/providers"]?.results
            ?.ES?.flatrate;

        return (
          Array.isArray(flatrate) &&
          flatrate.some((provider) =>
            (filters.providerIds ?? ALLOWED_PROVIDER_IDS).includes(
              provider.provider_id
            )
          )
        );
      }
    );

    if (finalPool.length === 0) {
      return NextResponse.json([]);
    }

    // ----------------------------------------------
    // 5) Segunda puntuación (ya con duración y plataformas)
    // ----------------------------------------------

    const rescored = sortByScore(
      finalPool.map(({ movie, details }) => ({
        ...mapToScoredItem(movie),

        runtime:
          details.runtime ??
          details.episode_run_time?.[0] ??
          0,

        providers:
          details[
            "watch/providers"
          ]?.results?.ES?.flatrate?.map(
            (provider) =>
              provider.provider_name
          ) ?? [],

        director:
          details.credits?.crew?.find(
            (person) =>
              person.job === "Director"
          )?.name,

        cast:
          details.credits?.cast
            ?.slice(0, 5)
            .map((actor) => actor.name) ?? [],
      })),
      { profile, dislikedGenres }
    );

    // ----------------------------------------------
    // 6) Variedad y resultado final
    // ----------------------------------------------

    const poolById = new Map(
      finalPool.map((entry) => [
        entry.movie.id,
        entry,
      ])
    );

    // Tandas de 3: 🥇 🥈 por encaje (con variedad) y 🥉 sorpresa
    const trios = buildTrios(
      rescored,
      mode.trios
    );

    const recommendations = trios.map(
      (entry) => {
        const { movie, details } =
          poolById.get(entry.item.id)!;

        return {
          ...mapRecommendation(
            movie,
            details,
            details["watch/providers"],
            details.credits
          ),

          role: entry.role,

          reason:
            entry.role === "surprise"
              ? buildSurpriseReason(entry)
              : buildRecommendationReason(
                  profile,
                  {
                    genreIds: movie.genre_ids,
                    voteAverage:
                      movie.vote_average,
                    voteCount: movie.vote_count,
                  }
                ),
        };
      }
    );

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error(error);

    // En vistas previas y desarrollo devolvemos la causa para poder
    // diagnosticar (p. ej. falta el token de TMDb). En producción no.
    const detail =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        error:
          "No se pudieron obtener recomendaciones.",
        ...(process.env.VERCEL_ENV !== "production"
          ? { detail: detail.slice(0, 300) }
          : {}),
      },
      {
        status: 500,
      }
    );
  }
}
