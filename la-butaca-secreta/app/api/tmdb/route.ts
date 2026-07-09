import { NextRequest, NextResponse } from "next/server";

import { UserProfile } from "@/lib/conversation/types";
import { RecommendationEngine } from "@/lib/recommendation/engine";
import { sortByScore } from "@/lib/recommendation/scoring";

import {
  discoverMovies,
  discoverTV,
  getMovieCredits,
  getMovieDetails,
  getMovieProviders,
  getTVCredits,
  getTVDetails,
  getTVProviders,
} from "@/lib/tmdb/api";

import {
  mapRecommendation,
  mapToScoredItem,
} from "@/lib/tmdb/mapper";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const profile: UserProfile = {
      contentType:
        params.get("type") === "tv"
          ? "tv"
          : "movie",

      mood: params.get("mood") ?? undefined,

      company: params.get("company") ?? undefined,

      duration: params.get("duration") ?? undefined,

      pace: params.get("pace") ?? undefined,

      freshness:
        params.get("freshness") ?? undefined,

      discoveryMode:
        (params.get("discoveryMode") as
          | "impact"
          | "relax"
          | "hidden-gem"
          | "surprise") ?? undefined,

      language:
        params.get("language") ?? undefined,

      animation:
        params.get("animation") ?? undefined,

      restrictions: params
        .get("restrictions")
        ?.split(",")
        .filter(Boolean),
    };


    const engine =
      new RecommendationEngine(profile);

    const filters = engine.build();

async function fetchPages(
  currentFilters: typeof filters
) {
  return Promise.all(
    [1, 2, 3, 4, 5, 6, 7].map((page) =>
      currentFilters.type === "movie"
        ? discoverMovies(
            currentFilters,
            page
          )
        : discoverTV(
            currentFilters,
            page
          )
    )
  );
}

let pages = await fetchPages(
  filters
);

let items = pages.flatMap(
  (page) => page.results
);

// Ampliar automáticamente el rango temporal
// si hay pocos resultados

if (
  items.length < 30 &&
  filters.releaseAfter ===
    "2022-01-01"
) {
  pages = await fetchPages({
    ...filters,
    releaseAfter:
      "2020-01-01",
  });

  items = pages.flatMap(
    (page) => page.results
  );
}

if (
  items.length < 30 &&
  filters.releaseAfter ===
    "2022-01-01"
) {
  pages = await fetchPages({
    ...filters,
    releaseAfter:
      "2018-01-01",
  });

  items = pages.flatMap(
    (page) => page.results
  );
}


    const uniqueItems = Array.from(
      new Map(
        items.map((item) => [
          item.id,
          item,
        ])
      ).values()
    );

    const scored = sortByScore(
      uniqueItems.map(mapToScoredItem),
      {
        profile,
      }
    );

    const candidates = scored
      .slice(0, 20)
      .map(
        (item) =>
          uniqueItems.find(
            (movie) =>
              movie.id === item.id
          )!
      );

    const enriched = await Promise.all(
      candidates.map(async (movie) => {
        if (filters.type === "movie") {
          const [
            details,
            providers,
            credits,
          ] = await Promise.all([
            getMovieDetails(movie.id),
            getMovieProviders(movie.id),
            getMovieCredits(movie.id),
          ]);

          return {
            movie,
            details,
            providers,
            credits,
          };
        }

        const [
          details,
          providers,
          credits,
        ] = await Promise.all([
          getTVDetails(movie.id),
          getTVProviders(movie.id),
          getTVCredits(movie.id),
        ]);

        return {
          movie,
          details,
          providers,
          credits,
        };
      })
    );

    const finalPool = enriched.filter(
      (item) => {
        const providers =
          item.providers.results?.ES?.flatrate;

        return (
          Array.isArray(providers) &&
          providers.length > 0
        );
      }
    );

    if (finalPool.length === 0) {
      return NextResponse.json([]);
    }

    const rescored = sortByScore(
      finalPool.map(
        ({
          movie,
          details,
          providers,
          credits,
        }) => ({
          ...mapToScoredItem(movie),

          runtime:
            details.runtime ??
            details.episode_run_time?.[0] ??
            0,

          providers:
            providers.results?.ES?.flatrate?.map(
              (provider) =>
                provider.provider_name
            ) ?? [],

          director: credits.crew.find(
            (person) =>
              person.job === "Director"
          )?.name,

          cast:
            credits.cast
              .slice(0, 5)
              .map((actor) => actor.name) ??
            [],
        })
      ),
      {
        profile,
      }
    );

    const topPool = rescored.slice(
  0,
  Math.min(10, rescored.length)
);

const shuffled = [...topPool].sort(
  () => Math.random() - 0.5
);

const selected = [
  topPool[0],
  ...shuffled
    .filter(
      (item) =>
        item.id !== topPool[0].id
    )
    .slice(0, 2),
];

const recommendations =
  selected.map((item) => {
    const data = finalPool.find(
      (entry) =>
        entry.movie.id === item.id
    )!;

    return mapRecommendation(
      data.movie,
      data.details,
      data.providers,
      data.credits
    );
  });

    if (recommendations.length === 0) {
      const fallback = finalPool
        .slice(0, 3)
        .map((data) =>
          mapRecommendation(
            data.movie,
            data.details,
            data.providers,
            data.credits
          )
        );

      return NextResponse.json(fallback);
    }

    return NextResponse.json(
      recommendations
    );
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