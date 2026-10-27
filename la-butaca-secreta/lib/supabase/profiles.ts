"use client";

import { supabase } from "./client";

export type ProfileRow = {
  userId: string;
  username: string;
  displayName: string | null;
};

function mapProfile(row: {
  user_id: string;
  username: string;
  display_name: string | null;
}): ProfileRow {
  return {
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
  };
}

const USERNAME_FORMAT = /^[a-z0-9_]{3,20}$/;

// Lista negra básica en español. No pretende ser exhaustiva: es un
// primer filtro automático, la moderación real es el botón de
// "Reportar" + revisión manual (ver supabase/social.sql, tabla reports).
const USERNAME_BLOCKLIST = [
  "admin",
  "administrador",
  "soporte",
  "butacasecreta",
  "labutacasecreta",
  "puta",
  "puto",
  "mierda",
  "gilipollas",
  "cabron",
  "zorra",
  "nazi",
  "violador",
];

export type UsernameValidation =
  | { ok: true }
  | { ok: false; reason: "formato" | "prohibido" };

/** Valida el formato y la lista negra, SIN comprobar si ya existe. */
export function validateUsername(raw: string): UsernameValidation {
  const username = raw.trim().toLowerCase();

  if (!USERNAME_FORMAT.test(username)) {
    return { ok: false, reason: "formato" };
  }

  if (USERNAME_BLOCKLIST.some((word) => username.includes(word))) {
    return { ok: false, reason: "prohibido" };
  }

  return { ok: true };
}

export async function fetchMyProfile(
  userId: string
): Promise<ProfileRow | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, username, display_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;

    return mapProfile(data);
  } catch (error) {
    console.error("No se pudo leer el perfil propio:", error);

    return null;
  }
}

export async function fetchProfileByUsername(
  username: string
): Promise<ProfileRow | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, username, display_name")
      .eq("username", username.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) return null;

    return mapProfile(data);
  } catch (error) {
    console.error("No se pudo leer el perfil por username:", error);

    return null;
  }
}

export async function fetchProfilesByUserIds(
  userIds: string[]
): Promise<ProfileRow[]> {
  if (!supabase || userIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, username, display_name")
      .in("user_id", userIds);

    if (error || !data) return [];

    return data.map(mapProfile);
  } catch (error) {
    console.error("No se pudieron leer varios perfiles:", error);

    return [];
  }
}

export type CreateProfileResult =
  | { ok: true; profile: ProfileRow }
  | { ok: false; reason: "formato" | "prohibido" | "en_uso" | "error" };

/** Crea el perfil (paso de onboarding, una sola vez por cuenta). */
export async function createProfile(
  userId: string,
  rawUsername: string
): Promise<CreateProfileResult> {
  if (!supabase) return { ok: false, reason: "error" };

  const username = rawUsername.trim().toLowerCase();
  const validation = validateUsername(username);

  if (!validation.ok) return { ok: false, reason: validation.reason };

  try {
    const { data, error } = await supabase
      .from("profiles")
      .insert({ user_id: userId, username })
      .select("user_id, username, display_name")
      .single();

    if (error) {
      // 23505 = unique_violation (el username ya existe).
      if ((error as { code?: string }).code === "23505") {
        return { ok: false, reason: "en_uso" };
      }

      return { ok: false, reason: "error" };
    }

    if (!data) return { ok: false, reason: "error" };

    return { ok: true, profile: mapProfile(data) };
  } catch (error) {
    console.error("No se pudo crear el perfil:", error);

    return { ok: false, reason: "error" };
  }
}

/** Busca perfiles cuyo username contenga el texto (buscador de Amigos). */
export async function searchProfiles(
  query: string,
  excludeUserId: string
): Promise<ProfileRow[]> {
  if (!supabase) return [];

  const term = query.trim().toLowerCase().replace(/^@/, "");

  if (term.length < 2) return [];

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, username, display_name")
      .ilike("username", `%${term}%`)
      .neq("user_id", excludeUserId)
      .limit(20);

    if (error || !data) return [];

    return data.map(mapProfile);
  } catch (error) {
    console.error("No se pudo buscar perfiles:", error);

    return [];
  }
}
