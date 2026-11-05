/**
 * Cálculo puro del estado de logros, sin React ni Supabase (mismo
 * patrón que lib/compatibility.ts y lib/summary.ts), a partir de datos
 * ya traídos del servidor. La detección es perezosa: esta función se
 * llama cada vez que se abre el perfil/pantalla de logros, nunca en
 * segundo plano (ver claude/sistema-logros.md).
 */

import type { Rating } from "@/lib/rating";
import {
  ALL_FAMILIES,
  GENERAL_FAMILIES,
  GENRE_FAMILIES,
  SEASONAL_ACHIEVEMENTS,
  type Tier,
} from "./catalog";
import { isKnownChristmasTitle } from "./christmasTitles";

/**
 * Proyección mínima de `watched` para calcular logros: a diferencia
 * de WatchedRow (lib/supabase/summary.ts, limitado a 400 filas "de
 * sobra" para Mi Resumen), aquí hace falta el historial COMPLETO sin
 * límite — varios umbrales (Total visto hasta 1000, géneros hasta
 * 150...) superan ese límite, así que usar el historial recortado
 * haría que esos niveles nunca se pudiesen alcanzar.
 */
export type AchievementWatchedRow = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  rating?: Rating;
  genres: string[];
  seenAt: string;
  /** Media de TMDb (0-10) en el momento de verla. Ausente en filas guardadas antes de añadir esta columna. */
  tmdbVoteAverage?: number;
};

export type AchievementProgress = {
  key: string;
  level: Tier; // 0 = sin empezar
  value: number; // valor actual de la métrica
  nextThreshold?: number; // umbral del siguiente nivel, si queda alguno
};

export type SeasonalProgress = {
  key: string;
  unlocked: boolean;
  /** true si estamos dentro de la ventana de fechas ahora mismo. */
  windowOpen: boolean;
};

export type AchievementsInput = {
  /** Historial completo de "vistos" (ver AchievementWatchedRow). */
  watched: AchievementWatchedRow[];
  friendsCount: number;
  /** Nº de amigos con los que la compatibilidad ya calculada llega a ≥80%. */
  compatibleFriendsCount: number;
  listsCount: number;
  recommendationsSentCount: number;
  shareEventsCount: number;
  now?: Date;
};

function dateKeyDay(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Más títulos vistos en un único día, en todo el historial dado. */
function maxDailyVolume(rows: AchievementWatchedRow[]): number {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const key = dateKeyDay(new Date(row.seenAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts.size === 0 ? 0 : Math.max(...counts.values());
}

/** Días seguidos (hasta hoy o ayer) con algo visto — igual criterio que Mi Resumen. */
function currentStreak(rows: AchievementWatchedRow[], now: Date): number {
  const days = new Set(rows.map((row) => dateKeyDay(new Date(row.seenAt))));

  if (days.size === 0) return 0;

  const cursor = new Date(now);

  if (!days.has(dateKeyDay(cursor))) {
    cursor.setDate(cursor.getDate() - 1);

    if (!days.has(dateKeyDay(cursor))) return 0;
  }

  let streak = 0;

  while (days.has(dateKeyDay(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function levelFor(value: number, thresholds: readonly number[]): Tier {
  let level = 0;

  for (const threshold of thresholds) {
    if (value >= threshold) level++;
  }

  return level as Tier;
}

function nextThresholdFor(
  value: number,
  thresholds: readonly number[]
): number | undefined {
  return thresholds.find((t) => value < t);
}

function monthDayNumber(month: number, day: number): number {
  return month * 100 + day;
}

function isWithinWindow(
  date: Date,
  window: { startMonth: number; startDay: number; endMonth: number; endDay: number }
): boolean {
  const md = monthDayNumber(date.getMonth() + 1, date.getDate());
  const start = monthDayNumber(window.startMonth, window.startDay);
  const end = monthDayNumber(window.endMonth, window.endDay);

  return start <= end ? md >= start && md <= end : md >= start || md <= end;
}

export type AchievementsState = {
  general: AchievementProgress[];
  genero: AchievementProgress[];
  seasonal: SeasonalProgress[];
  /** Total de familias con algún nivel conseguido (para el "X de 33"). */
  startedCount: number;
  totalFamilies: number;
};

export function computeAchievements(input: AchievementsInput): AchievementsState {
  const now = input.now ?? new Date();
  const rated = input.watched.filter((r) => r.rating !== undefined);
  const lowRated = rated.filter((r) => (r.rating ?? 0) <= 2);

  // "Nota media": veces que mi nota queda ≥1 punto por debajo de la
  // media de TMDb para ese título, en la misma escala 1-5 (TMDb usa
  // 0-10, así que se divide entre 2). Solo cuenta sobre títulos
  // vistos DESPUÉS de que se empezó a guardar tmdbVoteAverage — los
  // anteriores no tienen ese dato y se ignoran (ver limitación en
  // claude/sistema-logros.md).
  const belowAverageCount = rated.filter((r) => {
    const avg = r.tmdbVoteAverage;
    if (avg === undefined || avg === null) return false;
    return (r.rating ?? 0) <= avg / 2 - 1;
  }).length;

  const genreCounts = new Map<string, number>();
  for (const row of input.watched) {
    for (const genre of row.genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
  }

  const metricByKey: Record<string, number> = {
    volumen_diario: maxDailyVolume(input.watched),
    total_visto: input.watched.length,
    racha: currentStreak(input.watched, now),
    valoraciones: rated.length,
    valoraciones_bajas: lowRated.length,
    nota_media: belowAverageCount,
    generos_vistos: genreCounts.size,
    amigos: input.friendsCount,
    compatibilidad: input.compatibleFriendsCount,
    compartir: input.shareEventsCount,
    recomendaciones: input.recommendationsSentCount,
    listas_creadas: input.listsCount,
  };

  const general: AchievementProgress[] = GENERAL_FAMILIES.map((f) => {
    const value = metricByKey[f.key] ?? 0;
    return {
      key: f.key,
      level: levelFor(value, f.thresholds),
      value,
      nextThreshold: nextThresholdFor(value, f.thresholds),
    };
  });

  const genero: AchievementProgress[] = GENRE_FAMILIES.map((f) => {
    const value = genreCounts.get(f.name) ?? 0;
    return {
      key: f.key,
      level: levelFor(value, f.thresholds),
      value,
      nextThreshold: nextThresholdFor(value, f.thresholds),
    };
  });

  const seasonal: SeasonalProgress[] = SEASONAL_ACHIEVEMENTS.map((s) => {
    const windowOpen = isWithinWindow(now, s.window);

    const unlocked = input.watched.some((row) => {
      const seenAt = new Date(row.seenAt);
      if (!isWithinWindow(seenAt, s.window)) return false;

      if (s.requiresKnownTitles) {
        return isKnownChristmasTitle(row.tmdbId, row.mediaType);
      }

      return s.genre ? row.genres.includes(s.genre) : true;
    });

    return { key: s.key, unlocked, windowOpen };
  });

  const startedCount =
    general.filter((p) => p.level > 0).length +
    genero.filter((p) => p.level > 0).length +
    seasonal.filter((p) => p.unlocked).length;

  return {
    general,
    genero,
    seasonal,
    startedCount,
    totalFamilies: ALL_FAMILIES.length + SEASONAL_ACHIEVEMENTS.length,
  };
}

/**
 * Compara el estado actual con los niveles ya guardados en BD y
 * devuelve solo los niveles NUEVOS (para insertarlos y para el toast
 * de desbloqueo). `storedLevels` es el nivel máximo ya registrado por
 * familia (0 si nunca se guardó nada).
 */
export function diffNewLevels(
  state: AchievementsState,
  storedLevels: Record<string, number>
): { key: string; level: Tier }[] {
  const result: { key: string; level: Tier }[] = [];

  for (const p of [...state.general, ...state.genero]) {
    const stored = storedLevels[p.key] ?? 0;
    for (let lvl = stored + 1; lvl <= p.level; lvl++) {
      result.push({ key: p.key, level: lvl as Tier });
    }
  }

  return result;
}
