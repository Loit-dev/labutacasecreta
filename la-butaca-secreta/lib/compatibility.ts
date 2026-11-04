/**
 * Compatibilidad entre dos usuarios: cálculo puro (sin React ni
 * Supabase) a partir de ambos historiales de "vistos", para poder
 * probarlo sin depender del navegador ni de la red (mismo patrón que
 * lib/summary.ts).
 *
 * Solo mira el acuerdo de valoraciones (no géneros ni nada más): es
 * la señal más fiable de "gustos parecidos", pero exige que ambos
 * hayáis valorado algo en común — por debajo de MIN_COMMON_RATED no
 * se calcula nada (status "not_enough"), para no inventar un % con
 * muy pocos datos.
 */

import type { Rating } from "@/lib/rating";
import type { WatchedRow } from "@/lib/supabase/summary";

export type CompatibilityTier = {
  min: number;
  icon: string;
  label: string;
};

// Un icono por cada franja de 10 puntos, de "nada que ver" a
// "gemelos de cine". El tono es el mismo divertido/informal que el
// resto de la app (frases de "Mi Resumen", de compartir vistas...).
export const COMPATIBILITY_TIERS: CompatibilityTier[] = [
  { min: 90, icon: "🧬", label: "Gemelos de cine" },
  { min: 80, icon: "🍿", label: "Muy buena sintonía" },
  { min: 70, icon: "🎬", label: "Buenos gustos en común" },
  { min: 60, icon: "🙌", label: "Bastante compatibles" },
  { min: 50, icon: "🤝", label: "Compatibilidad decente" },
  { min: 40, icon: "🤔", label: "Gustos a medias" },
  { min: 30, icon: "😅", label: "Poca sintonía" },
  { min: 20, icon: "🙃", label: "Casi nada en común" },
  { min: 10, icon: "🎭", label: "Gustos opuestos" },
  { min: 0, icon: "🧊", label: "Polos opuestos" },
];

// Por debajo de esto no se enseña ningún %: con 1-2 títulos en común
// un desacuerdo o acuerdo puntual dispara el número de forma poco
// representativa.
export const MIN_COMMON_RATED = 3;

export function tierFor(percent: number): CompatibilityTier {
  return (
    COMPATIBILITY_TIERS.find((tier) => percent >= tier.min) ??
    COMPATIBILITY_TIERS[COMPATIBILITY_TIERS.length - 1]
  );
}

export type CommonTitle = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterUrl?: string;
  myRating: Rating;
  theirRating: Rating;
};

export type Compatibility =
  | { status: "not_enough"; commonCount: number; commonRatedCount: number }
  | {
      status: "ready";
      percent: number;
      icon: string;
      label: string;
      commonCount: number;
      commonRatedCount: number;
      // Los títulos en los que más de acuerdo estáis primero.
      topCommon: CommonTitle[];
    };

function key(row: Pick<WatchedRow, "mediaType" | "tmdbId">): string {
  return `${row.mediaType}-${row.tmdbId}`;
}

/** Compatibilidad de `mine` (mi historial) frente a `theirs` (el de otra persona). */
export function computeCompatibility(
  mine: WatchedRow[],
  theirs: WatchedRow[]
): Compatibility {
  const theirsByKey = new Map<string, WatchedRow>();

  for (const row of theirs) {
    theirsByKey.set(key(row), row);
  }

  let commonCount = 0;
  const rated: CommonTitle[] = [];

  for (const row of mine) {
    const theirRow = theirsByKey.get(key(row));

    if (!theirRow) continue;

    commonCount++;

    if (row.rating !== undefined && theirRow.rating !== undefined) {
      rated.push({
        tmdbId: row.tmdbId,
        mediaType: row.mediaType,
        title: row.title,
        posterUrl: row.posterUrl ?? theirRow.posterUrl,
        myRating: row.rating,
        theirRating: theirRow.rating,
      });
    }
  }

  if (rated.length < MIN_COMMON_RATED) {
    return {
      status: "not_enough",
      commonCount,
      commonRatedCount: rated.length,
    };
  }

  // Por título: 1 = misma nota exacta, 0 = la diferencia máxima
  // posible (4 puntos, de 1 a 5 estrellas). La media de eso, en %.
  const avgSimilarity =
    rated.reduce(
      (sum, r) => sum + (1 - Math.abs(r.myRating - r.theirRating) / 4),
      0
    ) / rated.length;

  const percent = Math.round(
    Math.max(0, Math.min(1, avgSimilarity)) * 100
  );

  const tier = tierFor(percent);

  const topCommon = [...rated]
    .sort(
      (a, b) =>
        Math.abs(a.myRating - a.theirRating) -
        Math.abs(b.myRating - b.theirRating)
    )
    .slice(0, 3);

  return {
    status: "ready",
    percent,
    icon: tier.icon,
    label: tier.label,
    commonCount,
    commonRatedCount: rated.length,
    topCommon,
  };
}
