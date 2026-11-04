import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  computeCompatibility,
  tierFor,
  MIN_COMMON_RATED,
} from "@/lib/compatibility";
import type { WatchedRow } from "@/lib/supabase/summary";

function row(
  tmdbId: number,
  rating: number | undefined,
  mediaType: "movie" | "tv" = "movie"
): WatchedRow {
  return {
    tmdbId,
    mediaType,
    title: `Título ${tmdbId}`,
    rating: rating as WatchedRow["rating"],
    genres: [],
    seenAt: "2026-11-01T12:00:00.000Z",
  };
}

describe("tierFor", () => {
  test("elige la franja de 10 puntos correcta", () => {
    assert.equal(tierFor(100).icon, "🧬");
    assert.equal(tierFor(95).icon, "🧬");
    assert.equal(tierFor(89).icon, "🍿");
    assert.equal(tierFor(50).icon, "🤝");
    assert.equal(tierFor(5).icon, "🧊");
    assert.equal(tierFor(0).icon, "🧊");
  });
});

describe("computeCompatibility", () => {
  test("not_enough con menos de MIN_COMMON_RATED títulos valorados por ambos", () => {
    const mine = [row(1, 5), row(2, 4)];
    const theirs = [row(1, 5), row(2, 4)];

    assert.ok(MIN_COMMON_RATED > 2);

    const result = computeCompatibility(mine, theirs);

    assert.equal(result.status, "not_enough");
    assert.equal(result.commonCount, 2);
    assert.equal(result.commonRatedCount, 2);
  });

  test("100% cuando las notas coinciden exactamente", () => {
    const mine = [row(1, 5), row(2, 4), row(3, 3)];
    const theirs = [row(1, 5), row(2, 4), row(3, 3)];

    const result = computeCompatibility(mine, theirs);

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.percent, 100);
      assert.equal(result.icon, "🧬");
      assert.equal(result.commonRatedCount, 3);
    }
  });

  test("0% cuando la diferencia es máxima en todo (4 puntos, 1 vs 5)", () => {
    const mine = [row(1, 5), row(2, 5), row(3, 5)];
    const theirs = [row(1, 1), row(2, 1), row(3, 1)];

    const result = computeCompatibility(mine, theirs);

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.percent, 0);
      assert.equal(result.icon, "🧊");
    }
  });

  test("solo cuenta títulos valorados por los dos, no solo vistos por los dos", () => {
    const mine = [row(1, 5), row(2, undefined), row(3, 5)];
    const theirs = [row(1, 5), row(2, 5), row(3, undefined)];

    // Los 3 están vistos por ambos (commonCount), pero solo el título
    // 1 tiene nota de los dos a la vez.
    const result = computeCompatibility(mine, theirs);

    assert.equal(result.commonCount, 3);
    assert.equal(result.commonRatedCount, 1);
    assert.equal(result.status, "not_enough");
  });

  test("distingue movie y tv con el mismo tmdbId", () => {
    const mine = [row(1, 5, "movie"), row(1, 2, "tv")];
    const theirs = [row(1, 5, "movie")];

    const result = computeCompatibility(mine, theirs);

    // Sin la clave tv/movie, "theirs" solo trae la peli: el episodio
    // de serie con id 1 no debe confundirse con ella.
    assert.equal(result.commonCount, 1);
  });

  test("topCommon ordena por menor diferencia de notas primero", () => {
    const mine = [row(1, 5), row(2, 5), row(3, 3)];
    const theirs = [row(1, 1), row(2, 5), row(3, 2)];

    const result = computeCompatibility(mine, theirs);

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.topCommon[0].tmdbId, 2); // diff 0
      assert.equal(result.topCommon[1].tmdbId, 3); // diff 1
      assert.equal(result.topCommon[2].tmdbId, 1); // diff 4
    }
  });

  test("percent queda dentro de 0-100 siempre", () => {
    const mine = [row(1, 1), row(2, 1), row(3, 5)];
    const theirs = [row(1, 5), row(2, 5), row(3, 1)];

    const result = computeCompatibility(mine, theirs);

    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.ok(result.percent >= 0 && result.percent <= 100);
    }
  });
});
