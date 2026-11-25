/**
 * Agregaciones puras para las dos pantallas del Resumen Anual que
 * necesitan datos adicionales por red (reparto por título, historial
 * de amigos): esta parte es solo el cálculo, sin fetch ni Supabase,
 * mismo patrón que lib/wrapped.ts y lib/compatibility.ts. Quien llama
 * (hooks/useWrappedCastHighlights.ts, hooks/useWrappedFriendsGroup.ts)
 * trae los datos crudos y aquí solo se agregan.
 */

import type { TitleCredits } from "@/lib/compatibilityExtras";

export type PersonHighlight = { name: string; count: number };

export type CastHighlights = {
  actor?: PersonHighlight;
  director?: PersonHighlight;
};

// Con un solo título no significa nada que "se repita" un actor o
// director: hace falta al menos 2 títulos distintos vistos este año
// para contar como un patrón real (mismo umbral que
// lib/compatibilityExtras.ts).
const MIN_REPEAT = 2;

/** De los créditos de todos los títulos vistos este año, el actor y el director que más se repiten (independientes entre sí). */
export function topCastHighlights(credits: TitleCredits[]): CastHighlights {
  const directorCounts = new Map<string, number>();
  const castCounts = new Map<string, number>();

  for (const credit of credits) {
    if (credit.director) {
      directorCounts.set(
        credit.director,
        (directorCounts.get(credit.director) ?? 0) + 1
      );
    }

    for (const name of credit.cast) {
      castCounts.set(name, (castCounts.get(name) ?? 0) + 1);
    }
  }

  const bestDirector = [...directorCounts.entries()]
    .filter(([, count]) => count >= MIN_REPEAT)
    .sort((a, b) => b[1] - a[1])[0];

  const bestActor = [...castCounts.entries()]
    .filter(([, count]) => count >= MIN_REPEAT)
    .sort((a, b) => b[1] - a[1])[0];

  return {
    actor: bestActor ? { name: bestActor[0], count: bestActor[1] } : undefined,
    director: bestDirector
      ? { name: bestDirector[0], count: bestDirector[1] }
      : undefined,
  };
}

export type GroupCompatInput = {
  userId: string;
  name: string;
  /** null = compatibilidad "not_enough" (sin suficientes valoraciones en común). */
  percent: number | null;
};

export type GroupCompatSummary = {
  /** Media del grupo entre quienes sí tienen compatibilidad calculable; null si nadie la tiene. */
  groupAveragePercent: number | null;
  /** Cuántos amigos entraron en la media (status "ready"). */
  readyCount: number;
  top: { userId: string; name: string; percent: number }[];
};

/** Resume la compatibilidad 1:1 con cada amigo en una media de grupo + el top. */
export function summarizeGroupCompatibility(
  entries: GroupCompatInput[],
  limit = 3
): GroupCompatSummary {
  const ready = entries.filter(
    (e): e is GroupCompatInput & { percent: number } => e.percent !== null
  );

  if (ready.length === 0) {
    return { groupAveragePercent: null, readyCount: 0, top: [] };
  }

  const groupAveragePercent = Math.round(
    ready.reduce((sum, e) => sum + e.percent, 0) / ready.length
  );

  const top = [...ready]
    .sort((a, b) => b.percent - a.percent)
    .slice(0, limit)
    .map((e) => ({ userId: e.userId, name: e.name, percent: e.percent }));

  return { groupAveragePercent, readyCount: ready.length, top };
}
