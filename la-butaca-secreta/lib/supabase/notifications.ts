"use client";

import { supabase } from "./client";
import { fetchProfilesByUserIds, type ProfileRow } from "./profiles";
import { getNotificationsLastSeenAt } from "@/lib/notificationsSeen";

export type NotificationItem =
  | { kind: "friend_request"; id: string; createdAt: string; from: ProfileRow | null }
  | {
      kind: "list_invite";
      id: string;
      createdAt: string;
      listId: string;
      listName: string | null;
      from: ProfileRow | null;
    }
  | {
      kind: "recommendation";
      id: string;
      createdAt: string;
      tmdbId: number;
      mediaType: "movie" | "tv";
      title: string;
      posterUrl: string | null;
      message: string | null;
      from: ProfileRow | null;
    }
  | { kind: "new_follower"; createdAt: string; from: ProfileRow | null };

/** Todo lo pendiente, ya combinado y ordenado, para la pantalla de Notificaciones. */
export async function fetchNotifications(
  userId: string
): Promise<NotificationItem[]> {
  if (!supabase) return [];

  try {
    const [friendReqRes, listInviteRes, recRes, followerRes] = await Promise.all([
      supabase
        .from("friend_requests")
        .select("id, requester_id, created_at")
        .eq("addressee_id", userId)
        .eq("status", "pending"),
      supabase
        .from("list_invites")
        .select("id, list_id, invited_by, created_at, lists(name)")
        .eq("invited_user_id", userId)
        .eq("status", "pending"),
      supabase
        .from("recommendations")
        .select(
          "id, from_user_id, tmdb_id, media_type, title, poster_url, message, created_at"
        )
        .eq("to_user_id", userId)
        .is("dismissed_at", null),
      supabase
        .from("follows")
        .select("follower_id, created_at")
        .eq("followee_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const fromIds = new Set<string>();
    (friendReqRes.data ?? []).forEach((r) => fromIds.add(r.requester_id as string));
    (listInviteRes.data ?? []).forEach((r) => fromIds.add(r.invited_by as string));
    (recRes.data ?? []).forEach((r) => fromIds.add(r.from_user_id as string));
    (followerRes.data ?? []).forEach((r) => fromIds.add(r.follower_id as string));

    const profiles = await fetchProfilesByUserIds(Array.from(fromIds));
    const byId = new Map(profiles.map((p) => [p.userId, p]));

    const items: NotificationItem[] = [
      ...(friendReqRes.data ?? []).map((r) => ({
        kind: "friend_request" as const,
        id: r.id as string,
        createdAt: r.created_at as string,
        from: byId.get(r.requester_id as string) ?? null,
      })),
      ...(listInviteRes.data ?? []).map((r) => ({
        kind: "list_invite" as const,
        id: r.id as string,
        createdAt: r.created_at as string,
        listId: r.list_id as string,
        listName: (r.lists as { name: string }[] | null)?.[0]?.name ?? null,
        from: byId.get(r.invited_by as string) ?? null,
      })),
      ...(recRes.data ?? []).map((r) => ({
        kind: "recommendation" as const,
        id: r.id as string,
        createdAt: r.created_at as string,
        tmdbId: r.tmdb_id as number,
        mediaType: r.media_type as "movie" | "tv",
        title: r.title as string,
        posterUrl: (r.poster_url as string | null) ?? null,
        message: (r.message as string | null) ?? null,
        from: byId.get(r.from_user_id as string) ?? null,
      })),
      ...(followerRes.data ?? []).map((r) => ({
        kind: "new_follower" as const,
        createdAt: r.created_at as string,
        from: byId.get(r.follower_id as string) ?? null,
      })),
    ];

    return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch (error) {
    console.error("No se pudieron leer las notificaciones:", error);

    return [];
  }
}

/**
 * Número para la bolita del icono: solicitudes de amistad +
 * invitaciones a listas + recomendaciones (siempre cuentan, se
 * "consumen" al responder/descartar) + seguidores nuevos desde la
 * última vez que se abrió la pantalla de notificaciones.
 */
export function countBadge(items: NotificationItem[]): number {
  const lastSeen = getNotificationsLastSeenAt();

  return items.filter((item) => {
    if (item.kind === "new_follower") {
      return new Date(item.createdAt).getTime() > lastSeen;
    }

    return true;
  }).length;
}
