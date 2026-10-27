"use client";

import { supabase } from "./client";
import { fetchProfilesByUserIds, type ProfileRow } from "./profiles";

export type FriendRequestRow = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

function mapRequest(row: {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}): FriendRequestRow {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("friend_requests")
      .insert({ requester_id: requesterId, addressee_id: addresseeId });

    return !error;
  } catch (error) {
    console.error("No se pudo pedir amistad:", error);

    return false;
  }
}

export async function respondFriendRequest(
  requestId: string,
  accept: boolean
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("friend_requests")
      .update({
        status: accept ? "accepted" : "rejected",
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    return !error;
  } catch (error) {
    console.error("No se pudo responder a la solicitud de amistad:", error);

    return false;
  }
}

/** Solicitudes de amistad pendientes que te han enviado a ti. */
export async function fetchIncomingFriendRequests(
  userId: string
): Promise<(FriendRequestRow & { requester: ProfileRow | null })[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("friend_requests")
      .select("id, requester_id, addressee_id, status, created_at")
      .eq("addressee_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    const requests = data.map(mapRequest);
    const profiles = await fetchProfilesByUserIds(
      requests.map((r) => r.requesterId)
    );
    const byId = new Map(profiles.map((p) => [p.userId, p]));

    return requests.map((r) => ({
      ...r,
      requester: byId.get(r.requesterId) ?? null,
    }));
  } catch (error) {
    console.error("No se pudieron leer las solicitudes de amistad:", error);

    return [];
  }
}

/** Amigos (solicitudes aceptadas en cualquiera de los dos sentidos). */
export async function fetchFriends(userId: string): Promise<ProfileRow[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("friend_requests")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error || !data) return [];

    const otherIds = data.map((row) =>
      row.requester_id === userId ? row.addressee_id : row.requester_id
    );

    return fetchProfilesByUserIds(otherIds);
  } catch (error) {
    console.error("No se pudieron leer los amigos:", error);

    return [];
  }
}

export type FriendStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "friends";

export async function fetchFriendStatus(
  userId: string,
  otherId: string
): Promise<{ status: FriendStatus; requestId: string | null }> {
  if (!supabase) return { status: "none", requestId: null };

  try {
    const { data, error } = await supabase
      .from("friend_requests")
      .select("id, requester_id, status")
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`
      )
      .maybeSingle();

    if (error || !data) return { status: "none", requestId: null };

    if (data.status === "accepted") {
      return { status: "friends", requestId: data.id };
    }

    if (data.status === "pending") {
      return {
        status: data.requester_id === userId ? "pending_sent" : "pending_received",
        requestId: data.id,
      };
    }

    return { status: "none", requestId: null };
  } catch (error) {
    console.error("No se pudo comprobar el estado de amistad:", error);

    return { status: "none", requestId: null };
  }
}
