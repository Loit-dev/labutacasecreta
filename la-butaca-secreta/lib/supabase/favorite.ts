"use client";

import { supabase } from "./client";

export type FavoriteRow = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
};

/** Favorita elegida a mano para "Mi Resumen" (supabase/favorite.sql). */
export async function fetchFavorite(
  userId: string
): Promise<FavoriteRow | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("favorite")
      .select("tmdb_id, media_type, title")
      .eq("user_id", userId)
      .maybeSingle<{
        tmdb_id: number;
        media_type: "movie" | "tv";
        title: string;
      }>();

    if (error || !data) return null;

    return {
      tmdbId: data.tmdb_id,
      mediaType: data.media_type,
      title: data.title,
    };
  } catch (error) {
    console.error("No se pudo leer la favorita:", error);

    return null;
  }
}

type SaveFavoriteArgs = {
  userId: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
};

export async function saveFavorite({
  userId,
  tmdbId,
  mediaType,
  title,
}: SaveFavoriteArgs): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("favorite").upsert(
      {
        user_id: userId,
        tmdb_id: tmdbId,
        media_type: mediaType,
        title,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    return !error;
  } catch (error) {
    console.error("No se pudo guardar la favorita:", error);

    return false;
  }
}
