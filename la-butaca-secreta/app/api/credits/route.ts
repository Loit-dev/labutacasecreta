import { NextRequest, NextResponse } from "next/server";

import { clientIp, isRateLimited } from "@/lib/rateLimit";
import { IMAGE_URL } from "@/lib/tmdb/mapper";
import { getMovieCredits, getTVCredits } from "@/lib/tmdb/api";

export const dynamic = "force-dynamic";

// Cuánto reparto se manda de vuelta: de sobra para encontrar un
// nombre repetido entre un par de títulos, sin pedir todo el casting.
const CAST_LIMIT = 6;

function photoUrl(profilePath: string | null): string | null {
  return profilePath ? `${IMAGE_URL}${profilePath}` : null;
}

/**
 * Reparto y director de una película o serie: lo usa la tarjeta de
 * "Compatibilidad" (lib/compatibilityExtras.ts), que busca un nombre
 * que se repita entre los pocos títulos en los que más coincidís, y
 * "Repetiste con ellos" del Resumen Anual (lib/wrappedExtras.ts), que
 * además enseña la foto de quien más se repite — de ahí
 * `castPhotos`/`directorPhoto`, en el mismo orden que `cast` para no
 * romper a quien solo usaba los nombres.
 */
export async function GET(request: NextRequest) {
  if (isRateLimited(`credits:${clientIp(request)}`, 60, 60_000)) {
    return NextResponse.json(
      { error: "Demasiadas peticiones, prueba en un minuto." },
      { status: 429 }
    );
  }

  const id = Number(request.nextUrl.searchParams.get("id"));
  const type = request.nextUrl.searchParams.get("type");

  if (!id || (type !== "movie" && type !== "tv")) {
    return NextResponse.json(
      { error: "Parámetros inválidos." },
      { status: 400 }
    );
  }

  try {
    const credits =
      type === "movie" ? await getMovieCredits(id) : await getTVCredits(id);

    const directorCrew = credits.crew.find(
      (member) => member.job === "Director"
    );
    const director = directorCrew?.name ?? null;
    const directorPhoto = photoUrl(directorCrew?.profile_path ?? null);

    const topCast = credits.cast.slice(0, CAST_LIMIT);
    const cast = topCast.map((member) => member.name);
    const castPhotos = topCast.map((member) => photoUrl(member.profile_path));

    return NextResponse.json(
      { director, directorPhoto, cast, castPhotos },
      {
        headers: {
          "Cache-Control":
            "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Error pidiendo créditos a TMDb:", error);

    return NextResponse.json(
      { error: "No se pudo obtener el reparto." },
      { status: 502 }
    );
  }
}
