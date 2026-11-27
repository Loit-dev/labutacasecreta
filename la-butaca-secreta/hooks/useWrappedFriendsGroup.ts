"use client";

import { useEffect, useRef, useState } from "react";

import { computeCompatibility } from "@/lib/compatibility";
import { fetchFriends } from "@/lib/supabase/friends";
import { fetchWatchedHistory, type WatchedRow } from "@/lib/supabase/summary";
import {
  summarizeGroupCompatibility,
  type GroupCompatSummary,
} from "@/lib/wrappedExtras";

/**
 * Mismo cálculo que usa el hook de abajo, pero como función suelta:
 * la reutiliza también lib/wrappedShareImage.ts (vía WrappedScreen.tsx)
 * para la burbuja de compatibilidad de grupo en la tarjeta final, que
 * se genera fuera de la pantalla "Tu grupo de cine" y por tanto no
 * pasa por el hook.
 */
export async function fetchGroupCompatSummary(
  userId: string,
  myHistory: WatchedRow[]
): Promise<{ summary: GroupCompatSummary; friendCount: number }> {
  const friends = await fetchFriends(userId);

  if (friends.length === 0) {
    return {
      summary: { groupAveragePercent: null, readyCount: 0, top: [] },
      friendCount: 0,
    };
  }

  const entries = await Promise.all(
    friends.map(async (friend) => {
      const theirHistory = await fetchWatchedHistory(friend.userId);
      const compat = computeCompatibility(myHistory, theirHistory);

      return {
        userId: friend.userId,
        name: friend.displayName ?? friend.username,
        percent: compat.status === "ready" ? compat.percent : null,
      };
    })
  );

  // 6 (no 3): con barras en vez de filas de texto caben más sin
  // apelotonar la pantalla, y así se ve a más amigos del grupo.
  return {
    summary: summarizeGroupCompatibility(entries, 6),
    friendCount: friends.length,
  };
}

/**
 * "Tu grupo de cine" (lib/wrappedExtras.ts): reutiliza los amigos
 * aceptados (lib/supabase/friends.ts) y la compatibilidad 1:1 ya
 * existente (lib/compatibility.ts, igual que en FriendsTab) para
 * calcular la media de grupo y el top 3. Perezoso: solo se dispara
 * cuando se llega a esta pantalla, no bloquea el resto del Resumen.
 */
export function useWrappedFriendsGroup(
  userId: string | undefined,
  myHistory: WatchedRow[]
): {
  summary: GroupCompatSummary | null;
  friendCount: number;
  loading: boolean;
} {
  const [summary, setSummary] = useState<GroupCompatSummary | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function run() {
      if (!userId || myHistory.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { summary, friendCount } = await fetchGroupCompatSummary(
        userId,
        myHistory
      );

      if (cancelledRef.current) return;

      setFriendCount(friendCount);
      setSummary(summary);
      setLoading(false);
    }

    run();

    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, myHistory.length]);

  return { summary, friendCount, loading };
}
