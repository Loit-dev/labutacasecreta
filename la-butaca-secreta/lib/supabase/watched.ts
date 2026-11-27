"use client";

import { supabase } from "./client";
import type { Rating } from "@/lib/rating";

type WatchedKey = {
  userId: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
};

// Una crítica larga no debería poder reventar la fila ni la tarjeta:
// se corta por si acaso, tanto si se escribe al marcar "Ya la vi"
// (saveWatched) como si se edita luego desde el Diario
// (updateWatchedReview) — un textarea ya limita, esto es el cinturón.
const MAX_REVIEW_LENGTH = 2000;

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
  /** Media de TMDb (0-10) en este momento, para el logro "Nota media". */
  tmdbVoteAverage?: number;
  /**
   * Reseña escrita de una tacada al marcar "Ya la vi" (RatingPrompt),
   * en vez de tener que ir luego al Diario a escribirla aparte. Mismo
   * límite que updateWatchedReview (MAX_REVIEW_LENGTH, más abajo).
   */
  review?: string;
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
  tmdbVoteAverage,
  review,
}: SaveWatchedArgs) {
  if (!supabase) return;

  const trimmedReview = review?.trim().slice(0, MAX_REVIEW_LENGTH);

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
        tmdb_vote_average: tmdbVoteAverage ?? null,
        // Solo se manda si se ha escrito algo: así volver a abrir "Ya
        // la vi" para solo tocar la nota (el campo de reseña empieza
        // en blanco, no se precarga con lo que ya hubiera) nunca borra
        // sin querer una reseña ya guardada antes desde el Diario.
        ...(trimmedReview ? { review: trimmedReview } : {}),
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

/**
 * Cambia solo la fecha en la que se vio un título ya guardado (desde
 * el diario de Mi cuenta: tocar la fecha de una entrada para
 * corregirla). La lista se reordena cronológicamente a partir de la
 * nueva fecha, como con cualquier otra entrada.
 */
export async function updateWatchedSeenAt(
  { userId, tmdbId, mediaType }: WatchedKey,
  seenAt: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("watched")
      .update({ seen_at: seenAt })
      .eq("user_id", userId)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);

    return !error;
  } catch (error) {
    console.error("No se pudo actualizar la fecha:", error);

    return false;
  }
}

/**
 * Cambia solo la reseña escrita de un "visto" ya guardado (el Diario
 * del cinéfilo). `undefined`/cadena vacía la borra.
 */
export async function updateWatchedReview(
  { userId, tmdbId, mediaType }: WatchedKey,
  review: string | undefined
): Promise<boolean> {
  if (!supabase) return false;

  const trimmed = review?.trim().slice(0, MAX_REVIEW_LENGTH);

  try {
    const { error } = await supabase
      .from("watched")
      .update({ review: trimmed || null })
      .eq("user_id", userId)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);

    return !error;
  } catch (error) {
    console.error("No se pudo guardar la reseña:", error);

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
