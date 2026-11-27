"use client";

import { supabase } from "./client";
import type { Rating } from "@/lib/rating";

export type WatchedRow = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  rating?: Rating;
  genres: string[];
  seenAt: string;
  posterUrl?: string;
  /** Reseña escrita a mano por el usuario, para el Diario. */
  review?: string;
};

// De sobra para 14 días de gráfico + géneros + mejor valorada, sin
// traer el histórico entero de cuentas muy antiguas.
const HISTORY_LIMIT = 400;

/** Historial de "vistos" del usuario, más reciente primero. */
export async function fetchWatchedHistory(
  userId: string
): Promise<WatchedRow[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("watched")
      .select(
        "tmdb_id, media_type, title, rating, genres, seen_at, poster_url, review"
      )
      .eq("user_id", userId)
      .order("seen_at", { ascending: false })
      .limit(HISTORY_LIMIT);

    if (error || !data) return [];

    return data.map((row) => ({
      tmdbId: row.tmdb_id,
      mediaType: row.media_type,
      title: row.title,
      rating: row.rating ?? undefined,
      genres: row.genres ?? [],
      seenAt: row.seen_at,
      posterUrl: row.poster_url ?? undefined,
      review: row.review ?? undefined,
    }));
  } catch (error) {
    console.error("No se pudo leer el historial (watched):", error);

    return [];
  }
}

/**
 * Igual que fetchWatchedHistory, pero para varias personas A LA VEZ:
 * una sola consulta con "user_id in (...)" en vez de una por persona.
 *
 * La usa "Tu grupo de cine" (hooks/useWrappedFriendsGroup.ts) para
 * calcular la compatibilidad con todo lo que sigues sin disparar N
 * peticiones a Supabase en paralelo (N = cuánta gente sigas, que no
 * tiene por qué ser poca) — con esto siempre es 1, pase lo que pase.
 *
 * El límite por persona (HISTORY_LIMIT) se aplica DESPUÉS, en el
 * cliente, porque Postgres no tiene forma de decir "las 400 más
 * recientes de cada user_id" en una sola consulta sin una window
 * function que Supabase-js no expone. Para no perder justo lo más
 * reciente de alguien muy activo si al grupo entero le tocara ir
 * recortado, se pide el conjunto SIN límite en la consulta (RLS ya
 * acota a quien sigues) y se corta a HISTORY_LIMIT por persona ya
 * agrupado — una sola consulta grande en vez de muchas pequeñas sigue
 * siendo más barato en round-trips, que es lo que de verdad pesa.
 */
export async function fetchWatchedHistoriesByUserIds(
  userIds: string[]
): Promise<Map<string, WatchedRow[]>> {
  const byUser = new Map<string, WatchedRow[]>();

  if (!supabase || userIds.length === 0) return byUser;

  try {
    const { data, error } = await supabase
      .from("watched")
      .select(
        "user_id, tmdb_id, media_type, title, rating, genres, seen_at, poster_url, review"
      )
      .in("user_id", userIds)
      .order("seen_at", { ascending: false });

    if (error || !data) return byUser;

    for (const row of data) {
      const rows = byUser.get(row.user_id) ?? [];

      if (rows.length >= HISTORY_LIMIT) continue; // ya tiene de sobra (viene ordenado por fecha)

      rows.push({
        tmdbId: row.tmdb_id,
        mediaType: row.media_type,
        title: row.title,
        rating: row.rating ?? undefined,
        genres: row.genres ?? [],
        seenAt: row.seen_at,
        posterUrl: row.poster_url ?? undefined,
        review: row.review ?? undefined,
      });

      byUser.set(row.user_id, rows);
    }

    return byUser;
  } catch (error) {
    console.error(
      "No se pudieron leer varios historiales (watched) a la vez:",
      error
    );

    return byUser;
  }
}

/**
 * Igual que fetchWatchedHistory pero SIN el límite de 400 filas, para
 * el Resumen Anual: El Canon y Logros son progreso acumulado de
 * siempre, así que una cuenta con mucho historial no puede quedarse
 * corta de filas (mismo motivo que fetchAchievementWatchedRows en
 * lib/supabase/achievements.ts, pero con título/póster para poder
 * enseñarlos).
 */
export async function fetchWatchedHistoryFull(
  userId: string
): Promise<WatchedRow[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("watched")
      .select(
        "tmdb_id, media_type, title, rating, genres, seen_at, poster_url, review"
      )
      .eq("user_id", userId)
      .order("seen_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      tmdbId: row.tmdb_id,
      mediaType: row.media_type,
      title: row.title,
      rating: row.rating ?? undefined,
      genres: row.genres ?? [],
      seenAt: row.seen_at,
      posterUrl: row.poster_url ?? undefined,
      review: row.review ?? undefined,
    }));
  } catch (error) {
    console.error("No se pudo leer el historial completo (watched):", error);

    return [];
  }
}

export type MonthRank = {
  mine: number;
  percentile: number;
  totalUsers: number;
};

/**
 * Toque competitivo de "Mi Resumen": cuántas veces ha visto el
 * usuario algo este mes frente al resto de cuentas (supabase/resumen.sql).
 * `null` si la función aún no existe en Supabase (despliegue sin esa
 * migración) o si algo falla: el resumen se muestra igual, sin ese dato.
 */
export async function fetchMonthRank(): Promise<MonthRank | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .rpc("my_month_rank")
      .single<{ mine: number; percentile: number; total_users: number }>();

    if (error || !data) return null;

    return {
      mine: data.mine,
      percentile: data.percentile,
      totalUsers: data.total_users,
    };
  } catch (error) {
    console.error("No se pudo calcular el ranking del mes:", error);

    return null;
  }
}

export type YearRank = {
  mine: number;
  percentile: number;
  totalUsers: number;
};

/**
 * Comparativa con el resto de la app para el Resumen Anual: cuántos
 * títulos ha visto el usuario en el año del resumen frente al resto
 * de cuentas (supabase/resumen.sql, my_year_rank — mismo patrón que
 * fetchMonthRank, pero para el año entero). `null` si la función aún
 * no existe en Supabase (despliegue sin esa migración) o si algo
 * falla: el Resumen se muestra igual, sin ese dato.
 */
export async function fetchYearRank(year: number): Promise<YearRank | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .rpc("my_year_rank", { p_year: year })
      .single<{ mine: number; percentile: number; total_users: number }>();

    if (error || !data) return null;

    return {
      mine: data.mine,
      percentile: data.percentile,
      totalUsers: data.total_users,
    };
  } catch (error) {
    console.error("No se pudo calcular el ranking del año:", error);

    return null;
  }
}
