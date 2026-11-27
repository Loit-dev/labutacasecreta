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
  | { kind: "new_follower"; createdAt: string; from: ProfileRow | null }
  | {
      kind: "list_like";
      createdAt: string;
      listId: string;
      listName: string;
      from: ProfileRow | null;
    }
  | {
      kind: "list_comment";
      id: string;
      createdAt: string;
      listId: string;
      listName: string;
      body: string;
      from: ProfileRow | null;
    };

/** Todo lo pendiente, ya combinado y ordenado, para la pantalla de Notificaciones. */
export async function fetchNotifications(
  userId: string
): Promise<NotificationItem[]> {
  if (!supabase) return [];

  try {
    const [friendReqRes, listInviteRes, recRes, followerRes, listLikesRes, listCommentsRes] = await Promise.all([
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
      // "Me gusta" en mis listas (supabase/notificaciones_likes.sql). Si
      // la función aún no existe, devuelve error y simplemente no hay.
      supabase.rpc("my_list_likes", { p_limit: 30 }),
      // Comentarios en mis listas (supabase/notificaciones_comentarios.sql).
      supabase.rpc("my_list_comments", { p_limit: 30 }),
    ]);

    const listComments = Array.isArray(listCommentsRes.data)
      ? (listCommentsRes.data as {
          comment_id: string;
          list_id: string;
          list_name: string;
          author_id: string;
          username: string | null;
          display_name: string | null;
          body: string;
          created_at: string;
        }[])
      : [];

    const listLikes = Array.isArray(listLikesRes.data)
      ? (listLikesRes.data as {
          list_id: string;
          list_name: string;
          liker_id: string;
          username: string | null;
          display_name: string | null;
          created_at: string;
        }[])
      : [];

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
      // Si quien te siguió no llegó a crear su @usuario, follows
      // existe pero no hay profiles — no hay nada que mostrar
      // ("Alguien te sigue ahora" no aporta nada), así que se omite.
      ...(followerRes.data ?? [])
        .filter((r) => byId.has(r.follower_id as string))
        .map((r) => ({
          kind: "new_follower" as const,
          createdAt: r.created_at as string,
          from: byId.get(r.follower_id as string) ?? null,
        })),
      ...listLikes.map((r) => ({
        kind: "list_like" as const,
        createdAt: r.created_at,
        listId: r.list_id,
        listName: r.list_name,
        from: r.username
          ? { userId: r.liker_id, username: r.username, displayName: r.display_name }
          : null,
      })),
      ...listComments.map((r) => ({
        kind: "list_comment" as const,
        id: r.comment_id,
        createdAt: r.created_at,
        listId: r.list_id,
        listName: r.list_name,
        body: r.body,
        from: r.username
          ? { userId: r.author_id, username: r.username, displayName: r.display_name }
          : null,
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
 * "consumen" al responder/descartar) + seguidores nuevos, "me gusta"
 * y comentarios en tus listas desde la última vez que se abrió la pantalla de
 * notificaciones.
 */
export function countBadge(
  items: NotificationItem[],
  lastSeen: number = getNotificationsLastSeenAt()
): number {
  return items.filter((item) => {
    if (
      item.kind === "new_follower" ||
      item.kind === "list_like" ||
      item.kind === "list_comment"
    ) {
      return new Date(item.createdAt).getTime() > lastSeen;
    }

    return true;
  }).length;
}

// ─── "Visto" guardado en la cuenta (supabase/listas_v2.sql) ─────────
// Antes solo se guardaba en cada dispositivo (lib/notificationsSeen.ts),
// así que lo visto en el móvil seguía saliendo como nuevo en el
// ordenador. Ahora se guarda también en la cuenta y se usa lo más
// reciente de las dos marcas.

/** Última vez que la cuenta abrió Notificaciones (ms), o 0. */
export async function fetchServerLastSeen(): Promise<number> {
  if (!supabase) return 0;

  try {
    const { data, error } = await supabase.rpc("my_notifications_last_seen");

    if (error || !data) return 0;

    const time = new Date(data as string).getTime();

    return Number.isFinite(time) ? time : 0;
  } catch {
    return 0;
  }
}

/** Marca las notificaciones como vistas en la cuenta. */
export async function markNotificationsSeenOnServer(): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.rpc("mark_notifications_seen");
  } catch {
    // Si falla, queda la marca del dispositivo; no pasa nada.
  }
}

/** Marca más reciente entre la del dispositivo y la de la cuenta. */
export async function lastSeenAt(): Promise<number> {
  const server = await fetchServerLastSeen();

  return Math.max(getNotificationsLastSeenAt(), server);
}

/**
 * Número de la bolita en una sola consulta (my_notification_badge).
 * null si la función aún no existe: entonces se calcula como antes,
 * leyendo todas las notificaciones.
 */
export async function fetchBadgeCount(): Promise<number | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc("my_notification_badge");

    if (error || typeof data !== "number") return null;

    return data;
  } catch {
    return null;
  }
}
