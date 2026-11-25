"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { ScrollIcon } from "@/components/icons/Icons";
import { fetchWatchedHistory } from "@/lib/supabase/summary";
import type { CanonResult } from "@/lib/canon";

type State = { count: number; total: number } | null;

/**
 * Fila compacta de "El Canon" en Mi Resumen, igual de pequeña que
 * ProfileAchievementsRow: solo progreso + enlace a la pantalla
 * completa (CanonScreen, en AccountScreen bajo tab "canon").
 */
export default function CanonProfileRow({
  session,
  onOpenFull,
}: {
  session: Session;
  onOpenFull: () => void;
}) {
  const [state, setState] = useState<State>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/canon").then((r) => (r.ok ? r.json() : [])) as Promise<CanonResult[]>,
      fetchWatchedHistory(session.user.id),
    ]).then(([canon, rows]) => {
      if (cancelled) return;

      const watchedIds = new Set(
        rows.filter((r) => r.mediaType === "movie").map((r) => r.tmdbId)
      );

      const count = canon.filter((c) => c.tmdbId && watchedIds.has(c.tmdbId)).length;

      setState({ count, total: canon.length || 250 });
    });

    return () => {
      cancelled = true;
    };
  }, [session.user.id]);

  const pct = state ? Math.round((state.count / state.total) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onOpenFull}
      className="rounded-3xl border border-white/20 bg-black/5 p-4 text-left shadow-2xl backdrop-blur-sm transition-colors hover:border-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:bg-black/15 md:backdrop-blur-xl lg:bg-black/30 lg:backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-bold text-white">
          <ScrollIcon size={16} className="text-amber-300" />
          El Canon
        </span>

        <span className="text-xs font-semibold text-zinc-300">
          {state ? `${state.count} / ${state.total}` : "…"}
        </span>
      </div>

      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}
