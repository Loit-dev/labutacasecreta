"use client";

import { supabase } from "./client";
import { fetchProfilesByUserIds, type ProfileRow } from "./profiles";

export type RecommendationRow = {
  id: string;
  fromUserId: string;
  toUserId: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterUrl: string | null;
  message: string | null;
  createdAt: string;
};

function mapRecommendation(row: {
  id: string;
  from_user_id: string;
  to_user_id: string;
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_url: string | null;
  message: string | null;
  created_at: string;
}): RecommendationRow {
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    title: row.title,
    posterUrl: row.poster_url,
    message: row.message,
    createdAt: row.created_at,
  };
}

type SendRecommendationArgs = {
  fromUserId: string;
  toUserId: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterUrl: string | null;
  message?: string;
};

export async function sendRecommendation(
  args: SendRecommendationArgs
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("recommendations").insert({
      from_user_id: args.fromUserId,
      to_user_id: args.toUserId,
      tmdb_id: args.tmdbId,
      media_type: args.mediaType,
      title: args.title,
      poster_url: args.posterUrl,
      message: args.message ?? null,
    });

    return !error;
  } catch (error) {
    console.error("No se pudo enviar la recomendación:", error);

    return false;
  }
}

/** Recomendaciones recibidas y aún no descartadas, con quién la envió. */
export async function fetchIncomingRecommendations(
  userId: string
): Promise<(RecommendationRow & { from: ProfileRow | null })[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("recommendations")
      .select(
        "id, from_user_id, to_user_id, tmdb_id, media_type, title, poster_url, message, created_at"
      )
      .eq("to_user_id", userId)
      .is("dismissed_at", null)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    const recs = data.map(mapRecommendation);
    const profiles = await fetchProfilesByUserIds(
      recs.map((r) => r.fromUserId)
    );
    const byId = new Map(profiles.map((p) => [p.userId, p]));

    return recs.map((r) => ({ ...r, from: byId.get(r.fromUserId) ?? null }));
  } catch (error) {
    console.error("No se pudieron leer las recomendaciones:", error);

    return [];
  }
}

export async function dismissRecommendation(id: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("recommendations")
      .update({ dismissed_at: new Date().toISOString() })
      .eq("id", id);

    return !error;
  } catch (error) {
    console.error("No se pudo descartar la recomendación:", error);

    return false;
  }
}
