import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { DESTACADOS } from "@/data/calendar/destacados";
import { ALL_PLATFORM_KEYS } from "@/lib/platforms";

describe("estrenos destacados", () => {
  test("cada uno tiene fecha válida, plataforma conocida y título", () => {
    assert.ok(DESTACADOS.length > 0);

    for (const item of DESTACADOS) {
      assert.match(item.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(ALL_PLATFORM_KEYS.includes(item.platform), item.query);
      assert.ok(item.query.trim().length > 0);
      assert.ok(!item.year || item.year >= 1900);
      assert.ok(["movie", "tv"].includes(item.type));
    }
  });

  test("no hay títulos repetidos el mismo día y plataforma", () => {
    const seen = new Set<string>();

    for (const item of DESTACADOS) {
      const key = `${item.date}|${item.platform}|${item.query.toLowerCase()}`;

      assert.ok(!seen.has(key), `Repetido: ${key}`);
      seen.add(key);
    }
  });
});
