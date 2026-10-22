import { NextRequest, NextResponse } from "next/server";

import { clientIp, isRateLimited } from "@/lib/rateLimit";
import { type SearchHit } from "@/lib/search";
import { searchMulti } from "@/lib/tmdb/api";
import { IMAGE_URL } from "@/lib/tmdb/mapper";

export const dynamic = "force-dynamic";

// Resultados de sobra para un desplegable, sin abrumar
const RESULTS_LIMIT = 8;

/**
 * Buscador del cuadro "¿Qué película o serie buscas?": apoya el
 * desplegable que lleva a /pelicula/[id] o /serie/[id].
 */
export async function GET(request: NextRequest) {
  if (isRateLimited(`search:${clientIp(request)}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Demasiadas búsquedas, prueba en un minuto." },
      { status: 429 }
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  // Menos de 3 letras da demasiado ruido y gasta peticiones a TMDb
  // de sobra mientras se está escribiendo.
  if (query.length < 3) {
    return NextResponse.json<SearchHit[]>([]);
  }

  try {
    const data = await searchMulti(query);

    const hits: SearchHit[] = (data.results ?? [])
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .slice(0, RESULTS_LIMIT)
      .map((item) => ({
        id: item.id,
        type: item.media_type === "tv" ? "tv" : "movie",
        title: item.title ?? item.name ?? "Sin título",
        year:
          Number(
            (item.release_date ?? item.first_air_date ?? "").slice(0, 4)
          ) || null,
        poster: item.poster_path ? `${IMAGE_URL}${item.poster_path}` : null,
      }));

    return NextResponse.json(hits);
  } catch (error) {
    console.error("Error buscando en TMDb:", error);

    // Mejor una lista vacía que romper el desplegable
    return NextResponse.json<SearchHit[]>([]);
  }
}
