"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { useAchievements } from "@/hooks/useAchievements";
import { useAuth } from "@/hooks/useAuth";
import { familyByKey } from "@/lib/achievements/catalog";
import type { AchievementsState } from "@/lib/achievements/compute";
import ProgressToast, { type NearMiss } from "./ProgressToast";
import UnlockToast from "./UnlockToast";

type Ctx = {
  state: AchievementsState | null;
  loading: boolean;
  /**
   * Llamar justo después de guardar un "visto" con rating, pasando los
   * géneros del título. Refresca los logros y, si no sale ningún
   * nivel nuevo pero queda poco para el siguiente (en esos géneros o
   * en Valoraciones), muestra el aviso de progreso.
   */
  notifyWatchedAction: (genres: string[]) => void;
};

const AchievementsContext = createContext<Ctx | null>(null);

export function useAchievementsContext(): Ctx {
  const ctx = useContext(AchievementsContext);

  if (!ctx) {
    // Fuera del provider (no debería pasar): no rompe la app, solo no hace nada.
    return { state: null, loading: true, notifyWatchedAction: () => {} };
  }

  return ctx;
}

const NEAR_MISS_GAP = 2;

function findNearMiss(state: AchievementsState, relevantKeys: string[]): NearMiss | null {
  const candidates = [...state.general, ...state.genero].filter(
    (p) => relevantKeys.includes(p.key) && p.nextThreshold !== undefined
  );

  let best: NearMiss | null = null;

  for (const p of candidates) {
    const gap = (p.nextThreshold as number) - p.value;
    if (gap > NEAR_MISS_GAP || gap <= 0) continue;

    const family = familyByKey(p.key);
    if (!family) continue;

    if (!best || gap < best.nextThreshold - best.value) {
      best = { family, level: p.level + 1, value: p.value, nextThreshold: p.nextThreshold as number };
    }
  }

  return best;
}

export default function AchievementsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { state, loading, newlyUnlocked, clearNewlyUnlocked, refresh } = useAchievements();
  const [nearMiss, setNearMiss] = useState<NearMiss | null>(null);
  // Claves relevantes de una acción reciente a la espera de un
  // `refresh()` ya resuelto, para saber contra qué comprobar el
  // casi-logro cuando el nuevo `state` llegue.
  const pendingKeysRef = useRef<string[] | null>(null);

  function notifyWatchedAction(genres: string[]) {
    const genreKeys = genres.map((g) => `genero_${g.toLowerCase().replace(/[^a-z]/g, "")}`);
    pendingKeysRef.current = [...genreKeys, "valoraciones", "racha", "volumen_diario"];
    refresh();
  }

  useEffect(() => {
    if (!state || !pendingKeysRef.current) return;

    const keys = pendingKeysRef.current;
    pendingKeysRef.current = null;

    // El toast de desbloqueo tiene prioridad: si justo se consiguió
    // algo, no se amontona encima un aviso de progreso.
    if (newlyUnlocked.length > 0) return;

    setNearMiss(findNearMiss(state, keys));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <AchievementsContext.Provider value={{ state, loading, notifyWatchedAction }}>
      {children}

      {session && newlyUnlocked.length > 0 && (
        <UnlockToast userId={session.user.id} unlocked={newlyUnlocked} onDone={clearNewlyUnlocked} />
      )}

      {session && newlyUnlocked.length === 0 && nearMiss && (
        <ProgressToast nearMiss={nearMiss} onDone={() => setNearMiss(null)} />
      )}
    </AchievementsContext.Provider>
  );
}
