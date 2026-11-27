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

      const friends = await fetchFriends(userId);

      if (cancelledRef.current) return;

      setFriendCount(friends.length);

      if (friends.length === 0) {
        setSummary({ groupAveragePercent: null, readyCount: 0, top: [] });
        setLoading(false);
        return;
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

      if (cancelledRef.current) return;

      // 6 (no 3): con barras en vez de filas de texto caben más sin
      // apelotonar la pantalla, y así se ve a más amigos del grupo.
      setSummary(summarizeGroupCompatibility(entries, 6));
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
