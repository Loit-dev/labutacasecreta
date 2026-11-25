"use client";

import { useEffect, useRef, useState } from "react";

import { fetchTitleWatchCounts, titleRefKey } from "@/lib/supabase/wrapped";
import type { WatchedRow } from "@/lib/supabase/summary";
import {
  pickTrendyAndHiddenGem,
  type TrendyHighlights,
} from "@/lib/wrappedExtras";

/**
 * "Trendy y joya oculta" (lib/wrappedExtras.ts): pide cuánta gente de
 * la app vio cada título del año (title_watch_counts, una sola
 * llamada RPC) y agrega el más visto por el resto y, entre los que
 * valoraste alto, el que menos vio nadie más. Perezoso: solo se
 * dispara al llegar a esta pantalla.
 */
export function useWrappedTrendy(
  year: number,
  yearRows: WatchedRow[]
): {
  highlights: TrendyHighlights | null;
  loading: boolean;
} {
  const [highlights, setHighlights] = useState<TrendyHighlights | null>(null);
  const [loading, setLoading] = useState(yearRows.length > 0);
  const cancelledRef = useRef(false);

  const key = yearRows.map((r) => `${r.mediaType}-${r.tmdbId}`).join(",");

  useEffect(() => {
    cancelledRef.current = false;

    async function run() {
      if (yearRows.length === 0) {
        setHighlights(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const counts = await fetchTitleWatchCounts(
        yearRows.map((r) => ({ tmdbId: r.tmdbId, mediaType: r.mediaType })),
        year
      );

      if (cancelledRef.current) return;

      const rows = yearRows.map((row) => ({
        tmdbId: row.tmdbId,
        mediaType: row.mediaType,
        title: row.title,
        posterUrl: row.posterUrl,
        rating: row.rating,
        watcherCount: counts.get(titleRefKey(row)) ?? 1,
      }));

      setHighlights(pickTrendyAndHiddenGem(rows));
      setLoading(false);
    }

    run();

    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, year]);

  return { highlights, loading };
}
