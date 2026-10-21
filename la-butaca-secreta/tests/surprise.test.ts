import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  buildSurpriseReason,
  buildTrios,
} from "@/lib/recommendation/surprise";
import type { ScoredItem } from "@/lib/recommendation/scoring/types";

function item(
  id: number,
  genres: number[],
  voteAverage: number,
  voteCount: number,
  year: number,
  score: number
): ScoredItem {
  return {
    id,
    title: `T${id}`,
    genres,
    voteAverage,
    voteCount,
    popularity: 1,
    runtime: 100,
    releaseDate: `${year}-01-01`,
    score,
  };
}

// Generador pseudoaleatorio con semilla (resultados repetibles)
function random(seed: number) {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;

    return state / 4294967296;
  };
}

const ALL_GENRES = [28, 35, 12, 18, 53, 80, 878, 9648, 10749, 27];

function randomPool(size: number, seed: number) {
  const next = random(seed);

  return Array.from({ length: size }, (_, index) =>
    item(
      index + 1,
      [...new Set(
        Array.from(
          { length: 1 + Math.floor(next() * 3) },
          () => ALL_GENRES[Math.floor(next() * ALL_GENRES.length)]
        )
      )],
      6 + next() * 3,
      Math.floor(next() * 40000),
      1950 + Math.floor(next() * 75),
      100 - index
    )
  );
}

describe("buildTrios", () => {
  test("cada tanda es principal, principal, sorpresa", () => {
    const pool = randomPool(30, 1);

    const trios = buildTrios(pool, 4);

    assert.equal(trios.length, 12);

    trios.forEach((entry, index) => {
      assert.equal(
        entry.role,
        index % 3 === 2 ? "surprise" : "main"
      );
    });
  });

  test("nunca repite títulos (con muchas combinaciones)", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const size = 3 + (seed % 38);

      const trios = buildTrios(randomPool(size, seed), 4);

      const ids = trios.map((entry) => entry.item.id);

      assert.equal(new Set(ids).size, ids.length);

      // Siempre tandas completas de 3
      assert.equal(trios.length % 3, 0);
      assert.equal(
        trios.length,
        3 * Math.min(4, Math.floor(size / 3))
      );
    }
  });

  test("con menos de 3 títulos no hay tanda: se devuelven tal cual", () => {
    const pool = randomPool(2, 7);

    const trios = buildTrios(pool, 4);

    assert.equal(trios.length, 2);
    assert.ok(trios.every((entry) => entry.role === "main"));
  });

  test("el primer principal es siempre el que mejor encaja", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const pool = randomPool(20, seed);

      const [first] = buildTrios(pool, 2);

      assert.equal(first.item.id, pool[0].id);
    }
  });

  test("elige como sorpresa algo bien valorado y poco conocido", () => {
    const pool = [
      item(1, [28, 35], 7.5, 20000, 2021, 100),
      item(2, [28, 12], 7.2, 15000, 2019, 95),
      item(3, [28, 35], 7.0, 9000, 2022, 90),
      // La joya: nota alta, pocos votos, género y época distintos
      item(4, [53], 8.1, 800, 1975, 40),
      item(5, [28, 35], 6.2, 30000, 2020, 80),
      item(6, [28], 6.4, 25000, 2018, 70),
    ];

    const [, , surprise] = buildTrios(pool, 1);

    assert.equal(surprise.role, "surprise");
    assert.equal(surprise.item.id, 4);
    assert.ok(
      surprise.newGenres?.includes("Thriller")
    );
  });

  test("una tanda no repite exactamente los mismos géneros si hay alternativa", () => {
    const pool = [
      item(1, [35], 7.5, 20000, 2021, 100),
      item(2, [35], 7.3, 15000, 2019, 95),
      item(3, [35], 7.4, 900, 2020, 60),
      item(4, [878], 7.4, 900, 2020, 60),
    ];

    const trio = buildTrios(pool, 1).map(
      (entry) => entry.item.id
    );

    assert.ok(trio.includes(4));
  });
});

describe("buildSurpriseReason", () => {
  test("empieza por «Mi sorpresa» y cuenta algo verificable", () => {
    const [, , surprise] = buildTrios(
      [
        item(1, [28], 7.5, 20000, 2021, 100),
        item(2, [35], 7.2, 15000, 2019, 95),
        item(3, [53], 7.9, 800, 1970, 50),
      ],
      1
    );

    const reason = buildSurpriseReason(surprise);

    assert.ok(reason.startsWith("Mi sorpresa:"));
    assert.ok(reason.includes("7.9"));
    assert.ok(reason.includes("thriller"));
  });
});
