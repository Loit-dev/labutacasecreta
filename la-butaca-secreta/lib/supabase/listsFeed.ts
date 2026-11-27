"use client";

import { supabase } from "./client";

/**
 * Lo que la pestaña Listas y /lista/[id] piden desde el navegador con
 * la sesión de la persona: sus "me gusta" y los comentarios. Lo común a
 * todo el mundo (listas populares, Top) viene cacheado de /api/listas.
 * Si las funciones aún no existen en Supabase, todo devuelve vacío sin
 * romper nada.
 */

/** Ids de las listas a las que la persona ha dado "me gusta". */
export async function fetchMyLikedListIds(userId: string): Promise<Set<string>> {
  if (!supabase) return new Set();

  try {
    const { data, error } = await supabase
      .from("list_likes")
      .select("list_id")
      .eq("user_id", userId);

    if (error || !data) return new Set();

    return new Set(data.map((row) => row.list_id as string));
  } catch {
    return new Set();
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
