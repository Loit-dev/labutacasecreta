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
    }
  | {
      kind: "list_item_added";
      userId: string;
      createdAt: string;
      listId: string;
      listName: string;
      title: string;
      posterUrl: string | null;
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

    const listRows = listsRes.data ?? [];

    const listItems: FeedItem[] = listRows.map((row) => ({
      kind: "list_created" as const,
      userId: row.user_id as string,
      createdAt: row.created_at as string,
      listId: row.id as string,
      listName: row.name as string,
    }));

    // Títulos añadidos a esas mismas listas públicas (no solo su
    // creación), para que "Novedades" también cuente "X añadió Y a
    // la lista Z" — RLS ya deja leer list_items de una lista pública.
    const listMeta = new Map(
      listRows.map((row) => [
        row.id as string,
        { userId: row.user_id as string, name: row.name as string },
      ])
    );
    const listIds = listRows.map((row) => row.id as string);

    const listItemsRes =
      listIds.length > 0
        ? await supabase
            .from("list_items")
            .select("list_id, title, poster_url, added_at")
            .in("list_id", listIds)
            .order("added_at", { ascending: false })
            .limit(FEED_LIMIT)
        : { data: [] as never[] };

    const addedItems: FeedItem[] = (listItemsRes.data ?? []).flatMap((row) => {
      const meta = listMeta.get(row.list_id as string);

      if (!meta) return [];

      return [
        {
          kind: "list_item_added" as const,
          userId: meta.userId,
          createdAt: row.added_at as string,
          listId: row.list_id as string,
          listName: meta.name,
          title: row.title as string,
          posterUrl: (row.poster_url as string | null) ?? null,
        },
      ];
    });

    const items = [...watchedItems, ...listItems, ...addedItems]
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

export type FeedGroup = {
  userId: string;
  items: FeedItem[]; // más reciente primero
};

function groupKey(item: FeedItem): string {
  // Las listas se agrupan también por lista: "añadió X a Disney y
  // 4+" no debería mezclar títulos añadidos a dos listas distintas
  // en la misma línea.
  return item.kind === "list_item_added"
    ? `${item.userId}:list_item_added:${item.listId}`
    : `${item.userId}:${item.kind}`;
}

/**
 * Agrupa ráfagas consecutivas de la misma persona haciendo lo mismo
 * (varias vistas seguidas, varios títulos añadidos a la misma lista)
 * en una sola línea: "loit vio Aida y 4+" en vez de 5 líneas sueltas.
 * Solo agrupa items ADYACENTES tras ordenar por fecha, para no
 * mezclar una racha de hace una semana con una de hoy.
 */
export function groupFeedItems(items: FeedItem[]): FeedGroup[] {
  const groups: FeedGroup[] = [];

  for (const item of items) {
    const last = groups[groups.length - 1];

    if (last && groupKey(last.items[0]) === groupKey(item)) {
      last.items.push(item);
    } else {
      groups.push({ userId: item.userId, items: [item] });
    }
  }

  return groups;
}
