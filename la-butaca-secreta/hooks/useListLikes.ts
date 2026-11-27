"use client";

import { useEffect, useState } from "react";

import { toggleLike, type LikeState } from "@/lib/lists/shared";
import { fetchMyLikedListIds, setListLike } from "@/lib/supabase/listsFeed";

/**
 * "Me gusta" de la persona en las listas de la comunidad. Los recuentos
 * vienen cacheados del servidor (/api/listas, /lista/[id]); aquí se
 * guarda qué listas le gustan y cuánto ha cambiado cada recuento desde
 * que se cargó la página, para que el botón responda al momento.
 */
export function useListLikes(userId: string | null) {
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [deltas, setDeltas] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLiked(new Set());
      return;
    }

    fetchMyLikedListIds(userId).then((ids) => {
      if (!cancelled) setLiked(ids);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  function likeFor(listId: string, serverCount: number): LikeState {
    return {
      liked: liked.has(listId),
      count: Math.max(0, serverCount + (deltas[listId] ?? 0)),
    };
  }

  function apply(listId: string, nowLiked: boolean, delta: number) {
    setLiked((current) => {
      const next = new Set(current);

      if (nowLiked) next.add(listId);
      else next.delete(listId);

      return next;
    });
    setDeltas((current) => ({
      ...current,
      [listId]: (current[listId] ?? 0) + delta,
    }));
  }

  async function toggle(listId: string, serverCount: number) {
    if (!userId) return;

    const before = likeFor(listId, serverCount);
    const after = toggleLike(before);
    const delta = after.liked ? 1 : -1;

    apply(listId, after.liked, delta);

    const ok = await setListLike(userId, listId, after.liked);

    if (!ok) apply(listId, before.liked, -delta);
  }

  return { likeFor, toggle };
}
