import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  buildMonthGrid,
  daysInMonth,
  groupByDay,
  mergeSources,
  monthRange,
  parseMonth,
  platformsOfDay,
  shiftMonth,
  type CalendarEntry,
} from "@/lib/calendar";

function entry(over: Partial<CalendarEntry>): CalendarEntry {
  return {
    id: 1,
    type: "tv",
    title: "Título",
    date: "2026-10-21",
    poster: null,
    overview: "",
    rating: 7,
    popularity: 10,
    platforms: ["netflix"],
    ...over,
  };
}

describe("calendario", () => {
  test("valida el mes", () => {
    assert.equal(parseMonth("2026-10")?.month, 10);
    assert.equal(parseMonth("2026-13"), null);
    assert.equal(parseMonth("2026-1"), null);
    assert.equal(parseMonth("1999-01"), null);
    assert.equal(parseMonth(null), null);
  });

  test("días del mes y rango, con bisiestos", () => {
    assert.equal(daysInMonth(2026, 10), 31);
    assert.equal(daysInMonth(2028, 2), 29);
    assert.equal(daysInMonth(2026, 2), 28);

    assert.deepEqual(monthRange(2026, 2), {
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });

  test("cambia de mes pasando de año", () => {
    assert.equal(shiftMonth("2026-12", 1), "2027-01");
    assert.equal(shiftMonth("2026-01", -1), "2025-12");
    assert.equal(shiftMonth("2026-10", 0), "2026-10");
  });

  test("la rejilla empieza en lunes y completa semanas", () => {
    // 1 de octubre de 2026 es jueves
    const weeks = buildMonthGrid(2026, 10);

    assert.ok(weeks.every((week) => week.length === 7));
    assert.deepEqual(weeks[0].slice(0, 4), [null, null, null, "2026-10-01"]);

    const days = weeks.flat().filter(Boolean);

    assert.equal(days.length, 31);
    assert.equal(days[30], "2026-10-31");
  });

  test("agrupa por día, une plataformas y ordena por popularidad", () => {
    const days = groupByDay([
      entry({ id: 1, popularity: 5, platforms: ["netflix"] }),
      entry({ id: 1, popularity: 5, platforms: ["max"] }),
      entry({ id: 2, popularity: 50, platforms: ["disney"] }),
      entry({ id: 3, date: "2026-10-22" }),
    ]);

    assert.deepEqual(Object.keys(days).sort(), [
      "2026-10-21",
      "2026-10-22",
    ]);

    const day = days["2026-10-21"];

    assert.deepEqual(day.map((e) => e.id), [2, 1]);
    assert.deepEqual(day[1].platforms, ["netflix", "max"]);
  });

  test("una película y una serie con el mismo id no se mezclan", () => {
    const days = groupByDay([
      entry({ id: 7, type: "movie" }),
      entry({ id: 7, type: "tv" }),
    ]);

    assert.equal(days["2026-10-21"].length, 2);
  });

  test("plataformas del día, en orden fijo y sin repetir", () => {
    const list = [
      entry({ platforms: ["max", "netflix"] }),
      entry({ platforms: ["netflix"] }),
    ];

    assert.deepEqual(
      platformsOfDay(list, ["netflix", "prime", "disney", "max", "filmin"]),
      ["netflix", "max"]
    );

    assert.deepEqual(platformsOfDay(undefined, ["netflix"]), []);
  });

  test("mezcla fuentes: mismo día = confirmado", () => {
    const merged = mergeSources(
      [entry({ id: 1, date: "2026-10-21", platforms: ["netflix"] })],
      [entry({ id: 1, date: "2026-10-21", platforms: ["netflix"], note: "Nueva temporada (2)" })]
    );

    assert.equal(merged.length, 1);
    assert.equal(merged[0].confirmed, true);
    assert.equal(merged[0].note, "Nueva temporada (2)");
  });

  test("mezcla fuentes: distinto día = manda TVmaze y no se confirma", () => {
    const merged = mergeSources(
      [entry({ id: 1, date: "2026-10-20" })],
      [entry({ id: 1, date: "2026-10-22" })]
    );

    assert.equal(merged.length, 1);
    assert.equal(merged[0].date, "2026-10-22");
    assert.equal(merged[0].confirmed, false);
  });

  test("mezcla fuentes: lo que solo conoce TVmaze se añade, y lo de TMDb se queda", () => {
    const merged = mergeSources(
      [entry({ id: 1 })],
      [entry({ id: 2, note: "Nueva temporada (4)" })]
    );

    assert.deepEqual(
      merged.map((e) => e.id).sort(),
      [1, 2]
    );

    assert.equal(merged.find((e) => e.id === 1)?.confirmed, undefined);
  });

  test("mezcla fuentes: se unen las plataformas del mismo título", () => {
    const merged = mergeSources(
      [
        entry({ id: 1, platforms: ["netflix"] }),
        entry({ id: 1, platforms: ["max"] }),
      ],
      [entry({ id: 1, platforms: ["prime"] })]
    );

    assert.equal(merged.length, 1);
    assert.deepEqual(merged[0].platforms.sort(), ["max", "netflix", "prime"]);
  });
});
