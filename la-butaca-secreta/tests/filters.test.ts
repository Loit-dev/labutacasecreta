import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { buildFilters } from "@/lib/recommendation/filters";

describe("buildFilters", () => {
  test("las restricciones excluyen géneros", () => {
    const filters = buildFilters({
      contentType: "movie",
      restrictions: ["terror", "musical"],
    });

    assert.ok(filters.withoutGenres.includes(27));
    assert.ok(filters.withoutGenres.includes(10402));
  });

  test("«nada violento» excluye terror, thriller y crimen", () => {
    const filters = buildFilters({
      restrictions: ["violence"],
    });

    for (const genre of [27, 53, 80]) {
      assert.ok(filters.withoutGenres.includes(genre));
    }
  });

  test("«ninguna restricción» no excluye nada", () => {
    const filters = buildFilters({
      restrictions: ["none"],
    });

    assert.deepEqual(filters.withoutGenres, []);
  });

  test("el género elegido gana a una exclusión", () => {
    const filters = buildFilters({
      preferredGenre: "horror",
      restrictions: ["terror"],
    });

    assert.deepEqual(filters.withGenres, [27]);
    assert.ok(!filters.withoutGenres.includes(27));
  });

  test("reírse excluye el terror", () => {
    const filters = buildFilters({ mood: "laugh" });

    assert.ok(filters.withoutGenres.includes(27));
  });

  test("animación sí / no", () => {
    assert.ok(
      buildFilters({ animation: "yes" }).withGenres.includes(16)
    );

    assert.ok(
      buildFilters({ animation: "no" }).withoutGenres.includes(16)
    );
  });

  test("«algo nuevo» usa el año actual (no una fecha fija)", () => {
    const filters = buildFilters({ freshness: "new" });

    assert.equal(
      filters.releaseAfter,
      `${new Date().getFullYear() - 3}-01-01`
    );
  });

  test("«un clásico» limita la fecha de estreno", () => {
    const filters = buildFilters({ freshness: "classic" });

    assert.equal(filters.releaseBefore, "2005-12-31");
  });

  test("duración", () => {
    assert.equal(
      buildFilters({ duration: "short" }).runtimeLte,
      90
    );

    const normal = buildFilters({ duration: "normal" });

    assert.equal(normal.runtimeGte, 90);
    assert.equal(normal.runtimeLte, 140);

    assert.equal(
      buildFilters({ duration: "long" }).runtimeGte,
      140
    );
  });

  test("«joya oculta» busca nota alta y pocos votos", () => {
    const filters = buildFilters({
      discoveryMode: "hidden-gem",
    });

    assert.equal(filters.sortBy, "vote_average.desc");
    assert.equal(filters.maxVotes, 5000);
    assert.ok((filters.minRating ?? 0) >= 7);
  });

  test("«algo que me marque» exige muchos votos y nota alta", () => {
    const filters = buildFilters({
      discoveryMode: "impact",
    });

    assert.equal(filters.sortBy, "vote_average.desc");
    assert.ok((filters.minVotes ?? 0) >= 1000);
  });

  test("sin preferencias no cambia el orden por defecto", () => {
    const filters = buildFilters({});

    assert.equal(filters.sortBy, undefined);
    assert.equal(filters.type, "movie");
  });
});
