"use client";

import { supabase } from "./client";

export async function isFollowing(
  followerId: string,
  followeeId: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data, error } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", followerId)
      .eq("followee_id", followeeId)
      .maybeSingle();

    return !error && !!data;
  } catch (error) {
    console.error("No se pudo comprobar si sigues a alguien:", error);

    return false;
  }
}

export async function follow(
  followerId: string,
  followeeId: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("follows")
      .upsert(
        { follower_id: followerId, followee_id: followeeId },
        { onConflict: "follower_id,followee_id" }
      );

    return !error;
  } catch (error) {
    console.error("No se pudo seguir a esa persona:", error);

    return false;
  }
}

export async function unfollow(
  followerId: string,
  followeeId: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("followee_id", followeeId);

    return !error;
  } catch (error) {
    console.error("No se pudo dejar de seguir:", error);

    return false;
  }
}

/** Ids de las cuentas a las que sigue `userId` (RLS: solo lo propio). */
export async function fetchFollowingIds(userId: string): Promise<string[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("follows")
      .select("followee_id")
      .eq("follower_id", userId);

    if (error || !data) return [];

    return data.map((row) => row.followee_id as string);
  } catch (error) {
    console.error("No se pudo leer a quién sigues:", error);

    return [];
  }
}

/** Ids de quienes siguen a `userId` (RLS: solo lo propio). */
export async function fetchFollowerIds(userId: string): Promise<string[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("followee_id", userId);

    if (error || !data) return [];

    return data.map((row) => row.follower_id as string);
  } catch (error) {
    console.error("No se pudo leer quién te sigue:", error);

    return [];
  }
}
