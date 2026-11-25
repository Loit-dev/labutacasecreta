"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { buildWrapped, type WrappedStats } from "@/lib/wrapped";
import {
  fetchAchievementUnlocks,
} from "@/lib/supabase/achievements";
import { fetchWatchedHistoryFull, type WatchedRow } from "@/lib/supabase/summary";
import { countRejectedThisYear } from "@/lib/rejected";
import { oldestPending } from "@/lib/watchlist";
import type { CanonResult } from "@/lib/canon";
import { useAuth } from "./useAuth";

type WrappedResult = {
  stats: WrappedStats | null;
  loading: boolean;
  /** Historial completo (no solo el año del resumen): lo necesitan las pantallas de "cara conocida" y "grupo de amigos", que agregan por su cuenta. */
  watched: WatchedRow[];
};

/**
 * Trae y calcula el Resumen Anual para `year`. Mismo patrón perezoso
 * que useAchievements: se calcula al montar, nunca en segundo plano.
 * Alcance v1 (ver lib/wrapped.ts): sin las pantallas que necesitan
 * datos que la app todavía no agrega (reparto por título, qué ve todo
 * el mundo, compatibilidad de grupo).
 */
export function useWrapped(year: number): WrappedResult {
  const { session } = useAuth();
  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [watched, setWatched] = useState<WatchedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = session?.user.id;
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const [watched, achievementUnlocks, canonItems] = await Promise.all([
      fetchWatchedHistoryFull(userId),
      fetchAchievementUnlocks(userId),
      fetch("/api/canon").then((r) => (r.ok ? r.json() : [])) as Promise<
        CanonResult[]
      >,
    ]);

    if (cancelledRef.current) return;

    const canonIds = new Set(
      canonItems
        .map((item) => item.tmdbId)
        .filter((id): id is number => id !== null)
    );

    const pending = oldestPending();

    const computed = buildWrapped({
      year,
      watched,
      canonIds,
      canonTotal: canonItems.length,
      achievementUnlocks,
      pendingOldest: pending
        ? { title: pending.title, savedAt: pending.savedAt }
        : undefined,
      rejectedThisYearCount: countRejectedThisYear(year),
    });

    setStats(computed);
    setWatched(watched);
    setLoading(false);
  }, [userId, year]);

  useEffect(() => {
    cancelledRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();

    return () => {
      cancelledRef.current = true;
    };
  }, [load]);

  return { stats, loading, watched };
}
