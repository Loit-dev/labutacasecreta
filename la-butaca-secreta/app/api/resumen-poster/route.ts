import { NextRequest, NextResponse } from "next/server";

import { clientIp, isRateLimited } from "@/lib/rateLimit";
import { getTitleDetails } from "@/lib/tmdb/shared";

export const dynamic = "force-dynamic";

/**
 * Póster (y nota) de un único título por id, para "Mi Resumen": la
 * tabla `watched` no guarda el póster (ver lib/supabase/watched.ts),
 * así que la última vista y la mejor valorada lo piden aquí, bajo
 * demanda, solo para los 1-2 títulos que el resumen necesita mostrar.
 */
export async function GET(request: NextRequest) {
  if (isRateLimited(`resumen-poster:${clientIp(request)}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Demasiadas peticiones, prueba en un minuto." },
      { status: 429 }
    );
  }

  const params = request.nextUrl.searchParams;

  const type = params.get("type");
  const id = Number(params.get("id"));

  if (
    (type !== "movie" && type !== "tv") ||
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return NextResponse.json(
      { error: "Parámetros no válidos." },
      { status: 400 }
    );
  }

  const details = await getTitleDetails(type, id);

  if (!details) {
    return NextResponse.json(
      { error: "No encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { poster: details.poster, title: details.title },
    {
      headers: {
        "Cache-Control":
          "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
