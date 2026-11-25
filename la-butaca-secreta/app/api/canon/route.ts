import { NextResponse } from "next/server";

import { CANON } from "@/data/canon/canon250";
import { type CanonResult } from "@/lib/canon";
import { mapLimited } from "@/lib/concurrency";
import { searchTitle } from "@/lib/tmdb/api";
import { logError } from "@/lib/log";

// La lista de 250 apenas cambia, así que se puede cachear mucho tiempo
// (igual que el resto de datos "casi fijos" de TMDb en lib/tmdb/api.ts).
// Literal, no una expresión calculada: Next.js analiza este export de
// forma estática y una expresión rompe el build (mismo motivo que en
// app/pelicula/[id]/page.tsx).
export const revalidate = 86400;

const POSTER_BASE = "https://image.tmdb.org/t/p/w185";

// Resolver 250 títulos de golpe contra TMDb: la misma concurrencia que
// usa el calendario para no disparar demasiadas peticiones a la vez.
const CONCURRENCY = 10;

export async function GET() {
  try {
    const resolved = await mapLimited(CANON, CONCURRENCY, async (entry) => {
      try {
        const match = await searchTitle("movie", entry.query, entry.year);

        const result: CanonResult = {
          title: entry.title,
          year: entry.year,
          decade: entry.decade,
          director: entry.director,
          country: entry.country,
          tmdbId: match?.id ?? null,
          poster: match?.poster_path ? `${POSTER_BASE}${match.poster_path}` : null,
          rating: match?.vote_average ? Math.round(match.vote_average * 10) / 10 : 0,
        };

        return result;
      } catch (error) {
        logError("canon.resolve", error, { query: entry.query });

        return {
          title: entry.title,
          year: entry.year,
          decade: entry.decade,
          director: entry.director,
          country: entry.country,
          tmdbId: null,
          poster: null,
          rating: 0,
        } satisfies CanonResult;
      }
    });

    return NextResponse.json(resolved);
  } catch (error) {
    logError("canon.route", error);

    return NextResponse.json(
      { error: "No se pudo cargar El Canon." },
      { status: 500 }
    );
  }
}
