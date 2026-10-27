"use client";

import { supabase } from "./client";
import { fetchFollowingIds } from "./follows";
import { fetchProfilesByUserIds, type ProfileRow } from "./profiles";

export type FeedItem =
  | {
      kind: "watched";
      userId: string;
      createdAt: string;
      title: string;
      rating: number | null;
      posterUrl: string | null;
    }
  | {
      kind: "list_created";
      userId: string;
      createdAt: string;
      listId: string;
      listName: string;
    };

const FEED_LIMIT = 30;

/**
 * Feed de "Novedades": solo actividad de gente a la que sigues, y
 * solo lo que las políticas de RLS ya dejan ver (diario, y listas
 * públicas creadas por ellos). No añade ninguna regla de visibilidad
 * nueva: hereda watched/lists tal cual.
 */
export async function fetchFeed(userId: string): Promise<{
  items: FeedItem[];
  profiles: Map<string, ProfileRow>;
}> {
  if (!supabase) return { items: [], profiles: new Map() };

  const followingIds = await fetchFollowingIds(userId);

  if (followingIds.length === 0) {
    return { items: [], profiles: new Map() };
  }

  try {
    const [watchedRes, listsRes] = await Promise.all([
      supabase
        .from("watched")
        .select("user_id, title, rating, poster_url, seen_at")
        .in("user_id", followingIds)
        .order("seen_at", { ascending: false })
        .limit(FEED_LIMIT),
      supabase
        .from("lists")
        .select("id, user_id, name, created_at, is_public")
        .in("user_id", followingIds)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(FEED_LIMIT),
    ]);

    const watchedItems: FeedItem[] = (watchedRes.data ?? []).map((row) => ({
      kind: "watched" as const,
      userId: row.user_id as string,
      createdAt: row.seen_at as string,
      title: row.title as string,
      rating: (row.rating as number | null) ?? null,
      posterUrl: (row.poster_url as string | null) ?? null,
    }));

    const listItems: FeedItem[] = (listsRes.data ?? []).map((row) => ({
      kind: "list_created" as const,
      userId: row.user_id as string,
      createdAt: row.created_at as string,
      listId: row.id as string,
      listName: row.name as string,
    }));

    const items = [...watchedItems, ...listItems]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, FEED_LIMIT);

    const profiles = await fetchProfilesByUserIds(
      Array.from(new Set(items.map((i) => i.userId)))
    );

    return { items, profiles: new Map(profiles.map((p) => [p.userId, p])) };
  } catch (error) {
    console.error("No se pudo construir el feed de amigos:", error);

    return { items: [], profiles: new Map() };
  }
}
