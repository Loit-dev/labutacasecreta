import { NextRequest, NextResponse } from "next/server";

import { clientIp, isRateLimited } from "@/lib/rateLimit";
import { type SearchHit } from "@/lib/search";
import { searchMulti } from "@/lib/tmdb/api";
import { IMAGE_URL } from "@/lib/tmdb/mapper";
import type { TMDBMovie } from "@/lib/tmdb/types";

export const dynamic = "force-dynamic";

// Resultados de sobra para un desplegable, sin abrumar
const RESULTS_LIMIT = 8;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita acentos
}

/**
 * TMDb ordena /search/multi por popularidad, no por lo bien que
 * encaja el título con lo escrito: con consultas cortas o muy
 * populares cuela algún resultado sin relación real (p.ej. "Dune"
 * devolviendo "Anatomía de una caída"). Si hay resultados cuyo
 * título sí contiene lo escrito, nos quedamos solo con esos y se
 * acabó el ruido; si no hay ninguno (typos, títulos traducidos...)
 * dejamos el orden de TMDb tal cual, que seguirá siendo útil.
 */
function relevant(items: TMDBMovie[], query: string): TMDBMovie[] {
  const needle = normalize(query);

  const matches = items.filter((item) => {
    const candidates = [
      item.title,
      item.name,
      item.original_title,
      item.original_name,
    ].filter((value): value is string => Boolean(value));

    return candidates.some((value) => normalize(value).includes(needle));
  });

  return matches.length > 0 ? matches : items;
}

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

    const byType = (data.results ?? []).filter(
      (item) => item.media_type === "movie" || item.media_type === "tv"
    );

    const hits: SearchHit[] = relevant(byType, query)
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
