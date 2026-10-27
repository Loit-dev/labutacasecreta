"use client";

import { supabase } from "./client";

export type InviteCodeRow = {
  code: string;
  createdBy: string;
  kind: "follow" | "list_invite";
  listId: string | null;
  usedBy: string | null;
};

function mapCode(row: {
  code: string;
  created_by: string;
  kind: "follow" | "list_invite";
  list_id: string | null;
  used_by: string | null;
}): InviteCodeRow {
  return {
    code: row.code,
    createdBy: row.created_by,
    kind: row.kind,
    listId: row.list_id,
    usedBy: row.used_by,
  };
}

/** Crea (o reutiliza) un código para compartir el perfil propio. */
export async function createFollowInviteCode(
  userId: string
): Promise<string | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("invite_codes")
      .insert({ created_by: userId, kind: "follow" })
      .select("code")
      .single();

    if (error || !data) return null;

    return data.code as string;
  } catch (error) {
    console.error("No se pudo crear el enlace de invitación:", error);

    return null;
  }
}

export async function createListInviteCode(
  userId: string,
  listId: string
): Promise<string | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("invite_codes")
      .insert({ created_by: userId, kind: "list_invite", list_id: listId })
      .select("code")
      .single();

    if (error || !data) return null;

    return data.code as string;
  } catch (error) {
    console.error("No se pudo crear el enlace de invitación a la lista:", error);

    return null;
  }
}

/**
 * Resuelve un código justo después de iniciar sesión: sigue a quien
 * lo creó, o acepta la invitación a la lista, y marca el código como
 * usado (no se puede volver a canjear). Solo funciona con sesión
 * iniciada (RLS exige auth.uid() is not null para leerlo).
 */
export async function resolveInviteCode(
  code: string,
  currentUserId: string
): Promise<{ ok: boolean; kind: "follow" | "list_invite" | null }> {
  if (!supabase) return { ok: false, kind: null };

  try {
    const { data, error } = await supabase
      .from("invite_codes")
      .select("code, created_by, kind, list_id, used_by")
      .eq("code", code)
      .maybeSingle();

    if (error || !data) return { ok: false, kind: null };

    const invite = mapCode(data);

    if (invite.usedBy || invite.createdBy === currentUserId) {
      return { ok: false, kind: invite.kind };
    }

    if (invite.kind === "follow") {
      await supabase
        .from("follows")
        .upsert(
          { follower_id: currentUserId, followee_id: invite.createdBy },
          { onConflict: "follower_id,followee_id" }
        );
    } else if (invite.kind === "list_invite" && invite.listId) {
      await supabase.from("list_invites").upsert(
        {
          list_id: invite.listId,
          invited_user_id: currentUserId,
          invited_by: invite.createdBy,
          status: "accepted",
          responded_at: new Date().toISOString(),
        },
        { onConflict: "list_id,invited_user_id" }
      );
    }

    await supabase
      .from("invite_codes")
      .update({ used_by: currentUserId, used_at: new Date().toISOString() })
      .eq("code", code);

    return { ok: true, kind: invite.kind };
  } catch (error) {
    console.error("No se pudo resolver el código de invitación:", error);

    return { ok: false, kind: null };
  }
}
