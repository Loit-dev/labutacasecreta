import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { dateInputToISO, isoToDateInput, todayDateInput } from "@/lib/dateInput";

describe("fecha del selector \"¿cuándo la viste?\"", () => {
  test("todayDateInput da YYYY-MM-DD de hoy", () => {
    const value = todayDateInput();

    assert.match(value, /^\d{4}-\d{2}-\d{2}$/);

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const expected = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    assert.equal(value, expected);
  });

  test("dateInputToISO conserva el mismo día en calendario local", () => {
    const iso = dateInputToISO("2026-03-15");

    const parsed = new Date(iso);

    assert.equal(parsed.getFullYear(), 2026);
    assert.equal(parsed.getMonth(), 2); // marzo = índice 2
    assert.equal(parsed.getDate(), 15);
  });

  test("dateInputToISO produce un ISO válido y parseable", () => {
    const iso = dateInputToISO("2025-12-31");

    assert.doesNotThrow(() => new Date(iso).toISOString());
    assert.ok(!Number.isNaN(new Date(iso).getTime()));
  });

  test("isoToDateInput es el inverso de dateInputToISO", () => {
    for (const value of ["2026-01-01", "2026-06-15", "2026-12-31"]) {
      assert.equal(isoToDateInput(dateInputToISO(value)), value);
    }
  });
});
