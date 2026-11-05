"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  computeAchievements,
  diffNewLevels,
  type AchievementsState,
} from "@/lib/achievements/compute";
import { BETA_TESTER_CUTOFF_ISO, BETA_TESTER_KEY } from "@/lib/achievements/catalog";
import {
  fetchAchievementWatchedRows,
  fetchCompatibleFriendsCount,
  fetchListsCount,
  fetchRecommendationsSentCount,
  fetchShareEventsCount,
  fetchStoredAchievementLevels,
  grantBetaTesterIfEligible,
  insertUnlockedLevels,
} from "@/lib/supabase/achievements";
import { fetchSocialCounts } from "@/lib/supabase/socialCounts";
import { fetchWatchedHistory } from "@/lib/supabase/summary";
import { countRejected } from "@/lib/rejected";
import { readList } from "@/lib/watchlist";
import { useAuth } from "./useAuth";

export type UnlockedLevel = { key: string; level: number };

type AchievementsResult = {
  state: AchievementsState | null;
  loading: boolean;
  /** Niveles detectados como nuevos en ESTA carga, para el toast de desbloqueo (incluye "beta_tester" si se acaba de conceder). */
  newlyUnlocked: UnlockedLevel[];
  /** Persistente: si la cuenta ya tiene "Beta tester" (de esta carga o de una anterior), no solo de la carga actual. */
  betaTesterUnlocked: boolean;
  /** Llamar tras consumir newlyUnlocked (mostrado el toast) para no repetirlo. */
  clearNewlyUnlocked: () => void;
  /** Vuelve a calcular ya mismo (p. ej. justo tras valorar algo). */
  refresh: () => Promise<void>;
};

/**
 * Hook central del sistema de logros: trae los datos, calcula el
 * estado, lo compara con lo ya guardado y persiste los niveles nuevos.
 * Detección perezosa: se recalcula al montar y cada vez que se llama
 * a `refresh()`, nunca en segundo plano.
 */
export function useAchievements(): AchievementsResult {
  const { session } = useAuth();
  const [state, setState] = useState<AchievementsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState<UnlockedLevel[]>([]);
  const [betaTesterUnlocked, setBetaTesterUnlocked] = useState(false);
  const userId = session?.user.id;
  const createdAt = session?.user.created_at;
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const [
      achievementRows,
      myHistory,
      social,
      listsCount,
      recommendationsSentCount,
      shareEventsCount,
      storedLevels,
    ] = await Promise.all([
      fetchAchievementWatchedRows(userId),
      fetchWatchedHistory(userId),
      fetchSocialCounts(userId),
      fetchListsCount(userId),
      fetchRecommendationsSentCount(userId),
      fetchShareEventsCount(userId),
      fetchStoredAchievementLevels(userId),
    ]);

    if (cancelledRef.current) return;

    const compatibleFriendsCount = await fetchCompatibleFriendsCount(userId, myHistory);

    if (cancelledRef.current) return;

    const computed = computeAchievements({
      watched: achievementRows,
      friendsCount: social.friends,
      compatibleFriendsCount,
      listsCount,
      recommendationsSentCount,
      shareEventsCount,
      // "Mi lista" y "No me apetece" son locales al navegador (no
      // Supabase), así que se leen directamente aquí en vez de venir
      // de los fetch de arriba (ver lib/watchlist.ts, lib/rejected.ts).
      savedCount: readList().length,
      discardedCount: countRejected(),
    });

    const newLevels = diffNewLevels(computed, storedLevels);

    if (newLevels.length > 0) {
      await insertUnlockedLevels(userId, newLevels);
    }

    let betaJustGranted = false;

    if (createdAt) {
      betaJustGranted = await grantBetaTesterIfEligible(
        userId,
        createdAt,
        BETA_TESTER_CUTOFF_ISO
      );
    }

    if (cancelledRef.current) return;

    const betaAlreadyUnlocked = (storedLevels[BETA_TESTER_KEY] ?? 0) > 0;

    setState(computed);
    setBetaTesterUnlocked(betaAlreadyUnlocked || betaJustGranted);
    setNewlyUnlocked((prev) => [
      ...prev,
      ...newLevels,
      ...(betaJustGranted ? [{ key: BETA_TESTER_KEY, level: 1 }] : []),
    ]);
    setLoading(false);
  }, [userId, createdAt]);

  useEffect(() => {
    cancelledRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();

    return () => {
      cancelledRef.current = true;
    };
  }, [load]);

  return {
    state,
    loading,
    newlyUnlocked,
    betaTesterUnlocked,
    clearNewlyUnlocked: () => setNewlyUnlocked([]),
    refresh: load,
  };
}
