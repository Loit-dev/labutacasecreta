import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  summarizeGroupCompatibility,
  topCastHighlights,
  type GroupCompatInput,
} from "@/lib/wrappedExtras";
import type { TitleCredits } from "@/lib/compatibilityExtras";

function credit(overrides: Partial<TitleCredits>): TitleCredits {
  return { director: null, cast: [], ...overrides };
}

describe("topCastHighlights", () => {
  test("elige el actor y el director que más se repiten, cada uno por su lado", () => {
    const credits: TitleCredits[] = [
      credit({ director: "Christopher Nolan", cast: ["Cillian Murphy"] }),
      credit({ director: "Christopher Nolan", cast: ["Cillian Murphy"] }),
      credit({ director: "Greta Gerwig", cast: ["Cillian Murphy"] }),
    ];

    const result = topCastHighlights(credits);

    assert.deepEqual(result.director, { name: "Christopher Nolan", count: 2 });
    assert.deepEqual(result.actor, { name: "Cillian Murphy", count: 3 });
  });

  test("un solo título no cuenta como repetido", () => {
    const credits: TitleCredits[] = [
      credit({ director: "Alguien", cast: ["Alguien más"] }),
    ];

    const result = topCastHighlights(credits);

    assert.equal(result.actor, undefined);
    assert.equal(result.director, undefined);
  });

  test("sin créditos, no rompe y no hay destacados", () => {
    const result = topCastHighlights([]);

    assert.equal(result.actor, undefined);
    assert.equal(result.director, undefined);
  });

  test("varios actores en el reparto de un mismo título cuentan cada uno por separado", () => {
    const credits: TitleCredits[] = [
      credit({ cast: ["A", "B"] }),
      credit({ cast: ["A", "C"] }),
      credit({ cast: ["A"] }),
    ];

    const result = topCastHighlights(credits);

    assert.deepEqual(result.actor, { name: "A", count: 3 });
  });
});

describe("summarizeGroupCompatibility", () => {
  function entry(overrides: Partial<GroupCompatInput>): GroupCompatInput {
    return { userId: "u", name: "Nombre", percent: null, ...overrides };
  }

  test("calcula la media solo entre quienes tienen compatibilidad lista", () => {
    const entries = [
      entry({ userId: "a", name: "Laura", percent: 80 }),
      entry({ userId: "b", name: "Marcos", percent: 60 }),
      entry({ userId: "c", name: "Elena", percent: null }),
    ];

    const summary = summarizeGroupCompatibility(entries);

    assert.equal(summary.groupAveragePercent, 70);
    assert.equal(summary.readyCount, 2);
  });

  test("ordena el top de mayor a menor y respeta el límite", () => {
    const entries = [
      entry({ userId: "a", name: "Laura", percent: 64 }),
      entry({ userId: "b", name: "Marcos", percent: 86 }),
      entry({ userId: "c", name: "Elena", percent: 71 }),
      entry({ userId: "d", name: "David", percent: 40 }),
    ];

    const summary = summarizeGroupCompatibility(entries, 3);

    assert.deepEqual(
      summary.top.map((t) => t.name),
      ["Marcos", "Elena", "Laura"]
    );
  });

  test("sin nadie con compatibilidad lista, no rompe", () => {
    const summary = summarizeGroupCompatibility([
      entry({ userId: "a", name: "Laura", percent: null }),
    ]);

    assert.equal(summary.groupAveragePercent, null);
    assert.deepEqual(summary.top, []);
  });

  test("sin amigos, no rompe", () => {
    const summary = summarizeGroupCompatibility([]);

    assert.equal(summary.groupAveragePercent, null);
    assert.deepEqual(summary.top, []);
  });
});
