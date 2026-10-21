import { NextRequest, NextResponse } from "next/server";

import {
  DiscoveryMode,
  UserProfile,
} from "@/lib/conversation/types";
import {
  RecommendationEngine,
} from "@/lib/recommendation/engine";
import { RecommendationFilters } from "@/lib/recommendation/filters";
import { sortByScore } from "@/lib/recommendation/scoring";
import {
  buildSurpriseReason,
  buildTrios,
} from "@/lib/recommendation/surprise";
import { buildRecommendationReason } from "@/lib/recommendation/prompt";
import {
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

// IDs permitidos estrictamente: Netflix (8), Prime (119), Disney+ (337), Max (1899, 384)
const ALLOWED_PROVIDER_IDS = [
  8, 119, 337, 1899, 384,
];

const DISCOVERY_MODES: DiscoveryMode[] = [
  "impact",
  "relax",
  "hidden-gem",
  "surprise",
];

// Páginas de "discover" que se piden por intento (20 títulos por página)
const DISCOVER_PAGES = [1, 2, 3, 4, 5, 6, 7];

// Con menos candidatos que esto, se amplían los filtros
const MIN_CANDIDATES = 30;

// Candidatos que pasan a la fase de detalle (1 llamada a TMDb por candidato)
const MAX_CANDIDATES = 40;

// Llamadas simultáneas a TMDb al enriquecer candidatos
const ENRICH_CONCURRENCY = 10;

// Máximo de recomendaciones devueltas (4 tandas de 3)
const MAX_RECOMMENDATIONS = 12;

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

    restrictions: params
      .get("restrictions")
      ?.split(",")
      .filter(Boolean),
  };
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
  filters: RecommendationFilters
): Promise<TMDBMovie[]> {
  const pages = await Promise.all(
    DISCOVER_PAGES.map((page) =>
      filters.type === "movie"
        ? discoverMovies(filters, page)
        : discoverTV(filters, page)
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
    const profile = parseProfile(
      request.nextUrl.searchParams
    );

    const filters = new RecommendationEngine(
      profile
    ).build();

    // ----------------------------------------------
    // 1) Candidatos (con intentos cada vez más amplios)
    // ----------------------------------------------

    let uniqueItems: TMDBMovie[] = [];

    for (const attempt of buildAttempts(
      filters
    )) {
      const found = await fetchCandidates(
        attempt
      );

      if (found.length > uniqueItems.length) {
        uniqueItems = found;
      }

      if (uniqueItems.length >= MIN_CANDIDATES) {
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
      { profile }
    )
      .slice(0, MAX_CANDIDATES)
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
    // 4) Filtro estricto: solo Netflix, Prime, Disney+ o Max
    // ----------------------------------------------

    const finalPool = enriched.filter(
      ({ details }) => {
        const flatrate =
          details["watch/providers"]?.results
            ?.ES?.flatrate;

        return (
          Array.isArray(flatrate) &&
          flatrate.some((provider) =>
            ALLOWED_PROVIDER_IDS.includes(
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
      { profile }
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
      MAX_RECOMMENDATIONS / 3
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

    return NextResponse.json(
      {
        error:
          "No se pudieron obtener recomendaciones.",
      },
      {
        status: 500,
      }
    );
  }
}
