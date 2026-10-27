"use client";

import { supabase } from "./client";
import { fetchProfilesByUserIds, type ProfileRow } from "./profiles";

export type ListInviteRow = {
  id: string;
  listId: string;
  invitedUserId: string;
  invitedBy: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

function mapInvite(row: {
  id: string;
  list_id: string;
  invited_user_id: string;
  invited_by: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}): ListInviteRow {
  return {
    id: row.id,
    listId: row.list_id,
    invitedUserId: row.invited_user_id,
    invitedBy: row.invited_by,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function setListPublic(
  listId: string,
  isPublic: boolean
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("lists")
      .update({ is_public: isPublic })
      .eq("id", listId);

    return !error;
  } catch (error) {
    console.error("No se pudo cambiar la visibilidad de la lista:", error);

    return false;
  }
}

export async function inviteCollaborator(
  listId: string,
  invitedUserId: string,
  invitedBy: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("list_invites")
      .insert({ list_id: listId, invited_user_id: invitedUserId, invited_by: invitedBy });

    return !error;
  } catch (error) {
    console.error("No se pudo invitar a colaborar en la lista:", error);

    return false;
  }
}

export async function respondListInvite(
  inviteId: string,
  accept: boolean
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("list_invites")
      .update({
        status: accept ? "accepted" : "rejected",
        responded_at: new Date().toISOString(),
      })
      .eq("id", inviteId);

    return !error;
  } catch (error) {
    console.error("No se pudo responder a la invitación de lista:", error);

    return false;
  }
}

/** Echar a un colaborador (o retirar una invitación aún pendiente). */
export async function removeListInvite(inviteId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("list_invites")
      .delete()
      .eq("id", inviteId);

    return !error;
  } catch (error) {
    console.error("No se pudo quitar a la persona de la lista:", error);

    return false;
  }
}

/** Colaboradores activos de una lista, con su perfil. */
export async function fetchCollaborators(
  listId: string
): Promise<(ListInviteRow & { profile: ProfileRow | null })[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("list_invites")
      .select("id, list_id, invited_user_id, invited_by, status, created_at")
      .eq("list_id", listId)
      .eq("status", "accepted");

    if (error || !data) return [];

    const invites = data.map(mapInvite);
    const profiles = await fetchProfilesByUserIds(
      invites.map((i) => i.invitedUserId)
    );
    const byId = new Map(profiles.map((p) => [p.userId, p]));

    return invites.map((i) => ({ ...i, profile: byId.get(i.invitedUserId) ?? null }));
  } catch (error) {
    console.error("No se pudieron leer los colaboradores:", error);

    return [];
  }
}

/** Invitaciones a listas pendientes para `userId`, con nombre de la lista. */
export async function fetchPendingListInvites(
  userId: string
): Promise<(ListInviteRow & { listName: string | null; inviter: ProfileRow | null })[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("list_invites")
      .select(
        "id, list_id, invited_user_id, invited_by, status, created_at, lists(name)"
      )
      .eq("invited_user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    const invites = data.map((row) => ({
      ...mapInvite(row),
      listName: (row.lists as { name: string }[] | null)?.[0]?.name ?? null,
    }));
    const profiles = await fetchProfilesByUserIds(
      invites.map((i) => i.invitedBy)
    );
    const byId = new Map(profiles.map((p) => [p.userId, p]));

    return invites.map((i) => ({ ...i, inviter: byId.get(i.invitedBy) ?? null }));
  } catch (error) {
    console.error("No se pudieron leer las invitaciones a listas:", error);

    return [];
  }
}
