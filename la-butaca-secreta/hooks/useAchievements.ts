"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  computeAchievements,
  diffNewLevels,
  type AchievementsState,
} from "@/lib/achievements/compute";
import { BETA_TESTER_CUTOFF_ISO } from "@/lib/achievements/catalog";
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
import { useAuth } from "./useAuth";

export type UnlockedLevel = { key: string; level: number };

type AchievementsResult = {
  state: AchievementsState | null;
  loading: boolean;
  /** Niveles detectados como nuevos en ESTA carga, para el toast de desbloqueo. */
  newlyUnlocked: UnlockedLevel[];
  betaTesterGranted: boolean;
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
  const [betaTesterGranted, setBetaTesterGranted] = useState(false);
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
    });

    const newLevels = diffNewLevels(computed, storedLevels);

    if (newLevels.length > 0) {
      await insertUnlockedLevels(userId, newLevels);
    }

    if (createdAt) {
      const granted = await grantBetaTesterIfEligible(
        userId,
        createdAt,
        BETA_TESTER_CUTOFF_ISO
      );

      if (!cancelledRef.current && granted) setBetaTesterGranted(true);
    }

    if (cancelledRef.current) return;

    setState(computed);
    setNewlyUnlocked((prev) => [...prev, ...newLevels]);
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
    betaTesterGranted,
    clearNewlyUnlocked: () => setNewlyUnlocked([]),
    refresh: load,
  };
}
