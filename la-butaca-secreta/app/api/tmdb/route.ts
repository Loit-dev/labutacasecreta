import { NextRequest, NextResponse } from "next/server";

import { UserProfile } from "@/lib/conversation/types";
import { RecommendationEngine } from "@/lib/recommendation/engine";
import { sortByScore } from "@/lib/recommendation/scoring";
import { diversify } from "@/lib/recommendation/diversity";
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

// IDs permitidos estrictamente: Netflix (8), Prime (119), Disney+ (337), Max (1899, 384)
const ALLOWED_PROVIDER_IDS = [8, 119, 337, 1899, 384];

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const profile: UserProfile = {
      contentType:
        params.get("type") === "tv"
          ? "tv"
          : "movie",

      mood: params.get("mood") ?? undefined,

      preferredGenre: params.get("preferredGenre") ?? undefined,

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

    console.log(profile);

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

    // Ampliar automáticamente el rango temporal si hay pocos resultados
    if (
      items.length < 30 &&
      filters.releaseAfter === "2022-01-01"
    ) {
      pages = await fetchPages({
        ...filters,
        releaseAfter: "2020-01-01",
      });

      items = pages.flatMap(
        (page) => page.results
      );
    }

    if (
      items.length < 30 &&
      filters.releaseAfter === "2022-01-01"
    ) {
      pages = await fetchPages({
        ...filters,
        releaseAfter: "2018-01-01",
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

    console.log("Unique:", uniqueItems.length);

    const scored = sortByScore(
      uniqueItems.map(mapToScoredItem),
      {
        profile,
      }
    );

    const candidates = scored
      .slice(0, 40)
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

    // FILTRO ESTRICTO: Solo permite elementos que estén disponibles en Netflix, Prime, Disney+ o Max
    const finalPool = enriched.filter(
      (item) => {
        const providers =
          item.providers.results?.ES?.flatrate;

        if (!Array.isArray(providers) || providers.length === 0) {
          return false;
        }

        return providers.some((p) =>
          ALLOWED_PROVIDER_IDS.includes(p.provider_id)
        );
      }
    );

    console.log("FinalPool:", finalPool.length);

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

    console.log("Rescored:", rescored.length);

    const selected = diversify(
      rescored,
      12
    );

    console.log("Selected:", selected.length);

    let recommendations =
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

    // Fallback en caso de que la diversificación no devuelva elementos
    if (recommendations.length === 0) {
      recommendations = finalPool
        .slice(0, 12)
        .map((data) =>
          mapRecommendation(
            data.movie,
            data.details,
            data.providers,
            data.credits
          )
        );
    }

    // AJUSTE A MÚLTIPLOS DE 3: Recorta el array para que la longitud sea 3, 6, 9 o 12
    const remainder = recommendations.length % 3;
    if (remainder !== 0) {
      recommendations = recommendations.slice(0, recommendations.length - remainder);
    }

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
