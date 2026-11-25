"use client";

import { supabase } from "./client";

export type TitleRef = { tmdbId: number; mediaType: "movie" | "tv" };

function key(ref: TitleRef): string {
  return `${ref.mediaType}-${ref.tmdbId}`;
}

/**
 * Cuánta gente de la app ha visto cada uno de `titles` dentro de
 * `year` — llama a la función `title_watch_counts` (supabase/resumen.sql,
 * security definer: cuenta usuarios distintos, nunca dice quién). Para
 * "Trendy y joya oculta" del Resumen Anual (lib/wrappedExtras.ts).
 */
export async function fetchTitleWatchCounts(
  titles: TitleRef[],
  year: number
): Promise<Map<string, number>> {
  if (!supabase || titles.length === 0) return new Map();

  try {
    const { data, error } = await supabase.rpc("title_watch_counts", {
      p_tmdb_ids: titles.map((t) => t.tmdbId),
      p_media_types: titles.map((t) => t.mediaType),
      p_year: year,
    });

    if (error || !data) return new Map();

    return new Map(
      data.map((row: { tmdb_id: number; media_type: string; watcher_count: number }) => [
        key({ tmdbId: row.tmdb_id, mediaType: row.media_type as "movie" | "tv" }),
        row.watcher_count,
      ])
    );
  } catch (error) {
    console.error("No se pudo leer cuánta gente ha visto estos títulos:", error);

    return new Map();
  }
}

export { key as titleRefKey };
