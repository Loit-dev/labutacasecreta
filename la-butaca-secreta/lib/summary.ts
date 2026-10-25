/**
 * Fase 4: "Mi Resumen" — cálculo puro (sin React ni Supabase) a partir
 * del historial de "vistos" (lib/supabase/summary.ts), para poder
 * probarlo sin depender del navegador ni de la red.
 */

import type { Rating } from "@/lib/rating";
import type { WatchedRow } from "@/lib/supabase/summary";

export type DailyCount = { date: string; count: number };

export type TitleStat = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  rating?: Rating;
  seenAt: string;
};

export type GenreStat = { name: string; count: number };

export type SummaryStats = {
  totalWatched: number;
  // 14 días, de más antiguo a más reciente, con huecos en 0
  last14: DailyCount[];
  monthCount: number;
  isPersonalRecordMonth: boolean;
  // Días seguidos (hasta hoy o ayer) viendo algo
  streakDays: number;
  previousMonthCount: number;
  previousMonthLabel: string;
  // monthCount - previousMonthCount
  monthDiff: number;
  // 🥉/🥈/🥇 según el volumen del mes, o nada si es poco
  monthBadge?: string;
  lastWatched?: TitleStat;
  bestRated?: TitleStat;
  topGenre?: GenreStat;
  leastGenre?: GenreStat;
  // Top 3 géneros del historial, de más a menos visto
  topGenres: GenreStat[];
  // Media de tus propias valoraciones (1-5), si has valorado algo
  averageRating?: number;
  headline: string;
  monthLabel: string;
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

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);

  return Math.floor(
    (d.getTime() - start.getTime()) / 86_400_000
  );
}

function sameMonth(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth()
  );
}

function last14Days(
  rows: WatchedRow[],
  now: Date
): DailyCount[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const key = dateKey(new Date(row.seenAt));

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const days: DailyCount[] = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);

    d.setDate(d.getDate() - i);

    const key = dateKey(d);

    days.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return days;
}

function toTitleStat(row: WatchedRow): TitleStat {
  return {
    tmdbId: row.tmdbId,
    mediaType: row.mediaType,
    title: row.title,
    rating: row.rating,
    seenAt: row.seenAt,
  };
}

/** Género más y menos visto, a partir de las etiquetas guardadas en `watched`. */
function genreStats(
  rows: WatchedRow[]
): { top?: GenreStat; least?: GenreStat; topThree: GenreStat[] } {
  const counts = new Map<string, number>();

  for (const row of rows) {
    for (const genre of row.genres) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }

  if (counts.size === 0) return { topThree: [] };

  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const top = sorted[0];
  const topThree = sorted.slice(0, 3);

  // Solo tiene sentido un "menos favorito" distinto si hay más de un
  // género con historial (si no, sería el mismo que el favorito).
  if (sorted.length < 2) return { top, topThree };

  const least = sorted[sorted.length - 1];

  return { top, least, topThree };
}

/** Días seguidos (hasta hoy, o hasta ayer si hoy aún no hay nada) con algo visto. */
function currentStreak(rows: WatchedRow[], now: Date): number {
  const days = new Set(rows.map((row) => dateKey(new Date(row.seenAt))));

  if (days.size === 0) return 0;

  const cursor = new Date(now);

  if (!days.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);

    if (!days.has(dateKey(cursor))) return 0;
  }

  let streak = 0;

  while (days.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * La medalla compara el mes actual con los meses anteriores del
 * propio historial (no con un umbral fijo de títulos vistos):
 * 🥇 iguala o supera el mejor mes anterior, 🥈 mejora (o iguala) el
 * mes pasado sin llegar a ser el mejor de todos, 🥉 cualquier otro
 * mes con algo visto. Sin meses anteriores con los que comparar, un
 * primer mes con actividad ya es 🥉.
 */
function monthBadgeFor(
  count: number,
  previousMonthCount: number,
  priorMonthCounts: Map<string, number>
): string | undefined {
  if (count === 0) return undefined;

  const priorValues = [...priorMonthCounts.values()];

  if (priorValues.length === 0) return "🥉";

  const bestPriorMonth = Math.max(...priorValues);

  if (count >= bestPriorMonth) return "🥇";
  if (count >= previousMonthCount) return "🥈";

  return "🥉";
}

function pickHeadline(opts: {
  now: Date;
  last7: number;
  isRecord: boolean;
}): string {
  if (opts.isRecord) return "Récord personal este mes";

  if (opts.last7 >= 4) return "Tu semana en modo maratón";

  const month = MONTH_NAMES[opts.now.getMonth()];
  const capMonth = month.charAt(0).toUpperCase() + month.slice(1);

  const alt = [`${capMonth} de cine`, "Así va tu mes"];

  return alt[dayOfYear(opts.now) % alt.length];
}

/** Construye todas las estadísticas de "Mi Resumen" a partir del historial. */
export function buildSummary(
  rows: WatchedRow[],
  now: Date = new Date()
): SummaryStats {
  const sorted = [...rows].sort(
    (a, b) =>
      new Date(b.seenAt).getTime() - new Date(a.seenAt).getTime()
  );

  const monthCount = sorted.filter((row) =>
    sameMonth(new Date(row.seenAt), now)
  ).length;

  // Récord personal: este mes supera a cada uno de los meses
  // anteriores con historial (si no hay ninguno anterior, no cuenta
  // como "récord", solo como "primer mes").
  const priorMonthCounts = new Map<string, number>();

  for (const row of sorted) {
    const d = new Date(row.seenAt);

    if (sameMonth(d, now)) continue;

    const key = `${d.getFullYear()}-${d.getMonth()}`;

    priorMonthCounts.set(key, (priorMonthCounts.get(key) ?? 0) + 1);
  }

  const isPersonalRecordMonth =
    priorMonthCounts.size > 0 &&
    monthCount > Math.max(...priorMonthCounts.values());

  const last14 = last14Days(sorted, now);

  const last7 = last14.slice(7).reduce((sum, d) => sum + d.count, 0);

  const bestRated = sorted
    .filter((row) => row.rating !== undefined)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];

  const { top, least, topThree } = genreStats(sorted);

  const ratedRows = sorted.filter(
    (row) => row.rating !== undefined
  ) as (WatchedRow & { rating: Rating })[];

  const averageRating =
    ratedRows.length > 0
      ? Math.round(
          (ratedRows.reduce((sum, row) => sum + row.rating, 0) /
            ratedRows.length) *
            10
        ) / 10
      : undefined;

  const month = MONTH_NAMES[now.getMonth()];

  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const previousMonthCount = sorted.filter((row) =>
    sameMonth(new Date(row.seenAt), previousMonthDate)
  ).length;

  const previousMonthName = MONTH_NAMES[previousMonthDate.getMonth()];

  return {
    totalWatched: sorted.length,
    last14,
    monthCount,
    isPersonalRecordMonth,
    streakDays: currentStreak(sorted, now),
    previousMonthCount,
    previousMonthLabel:
      previousMonthName.charAt(0).toUpperCase() + previousMonthName.slice(1),
    monthDiff: monthCount - previousMonthCount,
    monthBadge: monthBadgeFor(monthCount, previousMonthCount, priorMonthCounts),
    lastWatched: sorted[0] ? toTitleStat(sorted[0]) : undefined,
    bestRated: bestRated ? toTitleStat(bestRated) : undefined,
    topGenre: top,
    leastGenre: least,
    topGenres: topThree,
    averageRating,
    headline: pickHeadline({ now, last7, isRecord: isPersonalRecordMonth }),
    monthLabel: month.charAt(0).toUpperCase() + month.slice(1),
  };
}

/**
 * El "claim" competitivo que se comparte ("has visto más que el X %
 * de la gente…"). Solo hace falta que el usuario haya visto algo
 * este mes: con pocas cuentas todavía (la app recién lanzada) usa un
 * texto que no depende de un porcentaje, para no decir "más que el
 * 100 %" con una sola cuenta de muestra. Varía la frase día a día
 * (varias plantillas) para que no sea siempre el mismo "claim".
 */
export function competitiveLine(
  percentile: number,
  totalUsers: number,
  mine: number,
  now: Date = new Date()
): string | undefined {
  if (mine === 0) return undefined;

  const seed = dayOfYear(now);

  if (totalUsers < 3) {
    const early = [
      "Entre los primeros en estrenar Mi Resumen 🎬",
      "Pionero de La Butaca Secreta este mes",
      "Abriendo camino en Mi Resumen",
    ];

    return early[seed % early.length];
  }

  const clamped = Math.min(99, Math.max(1, percentile));
  const inverse = Math.max(1, 100 - clamped);

  const templates = [
    `Has visto más que el ${clamped} % de la gente este mes`,
    `Estás en el ${clamped} % que más ve este mes`,
    `Solo un ${inverse} % ve tanto como tú este mes`,
    `${clamped} de cada 100 usuarios ven menos que tú`,
  ];

  return templates[seed % templates.length];
}
