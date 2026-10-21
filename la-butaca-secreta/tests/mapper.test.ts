import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  mapRecommendation,
  mapToScoredItem,
} from "@/lib/tmdb/mapper";
import { ALLOWED_PROVIDER_IDS } from "@/lib/tmdb/api";
import type { TMDBMovie } from "@/lib/tmdb/types";

const movie: TMDBMovie = {
  id: 10,
  title: "Película de prueba",
  overview: "Sinopsis",
  poster_path: "/poster.jpg",
  backdrop_path: null,
  release_date: "1999-05-20",
  vote_average: 7.46,
  vote_count: 1234,
  genre_ids: [18, 53],
  adult: false,
  original_language: "es",
  popularity: 12,
};

const provider = (
  provider_id: number,
  provider_name: string,
  logo_path: string | null = "/logo.png"
) => ({ provider_id, provider_name, logo_path });

const watch = (...flatrate: ReturnType<typeof provider>[]) => ({
  results: { ES: { link: "https://example.test/es", flatrate } },
});

describe("mapRecommendation", () => {
  test("datos básicos", () => {
    const result = mapRecommendation(movie);

    assert.equal(result.title, "Película de prueba");
    assert.equal(result.year, 1999);
    assert.equal(result.rating, 7.5);
    assert.deepEqual(result.genreIds, [18, 53]);
    assert.deepEqual(result.genres, ["Drama", "Thriller"]);
  });

  test("sin póster usa la imagen por defecto (que existe)", () => {
    const result = mapRecommendation({
      ...movie,
      poster_path: null,
    });

    assert.equal(result.poster, "/placeholder-poster.svg");
  });

  test("solo muestra plataformas principales, en su orden", () => {
    const result = mapRecommendation(
      movie,
      undefined,
      watch(
        provider(1, "Rakuten TV"),
        provider(63, "Filmin"),
        provider(8, "Netflix"),
        provider(119, "Amazon Prime Video"),
        provider(1899, "HBO Max")
      )
    );

    assert.deepEqual(
      result.platforms.map((p) => p.name),
      ["Netflix", "Prime Video", "Max", "Filmin"]
    );
  });

  test("la tarjeta enseña como mucho 3 plataformas", () => {
    const result = mapRecommendation(
      movie,
      undefined,
      watch(
        provider(8, "Netflix"),
        provider(119, "Amazon Prime Video"),
        provider(337, "Disney Plus"),
        provider(1899, "HBO Max")
      )
    );

    assert.equal(result.providers.length, 3);
    assert.equal(result.platforms.length, 4);
  });

  test("agrupa variantes de una misma plataforma", () => {
    const result = mapRecommendation(
      movie,
      undefined,
      watch(
        provider(119, "Amazon Prime Video"),
        provider(2100, "Amazon Prime Video with Ads")
      )
    );

    assert.equal(result.platforms.length, 1);
    assert.equal(result.platforms[0].name, "Prime Video");
  });

  test("los planes con anuncios cuentan como la misma plataforma", () => {
    const result = mapRecommendation(
      movie,
      undefined,
      watch(
        provider(1796, "Netflix Standard with Ads"),
        provider(2100, "Amazon Prime Video with Ads")
      )
    );

    assert.deepEqual(
      result.platforms.map((p) => p.name),
      ["Netflix", "Prime Video"]
    );
  });

  test("descarta plataformas sin logo", () => {
    const result = mapRecommendation(
      movie,
      undefined,
      watch(provider(8, "Netflix", null))
    );

    assert.equal(result.platforms.length, 0);
  });

  test("tráiler: prefiere el oficial y en español", () => {
    const videos = {
      results: [
        { key: "a", name: "x", site: "YouTube", type: "Trailer" },
        {
          key: "b",
          name: "x",
          site: "YouTube",
          type: "Trailer",
          official: true,
          iso_639_1: "en",
        },
        {
          key: "c",
          name: "x",
          site: "YouTube",
          type: "Trailer",
          official: true,
          iso_639_1: "es",
        },
        { key: "d", name: "x", site: "Vimeo", type: "Trailer" },
        { key: "e", name: "x", site: "YouTube", type: "Teaser" },
      ],
    };

    const result = mapRecommendation(movie, {
      id: 10,
      genres: [],
      videos,
    });

    assert.equal(result.trailerKey, "c");
  });

  test("sin vídeos no hay tráiler", () => {
    assert.equal(
      mapRecommendation(movie).trailerKey,
      undefined
    );
  });

  test("en series, el «director» es el creador", () => {
    const result = mapRecommendation(
      movie,
      {
        id: 10,
        genres: [],
        created_by: [{ id: 1, name: "Vince Gilligan" }],
      },
      undefined,
      { cast: [], crew: [] }
    );

    assert.equal(result.director, "Vince Gilligan");
  });

  test("guarda el enlace de dónde verla y el reparto", () => {
    const result = mapRecommendation(
      movie,
      undefined,
      watch(provider(8, "Netflix")),
      {
        cast: [
          { id: 1, name: "A", character: "", profile_path: null },
          { id: 2, name: "B", character: "", profile_path: null },
        ],
        crew: [
          {
            id: 3,
            name: "Director X",
            job: "Director",
            department: "Directing",
            profile_path: null,
          },
        ],
      }
    );

    assert.equal(result.watchLink, "https://example.test/es");
    assert.deepEqual(result.cast, ["A", "B"]);
    assert.equal(result.director, "Director X");
  });
});

describe("mapToScoredItem", () => {
  test("convierte una película de TMDb para puntuarla", () => {
    const scored = mapToScoredItem(movie);

    assert.equal(scored.id, 10);
    assert.equal(scored.voteCount, 1234);
    assert.equal(scored.releaseDate, "1999-05-20");
    assert.equal(scored.score, 0);
  });

  test("en series usa el nombre y la fecha de primera emisión", () => {
    const scored = mapToScoredItem({
      ...movie,
      title: undefined,
      name: "Una serie",
      release_date: undefined,
      first_air_date: "2011-04-17",
    });

    assert.equal(scored.title, "Una serie");
    assert.equal(scored.releaseDate, "2011-04-17");
  });
});

describe("plataformas permitidas", () => {
  test("incluye los planes con anuncios de Netflix y Prime", () => {
    assert.ok(ALLOWED_PROVIDER_IDS.includes(1796));
    assert.ok(ALLOWED_PROVIDER_IDS.includes(2100));
  });
});
