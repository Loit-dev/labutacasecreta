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
      .select("tmdb_id, media_type, title, rating, genres, seen_at")
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
    }));
  } catch (error) {
    console.error("No se pudo leer el historial (watched):", error);

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
