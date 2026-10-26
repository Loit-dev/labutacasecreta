"use client";

import { supabase } from "./client";
import type { Rating } from "@/lib/rating";

type WatchedKey = {
  userId: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
};

type SaveWatchedArgs = {
  userId: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  rating?: Rating;
  genres?: string[];
  posterUrl?: string;
  /** Fecha en la que se vio, en ISO. Por defecto, ahora mismo. */
  seenAt?: string;
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
  posterUrl,
  seenAt,
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
        seen_at: seenAt ?? new Date().toISOString(),
        poster_url: posterUrl ?? null,
      },
      { onConflict: "user_id,tmdb_id,media_type" }
    );
  } catch (error) {
    console.error("No se pudo guardar en Supabase (watched):", error);
  }
}

/**
 * Cambia solo la valoración de un "visto" ya guardado, sin tocar la
 * fecha en la que se vio (a diferencia de saveWatched, que la pone a
 * "ahora" cada vez). Para el diario de Mi cuenta: editar la nota de
 * una entrada ya antigua no debe moverla a hoy.
 */
export async function updateWatchedRating(
  { userId, tmdbId, mediaType }: WatchedKey,
  rating: Rating | undefined
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("watched")
      .update({ rating: rating ?? null })
      .eq("user_id", userId)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);

    return !error;
  } catch (error) {
    console.error("No se pudo actualizar la valoración:", error);

    return false;
  }
}

/** Borra una entrada del historial de "vistos" (el diario). */
export async function deleteWatched({
  userId,
  tmdbId,
  mediaType,
}: WatchedKey): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("watched")
      .delete()
      .eq("user_id", userId)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);

    return !error;
  } catch (error) {
    console.error("No se pudo borrar del historial:", error);

    return false;
  }
}
