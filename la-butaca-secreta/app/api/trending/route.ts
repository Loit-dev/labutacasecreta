import { NextRequest, NextResponse } from "next/server";

import { ALL_PLATFORM_KEYS, providerIdsFor } from "@/lib/platforms";
import { clientIp, isRateLimited } from "@/lib/rateLimit";
import {
  ALLOWED_PROVIDER_IDS,
  discoverTrending,
  getMovieFull,
  getTVFull,
} from "@/lib/tmdb/api";
import { mapRecommendation } from "@/lib/tmdb/mapper";
import { TMDBFullDetails, TMDBMovie } from "@/lib/tmdb/types";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

// Cuántos candidatos de "lo más visto" se comprueban (plataforma,
// detalles) antes de rendirse. Trending ya viene ordenado por
// popularidad, así que con pocas páginas suele bastar.
const PAGES = [1, 2];
const MAX_CHECKED = 15;
const CONCURRENCY = 8;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(items.length).fill(null);

  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;

      try {
        results[index] = await task(items[index]);
      } catch (error) {
        console.error("No se pudo comprobar un candidato trending:", error);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );

  return results;
}

/**
 * GET /api/trending?type=movie&platforms=netflix,prime&exclude=1,2,3
 *
 * Un único título: el más popular ahora mismo en TMDb que esté
 * disponible en alguna de las plataformas permitidas. Se usa como
 * relleno en «La carta de hoy» cuando no hay nada más concreto que
 * ofrecer en ese hueco.
 */
export async function GET(request: NextRequest) {
  try {
    if (isRateLimited(`trending:${clientIp(request)}`, 20, 60_000)) {
      return NextResponse.json(
        { error: "Demasiadas peticiones, prueba en un minuto." },
        { status: 429 }
      );
    }

    const params = request.nextUrl.searchParams;

    const typeParam = params.get("type");

    if (typeParam && typeParam !== "movie" && typeParam !== "tv") {
      return NextResponse.json(
        { error: `"type" debe ser "movie" o "tv" (recibido: "${typeParam}").` },
        { status: 400 }
      );
    }

    const type: "movie" | "tv" = typeParam === "tv" ? "tv" : "movie";

    const platformsParam = params.get("platforms");

    if (platformsParam) {
      const unknown = platformsParam
        .split(",")
        .filter(Boolean)
        .filter((key) => !ALL_PLATFORM_KEYS.includes(key as never));

      if (unknown.length > 0) {
        return NextResponse.json(
          { error: `"platforms" tiene valores desconocidos: ${unknown.join(", ")}.` },
          { status: 400 }
        );
      }
    }

    const allowedIds = platformsParam
      ? providerIdsFor(platformsParam)
      : ALLOWED_PROVIDER_IDS;

    const excluded = new Set(
      (params.get("exclude") ?? "")
        .split(",")
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)
    );

    const pages = await Promise.all(
      PAGES.map((page) => discoverTrending(type, page))
    );

    const candidates = Array.from(
      new Map(
        pages
          .flatMap((page) => page.results)
          .filter((item) => !excluded.has(item.id))
          .map((item) => [item.id, item])
      ).values()
    )
      // Ya viene por popularidad, pero por si se mezclan páginas
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, MAX_CHECKED);

    if (candidates.length === 0) {
      return NextResponse.json([]);
    }

    const enriched = (
      await mapWithConcurrency(
        candidates,
        CONCURRENCY,
        async (movie: TMDBMovie) => {
          const details: TMDBFullDetails =
            type === "movie"
              ? await getMovieFull(movie.id)
              : await getTVFull(movie.id);

          return { movie, details };
        }
      )
    ).filter(
      (entry): entry is NonNullable<typeof entry> => entry !== null
    );

    const match = enriched.find(({ details }) => {
      const flatrate = details["watch/providers"]?.results?.ES?.flatrate;

      return (
        Array.isArray(flatrate) &&
        flatrate.some((provider) => allowedIds.includes(provider.provider_id))
      );
    });

    if (!match) {
      return NextResponse.json([]);
    }

    const recommendation = {
      ...mapRecommendation(
        match.movie,
        match.details,
        match.details["watch/providers"],
        match.details.credits
      ),
      role: "trending" as const,
      reason: "Ahora mismo es de lo más visto en las plataformas.",
    };

    return NextResponse.json([recommendation]);
  } catch (error) {
    console.error(error);

    const detail = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "No se pudo obtener lo más visto ahora.",
        ...(process.env.VERCEL_ENV !== "production"
          ? { detail: detail.slice(0, 300) }
          : {}),
      },
      { status: 500 }
    );
  }
}
