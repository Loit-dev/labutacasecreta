"use client";

import { supabase } from "./client";
import type { AchievementWatchedRow } from "@/lib/achievements/compute";
import { computeCompatibility } from "@/lib/compatibility";
import { fetchFriends } from "./friends";
import { fetchWatchedHistory, type WatchedRow } from "./summary";

/**
 * Historial COMPLETO de "vistos" para calcular logros (sin el límite
 * de 400 filas que usa Mi Resumen — ver nota en lib/achievements/compute.ts).
 * Trae solo las columnas que hacen falta, no título ni póster.
 */
export async function fetchAchievementWatchedRows(
  userId: string
): Promise<AchievementWatchedRow[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("watched")
      .select("tmdb_id, media_type, rating, genres, seen_at, tmdb_vote_average")
      .eq("user_id", userId);

    if (error || !data) return [];

    return data.map((row) => ({
      tmdbId: row.tmdb_id,
      mediaType: row.media_type,
      rating: row.rating ?? undefined,
      genres: row.genres ?? [],
      seenAt: row.seen_at,
      tmdbVoteAverage: row.tmdb_vote_average ?? undefined,
    }));
  } catch (error) {
    console.error("No se pudo leer el historial para logros:", error);

    return [];
  }
}

/** Nivel máximo ya desbloqueado por familia (0 si no hay ninguno). */
export async function fetchStoredAchievementLevels(
  userId: string
): Promise<Record<string, number>> {
  if (!supabase) return {};

  try {
    const { data, error } = await supabase
      .from("user_achievements")
      .select("achievement_key, level")
      .eq("user_id", userId);

    if (error || !data) return {};

    const result: Record<string, number> = {};

    for (const row of data) {
      result[row.achievement_key] = Math.max(
        result[row.achievement_key] ?? 0,
        row.level
      );
    }

    return result;
  } catch (error) {
    console.error("No se pudieron leer los logros guardados:", error);

    return {};
  }
}

/** Inserta los niveles nuevos detectados. Ignora los que ya existan. */
export async function insertUnlockedLevels(
  userId: string,
  levels: { key: string; level: number }[]
): Promise<void> {
  if (!supabase || levels.length === 0) return;

  try {
    await supabase.from("user_achievements").upsert(
      levels.map((l) => ({
        user_id: userId,
        achievement_key: l.key,
        level: l.level,
      })),
      { onConflict: "user_id,achievement_key,level", ignoreDuplicates: true }
    );
  } catch (error) {
    console.error("No se pudieron guardar los logros nuevos:", error);
  }
}

export type ShareScreen = "profile" | "compatibility" | "summary" | "watched";

/** Registra un "compartir" por cuenta, para el logro "Compartir" (ver ShareDialog*). */
export async function recordShareEvent(
  userId: string,
  screen: ShareScreen
): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.from("user_share_events").insert({
      user_id: userId,
      screen,
    });
  } catch (error) {
    console.error("No se pudo registrar el compartido:", error);
  }
}

export async function fetchShareEventsCount(userId: string): Promise<number> {
  if (!supabase) return 0;

  try {
    const { count, error } = await supabase
      .from("user_share_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) return 0;

    return count ?? 0;
  } catch (error) {
    console.error("No se pudo contar lo compartido:", error);

    return 0;
  }
}

export async function fetchRecommendationsSentCount(
  userId: string
): Promise<number> {
  if (!supabase) return 0;

  try {
    const { count, error } = await supabase
      .from("recommendations")
      .select("id", { count: "exact", head: true })
      .eq("from_user_id", userId);

    if (error) return 0;

    return count ?? 0;
  } catch (error) {
    console.error("No se pudieron contar las recomendaciones enviadas:", error);

    return 0;
  }
}

export async function fetchListsCount(userId: string): Promise<number> {
  if (!supabase) return 0;

  try {
    const { count, error } = await supabase
      .from("lists")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) return 0;

    return count ?? 0;
  } catch (error) {
    console.error("No se pudieron contar las listas:", error);

    return 0;
  }
}

/**
 * Nº de amigos con los que la compatibilidad llega a ≥80%. Reutiliza
 * exactamente el mismo cálculo que la pestaña Amigos (lib/compatibility.ts),
 * trayendo el historial de cada amigo uno a uno — con pocos amigos
 * (lo habitual) es barato; con cientos, habría que paginar.
 */
export async function fetchCompatibleFriendsCount(
  userId: string,
  myHistory: WatchedRow[]
): Promise<number> {
  if (!supabase || myHistory.length === 0) return 0;

  try {
    const friends = await fetchFriends(userId);

    if (friends.length === 0) return 0;

    const results = await Promise.all(
      friends.map(async (friend) => {
        const theirHistory = await fetchWatchedHistory(friend.userId);
        const compat = computeCompatibility(myHistory, theirHistory);

        return compat.status === "ready" && compat.percent >= 80;
      })
    );

    return results.filter(Boolean).length;
  } catch (error) {
    console.error("No se pudo calcular la compatibilidad con amigos:", error);

    return 0;
  }
}

const BETA_TESTER_KEY = "beta_tester";

/**
 * Concede "Beta tester" si la cuenta se creó antes del corte y aún no
 * lo tiene. Se llama una vez al cargar el perfil — es idempotente
 * (insertUnlockedLevels ignora duplicados).
 */
export async function grantBetaTesterIfEligible(
  userId: string,
  accountCreatedAt: string,
  cutoffIso: string
): Promise<boolean> {
  if (!supabase) return false;

  if (new Date(accountCreatedAt).getTime() > new Date(cutoffIso).getTime()) {
    return false;
  }

  try {
    const { data } = await supabase
      .from("user_achievements")
      .select("achievement_key")
      .eq("user_id", userId)
      .eq("achievement_key", BETA_TESTER_KEY)
      .maybeSingle();

    if (data) return false;

    await insertUnlockedLevels(userId, [{ key: BETA_TESTER_KEY, level: 1 }]);

    return true;
  } catch (error) {
    console.error("No se pudo comprobar/conceder Beta tester:", error);

    return false;
  }
}
