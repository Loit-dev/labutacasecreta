import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { dayRange, summarize } from "@/lib/usage";

describe("panel de uso", () => {
  test("dayRange cuenta hacia atrás e incluye hoy", () => {
    assert.deepEqual(dayRange("2026-03-01", 3), [
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
    ]);
  });

  test("totales, periodo anterior, días y eventos sin uso", () => {
    const totals = summarize(
      [
        { day: "2026-11-28", name: "lists_open", count: 5 },
        { day: "2026-11-27", name: "lists_open", count: 2 },
        // periodo anterior (7 días antes)
        { day: "2026-11-20", name: "lists_open", count: 4 },
        // fuera de los dos periodos: no cuenta
        { day: "2026-10-01", name: "lists_open", count: 99 },
        { day: "2026-11-25", name: "search_open", count: 1 },
      ],
      ["lists_open", "search_open", "trailer_open"],
      "2026-11-28",
      7
    );

    assert.deepEqual(
      totals.map((t) => [t.name, t.total, t.previous]),
      [
        ["lists_open", 7, 4],
        ["search_open", 1, 0],
        ["trailer_open", 0, 0],
      ]
    );

    assert.equal(totals[0].daily.length, 7);
    assert.deepEqual(totals[0].daily.slice(-2), [2, 5]);
  });
});
