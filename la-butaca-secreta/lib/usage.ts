// Cálculos del panel /admin/uso (puros, para poder probarlos).

export type UsageRow = { day: string; name: string; count: number };

export type UsageTotal = {
  name: string;
  total: number;
  // Total del periodo anterior de la misma duración (para la tendencia)
  previous: number;
  // Un valor por día del periodo, del más antiguo al más reciente
  daily: number[];
};

/** Días (AAAA-MM-DD) desde hace `days - 1` días hasta `today`, en orden. */
export function dayRange(today: string, days: number): string[] {
  const end = new Date(`${today}T00:00:00Z`);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (days - 1 - index));
    return date.toISOString().slice(0, 10);
  });
}

/**
 * Totales por evento en los últimos `days` días, con el periodo anterior
 * para comparar. `rows` debe cubrir 2 × `days` días. Incluye con 0 los
 * eventos conocidos que no se han usado.
 */
export function summarize(
  rows: UsageRow[],
  knownNames: string[],
  today: string,
  days: number
): UsageTotal[] {
  const current = dayRange(today, days);
  const previous = new Set(dayRange(current[0], days + 1).slice(0, days));
  const index = new Map(current.map((day, i) => [day, i]));

  const totals = new Map<string, UsageTotal>();

  const get = (name: string) => {
    let total = totals.get(name);

    if (!total) {
      total = { name, total: 0, previous: 0, daily: current.map(() => 0) };
      totals.set(name, total);
    }

    return total;
  };

  for (const name of knownNames) get(name);

  for (const row of rows) {
    const total = get(row.name);
    const i = index.get(row.day);

    if (i !== undefined) {
      total.total += row.count;
      total.daily[i] += row.count;
    } else if (previous.has(row.day)) {
      total.previous += row.count;
    }
  }

  return [...totals.values()].sort(
    (a, b) => b.total - a.total || a.name.localeCompare(b.name)
  );
}
