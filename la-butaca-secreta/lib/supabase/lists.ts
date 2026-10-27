"use client";

import { supabase } from "./client";

export type ListItemRow = {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterUrl: string | null;
  addedAt: string;
};

export type ListRow = {
  id: string;
  name: string;
  createdAt: string;
  items: ListItemRow[];
  isPublic: boolean;
};

function mapItem(row: {
  id: string;
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_url: string | null;
  added_at: string;
}): ListItemRow {
  return {
    id: row.id,
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    title: row.title,
    posterUrl: row.poster_url,
    addedAt: row.added_at,
  };
}

/** Todas las listas del usuario, con sus títulos (supabase/lists.sql). */
export async function fetchLists(userId: string): Promise<ListRow[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("lists")
      .select(
        "id, name, created_at, is_public, list_items(id, tmdb_id, media_type, title, poster_url, added_at)"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      isPublic: Boolean((row as { is_public?: boolean }).is_public),
      items: (row.list_items ?? []).map(mapItem),
    }));
  } catch (error) {
    console.error("No se pudieron leer las listas:", error);

    return [];
  }
}

export async function createList(
  userId: string,
  name: string
): Promise<ListRow | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("lists")
      .insert({ user_id: userId, name })
      .select("id, name, created_at")
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      isPublic: false,
      items: [],
    };
  } catch (error) {
    console.error("No se pudo crear la lista:", error);

    return null;
  }
}

export async function renameList(
  listId: string,
  name: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("lists")
      .update({ name })
      .eq("id", listId);

    return !error;
  } catch (error) {
    console.error("No se pudo renombrar la lista:", error);

    return false;
  }
}

export async function deleteList(listId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("lists").delete().eq("id", listId);

    return !error;
  } catch (error) {
    console.error("No se pudo borrar la lista:", error);

    return false;
  }
}

type AddListItemArgs = {
  listId: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterUrl: string | null;
};

/** Añade un título a una lista (no repite si ya estaba). */
export async function addListItem({
  listId,
  tmdbId,
  mediaType,
  title,
  posterUrl,
}: AddListItemArgs): Promise<ListItemRow | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("list_items")
      .upsert(
        {
          list_id: listId,
          tmdb_id: tmdbId,
          media_type: mediaType,
          title,
          poster_url: posterUrl,
        },
        { onConflict: "list_id,tmdb_id,media_type" }
      )
      .select("id, tmdb_id, media_type, title, poster_url, added_at")
      .single();

    if (error || !data) return null;

    return mapItem(data);
  } catch (error) {
    console.error("No se pudo añadir el título a la lista:", error);

    return null;
  }
}

export async function removeListItem(itemId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("list_items")
      .delete()
      .eq("id", itemId);

    return !error;
  } catch (error) {
    console.error("No se pudo quitar el título de la lista:", error);

    return false;
  }
}
