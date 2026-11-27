/**
 * Agregaciones puras para las dos pantallas del Resumen Anual que
 * necesitan datos adicionales por red (reparto por título, historial
 * de amigos): esta parte es solo el cálculo, sin fetch ni Supabase,
 * mismo patrón que lib/wrapped.ts y lib/compatibility.ts. Quien llama
 * (hooks/useWrappedCastHighlights.ts, hooks/useWrappedFriendsGroup.ts)
 * trae los datos crudos y aquí solo se agregan.
 */

import type { TitleCredits } from "@/lib/compatibilityExtras";

export type PersonHighlight = {
  name: string;
  count: number;
  /** Foto (URL completa de TMDb) de alguno de los títulos donde apareció; null si no hay. */
  photoPath?: string | null;
  /** Títulos (de los vistos este año) en los que aparece, en el orden en que se encontraron. */
  titles: string[];
};

export type CastHighlights = {
  actor?: PersonHighlight;
  director?: PersonHighlight;
};

/**
 * Igual que TitleCredits (lib/compatibilityExtras.ts) pero con la foto
 * de cada nombre, en el mismo orden que `cast` — opcional para que
 * quien ya llamaba a /api/credits sin pedir fotos (la tarjeta de
 * "Compatibilidad") no tenga que cambiar nada.
 */
export type CastCredit = TitleCredits & {
  directorPhoto?: string | null;
  castPhotos?: (string | null)[];
  /** Título al que pertenece este crédito, para poder listar luego "en qué viste a X". */
  title?: string;
};

// Con un solo título no significa nada que "se repita" un actor o
// director: hace falta al menos 2 títulos distintos vistos este año
// para contar como un patrón real (mismo umbral que
// lib/compatibilityExtras.ts).
const MIN_REPEAT = 2;

/** De los créditos de todos los títulos vistos este año, el actor y el director que más se repiten (independientes entre sí), con la primera foto que se les encuentre. */
export function topCastHighlights(credits: CastCredit[]): CastHighlights {
  const directorCounts = new Map<string, number>();
  const castCounts = new Map<string, number>();
  const directorPhotos = new Map<string, string | null>();
  const castPhotos = new Map<string, string | null>();
  const directorTitles = new Map<string, string[]>();
  const castTitles = new Map<string, string[]>();

  function addTitle(byName: Map<string, string[]>, name: string, title?: string) {
    if (!title) return;

    const list = byName.get(name) ?? [];

    if (!list.includes(title)) {
      list.push(title);
      byName.set(name, list);
    }
  }

  for (const credit of credits) {
    if (credit.director) {
      directorCounts.set(
        credit.director,
        (directorCounts.get(credit.director) ?? 0) + 1
      );

      if (!directorPhotos.get(credit.director) && credit.directorPhoto) {
        directorPhotos.set(credit.director, credit.directorPhoto);
      }

      addTitle(directorTitles, credit.director, credit.title);
    }

    credit.cast.forEach((name, i) => {
      castCounts.set(name, (castCounts.get(name) ?? 0) + 1);

      const photo = credit.castPhotos?.[i];

      if (!castPhotos.get(name) && photo) {
        castPhotos.set(name, photo);
      }

      addTitle(castTitles, name, credit.title);
    });
  }

  const bestDirector = [...directorCounts.entries()]
    .filter(([, count]) => count >= MIN_REPEAT)
    .sort((a, b) => b[1] - a[1])[0];

  const bestActor = [...castCounts.entries()]
    .filter(([, count]) => count >= MIN_REPEAT)
    .sort((a, b) => b[1] - a[1])[0];

  return {
    actor: bestActor
      ? {
          name: bestActor[0],
          count: bestActor[1],
          photoPath: castPhotos.get(bestActor[0]) ?? null,
          titles: castTitles.get(bestActor[0]) ?? [],
        }
      : undefined,
    director: bestDirector
      ? {
          name: bestDirector[0],
          count: bestDirector[1],
          photoPath: directorPhotos.get(bestDirector[0]) ?? null,
          titles: directorTitles.get(bestDirector[0]) ?? [],
        }
      : undefined,
  };
}

export type TitleWithCount = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterUrl?: string;
  rating?: number;
  /** Cuántos usuarios DISTINTOS de la app vieron este título este año (title_watch_counts, supabase/resumen.sql). */
  watcherCount: number;
};

export type TrendyPick = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterUrl?: string;
  watcherCount: number;
};

export type HiddenGemPick = TrendyPick & { rating: number };

export type TrendyHighlights = {
  trendy?: TrendyPick;
  hiddenGem?: HiddenGemPick;
};

// Por debajo de esta nota no cuenta como "joya oculta": tiene que
// gustarte de verdad, no solo que casi nadie más la haya visto.
const MIN_HIDDEN_GEM_RATING = 4;

/** De los títulos vistos este año, el más visto por el resto de la app ("trendy") y, entre los que valoraste alto, el que menos vio nadie más ("joya oculta"). */
export function pickTrendyAndHiddenGem(
  rows: TitleWithCount[]
): TrendyHighlights {
  if (rows.length === 0) return {};

  const toPick = (row: TitleWithCount): TrendyPick => ({
    tmdbId: row.tmdbId,
    mediaType: row.mediaType,
    title: row.title,
    posterUrl: row.posterUrl,
    watcherCount: row.watcherCount,
  });

  const mostWatched = [...rows].sort(
    (a, b) => b.watcherCount - a.watcherCount
  )[0];

  // Que al menos una persona más de la app lo haya visto: si nadie más
  // vio nada de tu año, "lo más trendy que viste" no dice nada.
  const trendy =
    mostWatched.watcherCount >= 2 ? toPick(mostWatched) : undefined;

  const gemCandidates = rows.filter(
    (row) =>
      (row.rating ?? 0) >= MIN_HIDDEN_GEM_RATING &&
      !(
        trendy &&
        row.tmdbId === trendy.tmdbId &&
        row.mediaType === trendy.mediaType
      )
  );

  gemCandidates.sort(
    (a, b) =>
      a.watcherCount - b.watcherCount || (b.rating ?? 0) - (a.rating ?? 0)
  );

  const gem = gemCandidates[0];

  const hiddenGem: HiddenGemPick | undefined = gem
    ? { ...toPick(gem), rating: gem.rating as number }
    : undefined;

  return { trendy, hiddenGem };
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
  /**
   * Los de compatibilidad lista van primero (de mayor a menor);
   * detrás, los que aún no tienen suficientes valoraciones en común
   * (percent null) — se siguen mostrando (con un valor simbólico en
   * vez de ocultarlos), solo que sin poder ordenarlos entre sí.
   */
  top: { userId: string; name: string; percent: number | null }[];
};

/** Resume la compatibilidad 1:1 con cada amigo en una media de grupo + el top. */
export function summarizeGroupCompatibility(
  entries: GroupCompatInput[],
  limit = 3
): GroupCompatSummary {
  const ready = entries.filter(
    (e): e is GroupCompatInput & { percent: number } => e.percent !== null
  );
  const notReady = entries.filter((e) => e.percent === null);

  if (ready.length === 0) {
    return { groupAveragePercent: null, readyCount: 0, top: [] };
  }

  const groupAveragePercent = Math.round(
    ready.reduce((sum, e) => sum + e.percent, 0) / ready.length
  );

  const top: { userId: string; name: string; percent: number | null }[] = [
    ...ready.slice().sort((a, b) => b.percent - a.percent),
    ...notReady,
  ]
    .slice(0, limit)
    .map((e) => ({ userId: e.userId, name: e.name, percent: e.percent }));

  return { groupAveragePercent, readyCount: ready.length, top };
}

/**
 * "Dato curioso" de comparativa con el resto de la app para el Resumen
 * Anual — variante de competitiveLine (lib/summary.ts), pero para el
 * año entero del Resumen en vez del mes en curso, y sin semilla por
 * día (el Resumen se ve una vez al año, no a diario, así que no hace
 * falta variar la frase). `percentile`/`totalUsers`/`mine` vienen de
 * my_year_rank (supabase/resumen.sql, lib/supabase/summary.ts).
 */
export function yearCommunityLine(
  percentile: number,
  totalUsers: number,
  mine: number
): string | undefined {
  if (mine === 0) return undefined;

  if (totalUsers < 3) {
    return "De los primeros en tener un Resumen Anual en la app";
  }

  const clamped = Math.min(99, Math.max(1, percentile));

  return `Has visto más que el ${clamped}% de la comunidad este año`;
}
