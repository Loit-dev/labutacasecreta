"use client";

import { supabase } from "./client";
import type { Rating } from "@/lib/rating";

type SaveWatchedArgs = {
  userId: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  rating?: Rating;
  genres?: string[];
};

/**
 * Guarda (o actualiza) la fila de "visto" del usuario en Supabase.
 * Silencioso ante errores: si falla, la valoración ya quedó guardada
 * en local (lib/rating.ts) y no queremos romper el flujo de "Ya la
 * vi" por un problema de red o de sesión caducada.
 */
export async function saveWatched({
  userId,
  tmdbId,
  mediaType,
  title,
  rating,
  genres,
}: SaveWatchedArgs) {
  if (!supabase) return;

  try {
    await supabase.from("watched").upsert(
      {
        user_id: userId,
        tmdb_id: tmdbId,
        media_type: mediaType,
        title,
        rating: rating ?? null,
        genres: genres ?? [],
        seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id,tmdb_id,media_type" }
    );
  } catch (error) {
    console.error("No se pudo guardar en Supabase (watched):", error);
  }
}
