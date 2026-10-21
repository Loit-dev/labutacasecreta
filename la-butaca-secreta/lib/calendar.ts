/**
 * Calendario de estrenos: utilidades puras (fechas, rejilla del mes y
 * agrupación por día). Sin React ni red, para poder probarlas.
 */

import type { PlatformKey } from "./platforms";

export type CalendarEntry = {
  id: number;
  type: "movie" | "tv";
  title: string;
  // Día de estreno, «AAAA-MM-DD»
  date: string;
  poster: string | null;
  overview: string;
  rating: number;
  popularity: number;
  platforms: PlatformKey[];
};

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** «2026-10» válido (entre 2015 y 2040), o null. */
export function parseMonth(value: string | null | undefined) {
  const match = value ? MONTH_RE.exec(value) : null;

  if (!match) return null;

  const year = Number(match[1]);

  if (year < 2015 || year > 2040) return null;

  return { year, month: Number(match[2]), key: value as string };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Primer y último día del mes: «AAAA-MM-01» y «AAAA-MM-31». */
export function monthRange(year: number, month: number) {
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`,
  };
}

/** Mes anterior o siguiente en formato «AAAA-MM». */
export function shiftMonth(key: string, delta: number) {
  const parsed = parseMonth(key);

  if (!parsed) return key;

  const date = new Date(
    Date.UTC(parsed.year, parsed.month - 1 + delta, 1)
  );

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

/** Rejilla del mes, semanas de lunes a domingo; null = hueco. */
export function buildMonthGrid(
  year: number,
  month: number
): (string | null)[][] {
  const total = daysInMonth(year, month);

  // getUTCDay: 0 = domingo; pasamos a 0 = lunes
  const offset =
    (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;

  const cells: (string | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from(
      { length: total },
      (_, i) => `${year}-${pad(month)}-${pad(i + 1)}`
    ),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];

  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

/**
 * Junta los estrenos por día. Un mismo título en varias plataformas
 * se une en una sola entrada; dentro de cada día, lo más popular primero.
 */
export function groupByDay(
  entries: CalendarEntry[]
): Record<string, CalendarEntry[]> {
  const merged = new Map<string, CalendarEntry>();

  for (const entry of entries) {
    const key = `${entry.date}|${entry.type}|${entry.id}`;
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, { ...entry, platforms: [...entry.platforms] });
      continue;
    }

    for (const platform of entry.platforms) {
      if (!existing.platforms.includes(platform)) {
        existing.platforms.push(platform);
      }
    }
  }

  const days: Record<string, CalendarEntry[]> = {};

  for (const entry of merged.values()) {
    (days[entry.date] ??= []).push(entry);
  }

  for (const list of Object.values(days)) {
    list.sort((a, b) => b.popularity - a.popularity);
  }

  return days;
}

/** Plataformas con estrenos ese día (sin repetir, en orden fijo). */
export function platformsOfDay(
  entries: readonly CalendarEntry[] | undefined,
  order: readonly PlatformKey[]
): PlatformKey[] {
  if (!entries?.length) return [];

  return order.filter((key) =>
    entries.some((entry) => entry.platforms.includes(key))
  );
}
