import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { IMPORTADOS } from "@/data/calendar/decine21";
import { ALL_PLATFORM_KEYS } from "@/lib/platforms";

describe("estrenos importados de decine21", () => {
  test("campos válidos", () => {
    assert.ok(IMPORTADOS.length > 0);

    for (const item of IMPORTADOS) {
      assert.match(item.date, /^2026-(10|11)-\d{2}$/);
      assert.ok(["movie", "tv"].includes(item.type));
      assert.ok(item.query.trim().length > 0, item.query);
      assert.ok(!/ª temporada/.test(item.query), item.query);
      assert.ok(item.year >= 1900);
      assert.ok(!item.platform || ALL_PLATFORM_KEYS.includes(item.platform));
    }
  });

  test("sin repetidos el mismo día", () => {
    const seen = new Set<string>();

    for (const item of IMPORTADOS) {
      const key = `${item.date}|${item.type}|${item.query.toLowerCase()}|${item.season ?? ""}`;

      assert.ok(!seen.has(key), `Repetido: ${key}`);
      seen.add(key);
    }
  });
});
