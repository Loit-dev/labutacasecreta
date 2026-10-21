import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { buildFilters } from "@/lib/recommendation/filters";
import { mapRecommendation, mapToScoredItem } from "@/lib/tmdb/mapper";
import {
  normalizeTvGenreIds,
  toTvFilters,
} from "@/lib/tmdb/tvGenres";
import type { TMDBMovie } from "@/lib/tmdb/types";

const serie: TMDBMovie = {
  id: 1,
  name: "Una serie",
  overview: "",
  poster_path: null,
  backdrop_path: null,
  first_air_date: "2020-01-01",
  vote_average: 8,
  vote_count: 2000,
  genre_ids: [10759, 10765, 18],
  adult: false,
  original_language: "en",
  popularity: 10,
};

describe("géneros de series", () => {
  test("los géneros combinados se separan en los de película", () => {
    assert.deepEqual(
      normalizeTvGenreIds([10759, 10765, 18]),
      [28, 12, 878, 14, 18]
    );
  });

  test("sin repetir ni romper los géneros normales", () => {
    assert.deepEqual(normalizeTvGenreIds([35, 35, 16]), [35, 16]);
    assert.deepEqual(normalizeTvGenreIds(), []);
  });

  test("una serie de ciencia ficción puntúa como ciencia ficción", () => {
    assert.ok(mapToScoredItem(serie).genres.includes(878));
    assert.ok(mapRecommendation(serie).genreIds.includes(28));
  });

  test("en series, los géneros se muestran en español", () => {
    const names = mapRecommendation(serie).genres;

    assert.ok(names.includes("Acción"));
    assert.ok(names.includes("Ciencia ficción"));
    assert.ok(names.every((n) => !n.includes("&")));
  });

  test("las películas no cambian", () => {
    const movie = { ...serie, name: undefined, title: "Peli" };

    assert.deepEqual(mapToScoredItem(movie).genres, [10759, 10765, 18]);
  });

  test("buscar series de terror o thriller usa un género que existe", () => {
    for (const preferredGenre of ["horror", "thriller", "romance", "action", "scifi"]) {
      const tv = toTvFilters(
        buildFilters({ contentType: "tv", preferredGenre })
      );

      for (const id of tv.withGenres) {
        assert.ok(
          [10759, 10765, 10768, 9648, 18].includes(id),
          `${preferredGenre} → ${id}`
        );
      }

      assert.equal(tv.withGenres.length, 1, preferredGenre);
    }
  });

  test("no se excluyen géneros que las series no tienen", () => {
    const tv = toTvFilters(
      buildFilters({
        contentType: "tv",
        restrictions: ["violence"],
      })
    );

    assert.deepEqual(tv.withoutGenres, [80]);
  });

  test("una exclusión nunca contradice la selección", () => {
    const tv = toTvFilters({
      type: "tv",
      withGenres: [53],
      withoutGenres: [9648],
    });

    assert.deepEqual(tv.withGenres, [9648]);
    assert.deepEqual(tv.withoutGenres, []);
  });
});
