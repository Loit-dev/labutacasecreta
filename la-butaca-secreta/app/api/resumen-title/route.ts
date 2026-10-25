import { NextRequest, NextResponse } from "next/server";

import { clientIp, isRateLimited } from "@/lib/rateLimit";
import { getTitleDetails } from "@/lib/tmdb/shared";

export const dynamic = "force-dynamic";

/**
 * Ficha completa de un único título por id, para "Mi Resumen": la
 * tabla `watched` solo guarda título, nota y géneros (ver
 * lib/supabase/watched.ts), así que la última vista, la mejor
 * valorada y la favorita elegida a mano piden aquí el resto (póster,
 * sinopsis, año, duración, plataformas…) para mostrarse con el mismo
 * formato de tarjeta que el resto de la web (RecommendationCard).
 */
export async function GET(request: NextRequest) {
  if (isRateLimited(`resumen-title:${clientIp(request)}`, 30, 60_000)) {
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

  return NextResponse.json(details, {
    headers: {
      "Cache-Control":
        "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
