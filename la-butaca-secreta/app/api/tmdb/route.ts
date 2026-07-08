import { NextRequest, NextResponse } from "next/server";

import { UserProfile } from "@/lib/conversation/types";

import { RecommendationEngine } from "@/lib/recommendation/engine";
import { sortByScore } from "@/lib/recommendation/scoring";

import {
  discoverMovies,
  discoverTV,
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

      company:
        params.get("company") ?? undefined,

      duration:
        params.get("duration") ?? undefined,

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

    const recommendationEngine =
      new RecommendationEngine(profile);

    const filters =
      recommendationEngine.build();

    // ===========================
    // Obtener unas 100 recomendaciones
    // ===========================

    const pages = await Promise.all(
      [1, 2, 3, 4, 5].map((page) =>
        filters.type === "tv"
          ? discoverTV(filters, page)
          : discoverMovies(filters, page)
      )
    );

    const tmdbItems = pages.flatMap(
      (page) => page.results
    );

    // ===========================
    // Eliminar duplicados
    // ===========================

    const uniqueItems = Array.from(
      new Map(
        tmdbItems.map((item) => [
          item.id,
          item,
        ])
      ).values()
    );

    // ===========================
    // Calcular score
    // ===========================

    const scoredItems = sortByScore(
      uniqueItems.map(mapToScoredItem),
      {
        profile,
      }
    );

    // ===========================
    // Obtener las 3 mejores
    // ===========================

    const topIds = scoredItems
      .slice(0, 3)
      .map((item) => item.id);

    const recommendations = topIds
      .map((id) =>
        uniqueItems.find(
          (movie) => movie.id === id
        )
      )
      .filter(Boolean)
      .map((movie) =>
        mapRecommendation(movie!)
      );

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