"use client";

import { useEffect, useRef, useState } from "react";

import { computeCompatibility } from "@/lib/compatibility";
import { fetchFollowingIds } from "@/lib/supabase/follows";
import { fetchProfilesByUserIds } from "@/lib/supabase/profiles";
import {
  fetchWatchedHistoriesByUserIds,
  type WatchedRow,
} from "@/lib/supabase/summary";
import {
  summarizeGroupCompatibility,
  type GroupCompatSummary,
} from "@/lib/wrappedExtras";

// Hasta 10 (no ilimitado): deja sitio de sobra para un grupo normal
// sin que la pantalla ("Tu grupo de cine", sin scroll) tenga que
// recortar a nadie, pero sin dejar que una cuenta que sigue a
// muchísima gente reviente el alto fijo de la pantalla.
const GROUP_LIMIT = 10;

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
  // A quién sigues (lib/supabase/follows.ts), no solo "amigos"
  // (solicitud aceptada en los dos sentidos, lib/supabase/friends.ts):
  // el diario de alguien ya es visible por seguirle (RLS "watched:
  // seguidores leen", supabase/social.sql), así que la compatibilidad
  // se puede calcular igual sin que haga falta amistad mutua — y así
  // "Tu grupo de cine" no deja fuera a quien sigues pero todavía no te
  // sigue de vuelta ni ha aceptado una solicitud.
  const followingIds = await fetchFollowingIds(userId);

  if (followingIds.length === 0) {
    return {
      summary: { groupAveragePercent: null, readyCount: 0, top: [] },
      friendCount: 0,
    };
  }

  // Antes: una consulta a Supabase POR persona seguida (N+1 — con
  // bastante gente seguida, N peticiones en paralelo solo para esta
  // pantalla). Ahora: el perfil de todos a la vez (ya lo hacía) y el
  // historial de todos a la vez también, así que esto es siempre 2
  // consultas, siga a quien siga.
  const [people, historiesByUser] = await Promise.all([
    fetchProfilesByUserIds(followingIds),
    fetchWatchedHistoriesByUserIds(followingIds),
  ]);

  const entries = people.map((person) => {
    const theirHistory = historiesByUser.get(person.userId) ?? [];
    const compat = computeCompatibility(myHistory, theirHistory);

    return {
      userId: person.userId,
      name: person.displayName ?? person.username,
      percent: compat.status === "ready" ? compat.percent : null,
    };
  });

  return {
    summary: summarizeGroupCompatibility(entries, GROUP_LIMIT),
    friendCount: people.length,
  };
}

/**
 * "Tu grupo de cine" (lib/wrappedExtras.ts): reutiliza a quién sigues
 * (lib/supabase/follows.ts) y la compatibilidad 1:1 ya existente
 * (lib/compatibility.ts, igual que en FriendsTab) para calcular la
 * media de grupo y el top. Perezoso: solo se dispara cuando se llega
 * a esta pantalla, no bloquea el resto del Resumen.
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
