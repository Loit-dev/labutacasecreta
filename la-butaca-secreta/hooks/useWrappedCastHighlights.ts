"use client";

import { useEffect, useRef, useState } from "react";

import { topCastHighlights, type CastCredit } from "@/lib/wrappedExtras";
import type { CastHighlights } from "@/lib/wrappedExtras";

type TitleRef = { tmdbId: number; mediaType: "movie" | "tv"; title: string };

// /api/credits limita a 60 peticiones/min por IP (ver app/api/credits/route.ts):
// con esto de margen, ni la cuenta más activa del año se pasa.
export const MAX_TITLES = 50;
const CONCURRENCY = 5;

// El reparto de un título no cambia mientras dura la sesión, y esta
// pantalla se desmonta y remonta cada vez que se navega fuera de
// "Repetiste y descubriste" y se vuelve (el carrusel del Resumen solo
// mantiene montada la diapositiva actual) — sin esto, ir y venir
// repetía las mismas peticiones a /api/credits una y otra vez. Con un
// caché de módulo (vive mientras dure la pestaña, se comparte entre
// todas las veces que se monte el hook) ese ir y venir es gratis.
const creditsCache = new Map<string, CastCredit>();

async function fetchTitleCredits(ref: TitleRef): Promise<CastCredit> {
  const cacheKey = `${ref.mediaType}-${ref.tmdbId}`;
  const cached = creditsCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `/api/credits?id=${ref.tmdbId}&type=${ref.mediaType}`
    );

    if (!response.ok) return { director: null, cast: [], title: ref.title };

    const data = await response.json();

    const credit: CastCredit = {
      director: typeof data.director === "string" ? data.director : null,
      directorPhoto:
        typeof data.directorPhoto === "string" ? data.directorPhoto : null,
      cast: Array.isArray(data.cast) ? data.cast : [],
      castPhotos: Array.isArray(data.castPhotos) ? data.castPhotos : [],
      title: ref.title,
    };

    creditsCache.set(cacheKey, credit);

    return credit;
  } catch {
    return { director: null, cast: [], title: ref.title };
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );

  return results;
}

/**
 * "Repetiste con ellos" (lib/wrappedExtras.ts): pide el reparto de
 * cada título visto este año (con tope y concurrencia limitada, ver
 * arriba) y agrega el actor/actriz y el director que más se repiten.
 * Se calcula perezosamente, solo cuando `titles` llega con datos (la
 * pantalla la pide bajo demanda, no bloquea el resto del Resumen).
 */
export function useWrappedCastHighlights(titles: TitleRef[]): {
  highlights: CastHighlights | null;
  loading: boolean;
  capped: boolean;
} {
  const [highlights, setHighlights] = useState<CastHighlights | null>(null);
  const [loading, setLoading] = useState(titles.length > 0);
  const cancelledRef = useRef(false);

  const capped = titles.length > MAX_TITLES;
  const key = titles.map((t) => `${t.mediaType}-${t.tmdbId}`).join(",");

  useEffect(() => {
    cancelledRef.current = false;

    async function run() {
      if (titles.length === 0) {
        setHighlights(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const sample = titles.slice(0, MAX_TITLES);
      const credits = await mapWithConcurrency(sample, CONCURRENCY, (t) =>
        fetchTitleCredits(t)
      );

      if (cancelledRef.current) return;

      setHighlights(topCastHighlights(credits));
      setLoading(false);
    }

    run();

    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { highlights, loading, capped };
}
