/**
 * Resumen Anual ("Wrapped") — cálculo puro, sin React ni Supabase,
 * mismo patrón que lib/summary.ts y lib/achievements/compute.ts.
 *
 * Alcance v1: solo con datos que ya existen hoy sin pedir nada nuevo
 * por título a TMDb (nada de reparto/créditos para "tu cara
 * conocida", nada de "qué ve todo el mundo" para "trendy", nada de
 * compatibilidad de grupo) — quedan fuera a propósito para una v2,
 * cada una necesita una pieza de backend que no existe todavía (ver
 * claude/revision-web-25nov2026.md y la conversación de diseño).
 */

import { familyByKey, TIER_NAMES, type Tier } from "@/lib/achievements/catalog";
import type { WatchedRow } from "@/lib/supabase/summary";

export type GenreShare = { name: string; count: number; percent: number };

export type DayTitles = { date: string; count: number; titles: string[] };

export type MonthCount = { monthIndex: number; label: string; count: number };

export type AchievementUnlock = {
  key: string;
  // Nº crudo tal cual viene de la fila de `user_achievements` (smallint
  // 1-5): se valida/recorta a Tier dentro de achievementHighlights, no
  // aquí, para no obligar a quien llama a esta función a castear algo
  // que en origen es solo un number.
  level: number;
  unlockedAt: string;
};

export type AchievementHighlight = {
  key: string;
  familyName: string;
  tierName: string;
  level: Tier;
  unlockedAt: string;
};

export type WrappedInput = {
  year: number;
  /**
   * Historial COMPLETO (todos los años, sin el límite de 400 filas de
   * Mi Resumen): El Canon es progreso acumulado, no solo de este año,
   * así que necesita ver más atrás que el propio año del resumen.
   */
  watched: WatchedRow[];
  /** tmdbId de las películas de El Canon (data/canon/canon250.ts, resueltas por /api/canon). */
  canonIds: ReadonlySet<number>;
  /** Tamaño de El Canon (debería ser 250, pero se pasa en vez de asumirlo). */
  canonTotal: number;
  /** Todos los niveles de logro desbloqueados alguna vez (user_achievements). */
  achievementUnlocks: AchievementUnlock[];
  /** El título que lleva más tiempo en "Mi lista" ahora mismo (lib/watchlist.ts), si hay alguno. */
  pendingOldest?: { title: string; savedAt: number; poster?: string };
  /** Nº de "No me apetece" (lib/rejected.ts) descartados dentro del año del resumen. */
  rejectedThisYearCount: number;
  now?: Date;
};

export type WrappedStats = {
  year: number;
  totalWatched: number;
  movieCount: number;
  seriesCount: number;
  /** Estimación aproximada (ver AVG_MOVIE_MINUTES / AVG_SERIES_HOURS): no hay dato real de duración por título. */
  approxHours: number;
  /** Top 5 géneros del año, con el % que representan sobre el total de "etiquetas de género" del año. */
  topGenres: GenreShare[];
  monthlyCounts: MonthCount[];
  peakMonth?: MonthCount;
  /** Racha más larga de días seguidos viendo algo DENTRO del año del resumen. */
  longestStreak: number;
  peakDay?: DayTitles;
  /** Películas de El Canon vistas dentro de este año en concreto. */
  canonThisYear: number;
  /** Progreso acumulado de siempre (no solo este año). */
  canonTotalProgress: number;
  canonTotal: number;
  /** Hasta 3 niveles de logro desbloqueados este año, más reciente primero. */
  achievementsThisYear: AchievementHighlight[];
  /** Total de niveles desbloqueados de siempre (para "llevas X logros en total"). */
  achievementsTotalUnlocked: number;
  oldestPendingTitle?: string;
  /** Meses que lleva ese título en "Mi lista" sin verse. */
  oldestPendingMonths?: number;
  /** Póster (tal cual se guardó en "Mi lista", lib/watchlist.ts) de ese título, si lo tiene. */
  oldestPendingPosterUrl?: string;
  rejectedThisYearCount: number;
  lastOfYear?: WatchedRow;
};

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

// Ninguna fila de `watched` guarda la duración real del título (ni
// tampoco cuántos episodios de una serie se vieron: una fila = una
// serie marcada como vista, sea cual sea su duración real). Son
// medias razonables para dar una cifra orientativa, no un dato exacto
// — el copy de la pantalla debe dejarlo claro ("aprox").
const AVG_MOVIE_MINUTES = 110;
const AVG_SERIES_HOURS = 8;

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

function rowsInYear(rows: WatchedRow[], year: number): WatchedRow[] {
  return rows.filter((row) => new Date(row.seenAt).getFullYear() === year);
}

function genreShares(rows: WatchedRow[], limit = 5): GenreShare[] {
  const counts = new Map<string, number>();
  let total = 0;

  for (const row of rows) {
    for (const genre of row.genres) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
      total++;
    }
  }

  if (total === 0) return [];

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / total) * 100),
    }));
}

function buildMonthlyCounts(rows: WatchedRow[], year: number): MonthCount[] {
  const counts = new Array(12).fill(0);

  for (const row of rows) {
    const d = new Date(row.seenAt);
    if (d.getFullYear() !== year) continue;
    counts[d.getMonth()]++;
  }

  return counts.map((count, monthIndex) => ({
    monthIndex,
    label: MONTH_NAMES[monthIndex],
    count,
  }));
}

function peakMonthOf(monthly: MonthCount[]): MonthCount | undefined {
  const best = monthly.reduce(
    (max, m) => (m.count > max.count ? m : max),
    monthly[0]
  );

  return best && best.count > 0 ? best : undefined;
}

/** Racha de días consecutivos más larga dentro de las filas dadas (no "hasta hoy", la mejor racha de todo el año). */
function longestStreakOf(rows: WatchedRow[]): number {
  const days = [...new Set(rows.map((row) => dateKey(new Date(row.seenAt))))]
    .map((key) => new Date(key).getTime())
    .sort((a, b) => a - b);

  if (days.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let i = 1; i < days.length; i++) {
    const diffDays = Math.round((days[i] - days[i - 1]) / 86_400_000);

    current = diffDays === 1 ? current + 1 : 1;
    best = Math.max(best, current);
  }

  return best;
}

function peakDayOf(rows: WatchedRow[]): DayTitles | undefined {
  const byDay = new Map<string, string[]>();

  for (const row of rows) {
    const key = dateKey(new Date(row.seenAt));
    const titles = byDay.get(key) ?? [];
    titles.push(row.title);
    byDay.set(key, titles);
  }

  let best: DayTitles | undefined;

  for (const [date, titles] of byDay.entries()) {
    if (titles.length < 2) continue; // un "pico" de 1 título no cuenta nada especial
    if (!best || titles.length > best.count) {
      best = { date, count: titles.length, titles };
    }
  }

  return best;
}

function lastOfYear(rows: WatchedRow[]): WatchedRow | undefined {
  return [...rows].sort(
    (a, b) => new Date(b.seenAt).getTime() - new Date(a.seenAt).getTime()
  )[0];
}

function canonProgress(
  allWatched: WatchedRow[],
  canonIds: ReadonlySet<number>,
  year: number
): { thisYear: number; total: number } {
  const movies = allWatched.filter((row) => row.mediaType === "movie");

  let total = 0;
  let thisYear = 0;

  for (const movie of movies) {
    if (!canonIds.has(movie.tmdbId)) continue;

    total++;

    if (new Date(movie.seenAt).getFullYear() === year) thisYear++;
  }

  return { thisYear, total };
}

function achievementHighlights(
  unlocks: AchievementUnlock[],
  year: number,
  limit = 3
): AchievementHighlight[] {
  return unlocks
    .filter(
      (u) => u.level >= 1 && new Date(u.unlockedAt).getFullYear() === year
    )
    .sort(
      (a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
    )
    .map((u): AchievementHighlight | undefined => {
      const family = familyByKey(u.key);
      if (!family) return undefined;

      return {
        key: u.key,
        familyName: family.name,
        tierName: TIER_NAMES[u.level - 1],
        level: u.level as Tier,
        unlockedAt: u.unlockedAt,
      };
    })
    .filter((h): h is AchievementHighlight => h !== undefined)
    .slice(0, limit);
}

function monthsSince(savedAt: number, now: Date): number {
  const diffMs = now.getTime() - savedAt;

  return Math.max(0, Math.floor(diffMs / (30 * 86_400_000)));
}

/** Construye todas las estadísticas del Resumen Anual a partir del historial y lo demás ya traído. */
export function buildWrapped(input: WrappedInput): WrappedStats {
  const now = input.now ?? new Date();
  const yearRows = rowsInYear(input.watched, input.year);

  const movieCount = yearRows.filter((r) => r.mediaType === "movie").length;
  const seriesCount = yearRows.filter((r) => r.mediaType === "tv").length;

  const approxHours = Math.round(
    (movieCount * AVG_MOVIE_MINUTES) / 60 + seriesCount * AVG_SERIES_HOURS
  );

  const monthlyCounts = buildMonthlyCounts(yearRows, input.year);
  const canon = canonProgress(input.watched, input.canonIds, input.year);

  return {
    year: input.year,
    totalWatched: yearRows.length,
    movieCount,
    seriesCount,
    approxHours,
    topGenres: genreShares(yearRows),
    monthlyCounts,
    peakMonth: peakMonthOf(monthlyCounts),
    longestStreak: longestStreakOf(yearRows),
    peakDay: peakDayOf(yearRows),
    canonThisYear: canon.thisYear,
    canonTotalProgress: canon.total,
    canonTotal: input.canonTotal,
    achievementsThisYear: achievementHighlights(
      input.achievementUnlocks,
      input.year
    ),
    achievementsTotalUnlocked: input.achievementUnlocks.length,
    oldestPendingTitle: input.pendingOldest?.title,
    oldestPendingMonths: input.pendingOldest
      ? monthsSince(input.pendingOldest.savedAt, now)
      : undefined,
    oldestPendingPosterUrl: input.pendingOldest?.poster,
    rejectedThisYearCount: input.rejectedThisYearCount,
    lastOfYear: lastOfYear(yearRows),
  };
}
