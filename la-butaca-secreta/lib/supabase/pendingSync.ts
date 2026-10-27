"use client";

import { supabase } from "./client";

/**
 * Espejo en servidor de "Mi lista"/pendientes (lib/watchlist.ts), que
 * sigue viviendo principalmente en localStorage. Esta copia solo
 * existe para que quien te sigue pueda verla en tu perfil público —
 * ver docs/DECISIONS.md, decisión de sincronizar pendientes.
 */

export type PendingSyncItem = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterUrl: string | null;
  addedAt: string;
};

function mapItem(row: {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_url: string | null;
  added_at: string;
}): PendingSyncItem {
  return {
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    title: row.title,
    posterUrl: row.poster_url,
    addedAt: row.added_at,
  };
}

export async function syncPendingItem(
  userId: string,
  item: { tmdbId: number; mediaType: "movie" | "tv"; title: string; posterUrl: string | null }
): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.from("pending_sync").upsert(
      {
        user_id: userId,
        tmdb_id: item.tmdbId,
        media_type: item.mediaType,
        title: item.title,
        poster_url: item.posterUrl,
      },
      { onConflict: "user_id,tmdb_id,media_type" }
    );
  } catch (error) {
    console.error("No se pudo sincronizar un pendiente:", error);
  }
}

export async function removePendingSyncItem(
  userId: string,
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<void> {
  if (!supabase) return;

  try {
    await supabase
      .from("pending_sync")
      .delete()
      .eq("user_id", userId)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);
  } catch (error) {
    console.error("No se pudo quitar un pendiente sincronizado:", error);
  }
}

/** Pendientes de `userId` visibles para quien los consulta (RLS: dueño o seguidor). */
export async function fetchPendingSyncFor(
  userId: string
): Promise<PendingSyncItem[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("pending_sync")
      .select("tmdb_id, media_type, title, poster_url, added_at")
      .eq("user_id", userId)
      .order("added_at", { ascending: false })
      .limit(20);

    if (error || !data) return [];

    return data.map(mapItem);
  } catch (error) {
    console.error("No se pudieron leer los pendientes de alguien:", error);

    return [];
  }
}
