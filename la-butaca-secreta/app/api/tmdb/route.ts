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

    // ===========================
    // Obtener aproximadamente 100 títulos
    // ===========================

    const pages = await Promise.all(
      [1, 2, 3, 4, 5].map((page) =>
        filters.type === "movie"
          ? discoverMovies(filters, page)
          : discoverTV(filters, page)
      )
    );

    const items = pages.flatMap(
      (page) => page.results
    );

    // ===========================
    // Eliminar duplicados
    // ===========================

    const uniqueItems = Array.from(
      new Map(
        items.map((item) => [
          item.id,
          item,
        ])
      ).values()
    );

    // ===========================
    // Primer scoring
    // ===========================

    const scored = sortByScore(
      uniqueItems.map(mapToScoredItem),
      {
        profile,
      }
    );

    // Nos quedamos con las 10 mejores

    const candidates = scored
      .slice(0, 10)
      .map((item) =>
        uniqueItems.find(
          (movie) => movie.id === item.id
        )!
      );

    // ===========================
    // Obtener detalles completos
    // ===========================

    const enriched =
      await Promise.all(
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

    // CONTINÚA EN LA SEGUNDA PARTE
    // ===========================
    // Segundo scoring (con datos enriquecidos)
    // ===========================

    const rescored = sortByScore(
      enriched.map(
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

    // ===========================
    // Top 3 definitivo
    // ===========================

    const recommendations = rescored
      .slice(0, 3)
      .map((item) => {
        const data = enriched.find(
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