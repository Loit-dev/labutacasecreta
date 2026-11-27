"use client";

import { supabase } from "./client";

/**
 * Datos de la pestaña "Listas" de la portada (supabase/listas_populares.sql).
 * Si las funciones aún no existen en Supabase, todo devuelve vacío y la
 * pestaña muestra solo El Canon, sin romper nada.
 */

export type PopularList = {
  id: string;
  name: string;
  username: string | null;
  itemsCount: number;
  likesRecent: number;
  likesTotal: number;
  likedByMe: boolean;
  posters: string[];
};

export type TopTitle = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterUrl: string | null;
  avgRating: number;
  votes: number;
};

export type PublicListItem = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterUrl: string | null;
};

export async function fetchPopularLists(days = 7): Promise<PopularList[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.rpc("popular_lists", {
      p_days: days,
      p_limit: 20,
    });

    if (error || !Array.isArray(data)) return [];

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      username: row.username ?? null,
      itemsCount: Number(row.items_count) || 0,
      likesRecent: Number(row.likes_recent) || 0,
      likesTotal: Number(row.likes_total) || 0,
      likedByMe: Boolean(row.liked_by_me),
      posters: (row.posters ?? []) as string[],
    }));
  } catch {
    return [];
  }
}

export async function fetchTopTitles(minVotes = 3): Promise<TopTitle[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.rpc("top_rated_titles", {
      p_min_votes: minVotes,
      p_limit: 100,
    });

    if (error || !Array.isArray(data)) return [];

    return data.map((row) => ({
      tmdbId: Number(row.tmdb_id),
      mediaType: row.media_type === "tv" ? "tv" : "movie",
      title: row.title,
      posterUrl: row.poster_url ?? null,
      avgRating: Number(row.avg_rating) || 0,
      votes: Number(row.votes) || 0,
    }));
  } catch {
    return [];
  }
}

export async function fetchPublicListItems(
  listId: string
): Promise<PublicListItem[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("list_items")
      .select("tmdb_id, media_type, title, poster_url, added_at")
      .eq("list_id", listId)
      .order("added_at", { ascending: true });

    if (error || !data) return [];

    return data.map((row) => ({
      tmdbId: Number(row.tmdb_id),
      mediaType: row.media_type === "tv" ? "tv" : "movie",
      title: row.title,
      posterUrl: row.poster_url,
    }));
  } catch {
    return [];
  }
}

export async function setListLike(
  userId: string,
  listId: string,
  liked: boolean
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = liked
      ? await supabase
          .from("list_likes")
          .upsert(
            { user_id: userId, list_id: listId },
            { onConflict: "user_id,list_id", ignoreDuplicates: true }
          )
      : await supabase
          .from("list_likes")
          .delete()
          .eq("user_id", userId)
          .eq("list_id", listId);

    return !error;
  } catch {
    return false;
  }
}

// ─── Comentarios de una lista (list_comments) ───────────────────────
// listKey: id de la lista pública, o "canon" / "top" para las oficiales.

export type ListComment = {
  id: string;
  body: string;
  createdAt: string;
  username: string | null;
  isMine: boolean;
  canDelete: boolean;
};

export async function fetchListComments(
  listKey: string
): Promise<ListComment[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc("list_comments_for", {
      p_list_key: listKey,
    });

    // null = la función aún no existe en Supabase (SQL sin ejecutar).
    if (error || !Array.isArray(data)) return null;

    return data.map((row) => ({
      id: row.id,
      body: row.body,
      createdAt: row.created_at,
      username: row.username ?? null,
      isMine: Boolean(row.is_mine),
      canDelete: Boolean(row.can_delete),
    }));
  } catch {
    return null;
  }
}

export async function addListComment(
  userId: string,
  listKey: string,
  body: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("list_comments")
      .insert({ user_id: userId, list_key: listKey, body });

    return !error;
  } catch {
    return false;
  }
}

export async function deleteListComment(commentId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("list_comments")
      .delete()
      .eq("id", commentId);

    return !error;
  } catch {
    return false;
  }
}

// ─── "Me gusta" en las listas oficiales (official_list_likes) ───────

export type OfficialKey = "canon" | "top";

export async function fetchOfficialLikes(): Promise<
  Record<string, { count: number; liked: boolean }>
> {
  if (!supabase) return {};

  try {
    const { data, error } = await supabase.rpc("official_list_likes_summary");

    if (error || !Array.isArray(data)) return {};

    return Object.fromEntries(
      data.map((row) => [
        row.list_key as string,
        { count: Number(row.likes_total) || 0, liked: Boolean(row.liked_by_me) },
      ])
    );
  } catch {
    return {};
  }
}

export async function setOfficialLike(
  userId: string,
  key: OfficialKey,
  liked: boolean
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = liked
      ? await supabase
          .from("official_list_likes")
          .upsert(
            { user_id: userId, list_key: key },
            { onConflict: "user_id,list_key", ignoreDuplicates: true }
          )
      : await supabase
          .from("official_list_likes")
          .delete()
          .eq("user_id", userId)
          .eq("list_key", key);

    return !error;
  } catch {
    return false;
  }
}
