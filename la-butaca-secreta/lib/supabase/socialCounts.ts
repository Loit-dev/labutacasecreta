"use client";

import { supabase } from "./client";

export type SocialCounts = {
  following: number;
  followers: number;
  friends: number;
};

const EMPTY: SocialCounts = { following: 0, followers: 0, friends: 0 };

/**
 * Recuento de Siguiendo/Seguidores/Amigos de CUALQUIER cuenta (no
 * solo la propia), para el perfil público. Usa social_counts()
 * (security definer, supabase/social.sql): nunca trae las filas en
 * sí, solo los tres números — las políticas RLS de follows/
 * friend_requests no dejarían leer las filas de otra cuenta.
 */
export async function fetchSocialCounts(userId: string): Promise<SocialCounts> {
  if (!supabase) return EMPTY;

  try {
    const { data, error } = await supabase
      .rpc("social_counts", { p_user_id: userId })
      .single();

    if (error || !data) return EMPTY;

    const row = data as {
      following_count: number;
      followers_count: number;
      friends_count: number;
    };

    return {
      following: row.following_count,
      followers: row.followers_count,
      friends: row.friends_count,
    };
  } catch (error) {
    console.error("No se pudo leer el recuento de Amigos:", error);

    return EMPTY;
  }
}
