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
  lastWatched?: TitleStat;
  bestRated?: TitleStat;
  topGenre?: GenreStat;
  leastGenre?: GenreStat;
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
): { top?: GenreStat; least?: GenreStat } {
  const counts = new Map<string, number>();

  for (const row of rows) {
    for (const genre of row.genres) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }

  if (counts.size === 0) return {};

  const sorted = [...counts.entries()].sort(
    (a, b) => b[1] - a[1]
  );

  const top: GenreStat = { name: sorted[0][0], count: sorted[0][1] };

  // Solo tiene sentido un "menos favorito" distinto si hay más de un
  // género con historial (si no, sería el mismo que el favorito).
  if (sorted.length < 2) return { top };

  const [name, count] = sorted[sorted.length - 1];

  return { top, least: { name, count } };
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

  const { top, least } = genreStats(sorted);

  const month = MONTH_NAMES[now.getMonth()];

  return {
    totalWatched: sorted.length,
    last14,
    monthCount,
    isPersonalRecordMonth,
    lastWatched: sorted[0] ? toTitleStat(sorted[0]) : undefined,
    bestRated: bestRated ? toTitleStat(bestRated) : undefined,
    topGenre: top,
    leastGenre: least,
    headline: pickHeadline({ now, last7, isRecord: isPersonalRecordMonth }),
    monthLabel: month.charAt(0).toUpperCase() + month.slice(1),
  };
}

/**
 * "Has visto más que el X % de la gente este mes": solo se muestra
 * con una muestra mínima de cuentas y si el usuario ha visto algo,
 * para no mostrar un porcentaje sin sentido con pocos datos.
 */
export function competitiveLine(
  percentile: number,
  totalUsers: number,
  mine: number
): string | undefined {
  if (mine === 0 || totalUsers < 5) return undefined;

  const clamped = Math.min(99, Math.max(1, percentile));

  return `Has visto más que el ${clamped} % de la gente este mes`;
}
