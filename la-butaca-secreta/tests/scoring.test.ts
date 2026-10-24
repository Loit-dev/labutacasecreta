import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { sortByScore } from "@/lib/recommendation/scoring";
import { scoreFeedback } from "@/lib/recommendation/scoring/feedback";
import { scoreProviders } from "@/lib/recommendation/scoring/providers";
import { scoreDuration } from "@/lib/recommendation/scoring/duration";
import { scoreFreshness } from "@/lib/recommendation/scoring/freshness";
import { scorePopularity } from "@/lib/recommendation/scoring/popularity";
import type { ScoredItem } from "@/lib/recommendation/scoring/types";

function make(overrides: Partial<ScoredItem> = {}): ScoredItem {
  return {
    id: 1,
    title: "Título",
    genres: [18],
    voteAverage: 7,
    voteCount: 1000,
    popularity: 50,
    runtime: 100,
    releaseDate: "2020-01-01",
    providers: ["Netflix"],
    score: 0,
    ...overrides,
  };
}

describe("sortByScore", () => {
  test("el género elegido pesa más que la popularidad", () => {
    const comedy = make({
      id: 1,
      genres: [35],
      voteAverage: 6.5,
      popularity: 1,
    });

    const drama = make({
      id: 2,
      genres: [18],
      voteAverage: 8.6,
      popularity: 900,
    });

    const [first] = sortByScore([drama, comedy], {
      profile: { preferredGenre: "comedy" },
    });

    assert.equal(first.id, 1);
  });

  test("«reírme»: un thriller largo no gana a una comedia, aunque tenga mejor nota", () => {
    const thriller = make({
      id: 1,
      genres: [53, 18],
      runtime: 162,
      voteAverage: 8.4,
      popularity: 300,
    });

    const comedy = make({
      id: 2,
      genres: [35],
      runtime: 100,
      voteAverage: 6.8,
      popularity: 40,
    });

    const [first] = sortByScore([thriller, comedy], {
      profile: { mood: "laugh" },
    });

    assert.equal(first.id, 2);
  });

  test("en familia, el terror se hunde", () => {
    const horror = make({ id: 1, genres: [27] });
    const family = make({ id: 2, genres: [10751, 16] });

    const [first] = sortByScore([horror, family], {
      profile: { company: "family" },
    });

    assert.equal(first.id, 2);
  });

  test("devuelve los títulos ordenados de mayor a menor puntuación", () => {
    const scored = sortByScore(
      [
        make({ id: 1, voteAverage: 6 }),
        make({ id: 2, voteAverage: 9 }),
        make({ id: 3, voteAverage: 7.6 }),
      ],
      { profile: {} }
    );

    const scores = scored.map((item) => item.score);

    assert.deepEqual(
      scores,
      [...scores].sort((a, b) => b - a)
    );
  });
});

describe("scoreProviders", () => {
  test("sin plataformas no se recomienda", () => {
    assert.equal(
      scoreProviders(make({ providers: [] }), { profile: {} }),
      -100
    );
  });

  test("más plataformas, más puntos", () => {
    const one = scoreProviders(
      make({ providers: ["Netflix"] }),
      { profile: {} }
    );

    const three = scoreProviders(
      make({ providers: ["Netflix", "Prime Video", "Max"] }),
      { profile: {} }
    );

    assert.ok(three > one);
  });
});

describe("scoreDuration", () => {
  test("«corta» premia las películas cortas y castiga las largas", () => {
    const profile = { duration: "short" };

    assert.ok(
      scoreDuration(make({ runtime: 85 }), { profile }) >
        scoreDuration(make({ runtime: 120 }), { profile })
    );

    assert.ok(
      scoreDuration(make({ runtime: 170 }), { profile }) < 0
    );
  });

  test("sin duración conocida no puntúa", () => {
    assert.equal(
      scoreDuration(make({ runtime: 0 }), {
        profile: { duration: "short" },
      }),
      0
    );
  });
});

describe("scoreFreshness", () => {
  test("«nuevo» premia lo reciente", () => {
    const year = new Date().getFullYear();

    assert.ok(
      scoreFreshness(make({ releaseDate: `${year}-01-01` }), {
        profile: { freshness: "new" },
      }) >
        scoreFreshness(make({ releaseDate: "2010-01-01" }), {
          profile: { freshness: "new" },
        })
    );
  });

  test("«clásico» premia lo antiguo", () => {
    assert.ok(
      scoreFreshness(make({ releaseDate: "1972-01-01" }), {
        profile: { freshness: "classic" },
      }) >
        scoreFreshness(make({ releaseDate: "2019-01-01" }), {
          profile: { freshness: "classic" },
        })
    );
  });
});

describe("scoreFeedback (aprender de lo rechazado)", () => {
  test("sin rechazos no cambia nada", () => {
    assert.equal(
      scoreFeedback(make({ genres: [27] }), { profile: {} }),
      0
    );
  });

  test("penaliza los géneros rechazados, más cuantas más veces", () => {
    const horror = make({ genres: [27] });

    const once = scoreFeedback(horror, {
      profile: {},
      dislikedGenres: [27],
    });

    const twice = scoreFeedback(horror, {
      profile: {},
      dislikedGenres: [27, 27],
    });

    assert.ok(once < 0);
    assert.ok(twice < once);
  });

  test("tiene un tope", () => {
    const penalty = scoreFeedback(make({ genres: [27, 53] }), {
      profile: {},
      dislikedGenres: Array(50).fill(27).concat(Array(50).fill(53)),
    });

    assert.ok(penalty >= -24);
  });

  test("el género elegido por el usuario no se penaliza", () => {
    const thriller = make({ genres: [53] });

    assert.equal(
      scoreFeedback(thriller, {
        profile: { preferredGenre: "thriller" },
        dislikedGenres: [53, 53, 53],
      }),
      0
    );
  });

  test("no afecta a títulos de otros géneros", () => {
    assert.equal(
      scoreFeedback(make({ genres: [35] }), {
        profile: {},
        dislikedGenres: [27, 27],
      }),
      0
    );
  });
});

describe("calidad", () => {
  test("una nota floja puntúa menos que una aceptable", () => {
    const ctx = { profile: {} };
    const flojo = sortByScore([make({ id: 1, voteAverage: 6.1 })], ctx)[0];
    const bueno = sortByScore([make({ id: 2, voteAverage: 6.9 })], ctx)[0];

    assert.ok(bueno.score > flojo.score);
  });

  test("«infantil y familiar» pone lo familiar por delante, aunque vayan en pareja", () => {
    const family = make({
      id: 1,
      genres: [10751, 16],
      voteAverage: 6.8,
      popularity: 5,
    });

    const thriller = make({
      id: 2,
      genres: [53],
      voteAverage: 8.5,
      popularity: 900,
    });

    const [first] = sortByScore([thriller, family], {
      profile: { preferredGenre: "family", company: "partner" },
    });

    assert.equal(first.id, 1);
  });

  test("«acción y aventuras»: una película de aventuras puntúa igual que una de acción", () => {
    const action = make({ id: 1, genres: [28] });
    const adventure = make({ id: 2, genres: [12] });
    const drama = make({ id: 3, genres: [18] });

    const ranked = sortByScore([drama, adventure, action], {
      profile: { preferredGenre: "action" },
    });

    assert.equal(ranked[2].id, 3);
    assert.equal(ranked[0].score, ranked[1].score);
  });

  test("sin pedirlo, la animación queda por detrás de la imagen real a igualdad", () => {
    const animated = make({ id: 1, genres: [16, 28, 12] });
    const liveAction = make({ id: 2, genres: [28, 12] });

    const [first] = sortByScore([animated, liveAction], {
      profile: { preferredGenre: "action" },
    });

    assert.equal(first.id, 2);
  });

  test("con «infantil y familiar» la animación no se penaliza, sino que suma", () => {
    const animated = make({ id: 1, genres: [16, 10751] });
    const live = make({ id: 2, genres: [10751] });

    const ranked = sortByScore([animated, live], {
      profile: { preferredGenre: "family" },
    });

    // Al contrario: para niños, la animación suma
    assert.equal(ranked[0].id, 1);
  });

  test("si piden animación expresamente, no se penaliza", () => {
    const animated = make({ id: 1, genres: [16, 28] });
    const live = make({ id: 2, genres: [28] });

    const ranked = sortByScore([animated, live], {
      profile: { preferredGenre: "action", animation: "yes" },
    });

    assert.equal(ranked[0].score, ranked[1].score);
  });
});

describe("scorePopularity (nota media vs. popularidad bruta)", () => {
  test("un taquillazo muy visto gana a un título de nicho con mejor nota pero menos alcance", () => {
    const blockbuster = make({
      id: 1,
      voteAverage: 7.2,
      voteCount: 20000,
      popularity: 1200,
    });

    const nicho = make({
      id: 2,
      voteAverage: 8.7,
      voteCount: 3000,
      popularity: 150,
    });

    const ctx = { profile: {} };

    assert.ok(
      scorePopularity(blockbuster, ctx) > scorePopularity(nicho, ctx)
    );
  });

  test("la popularidad bruta pesa más que antes: su máximo supera al de la nota", () => {
    const soloPopular = make({
      voteAverage: 6.6,
      voteCount: 0,
      popularity: 1000,
    });

    const soloBienValorado = make({
      voteAverage: 8.5,
      voteCount: 0,
      popularity: 0,
    });

    const ctx = { profile: {} };

    assert.ok(
      scorePopularity(soloPopular, ctx) >
        scorePopularity(soloBienValorado, ctx)
    );
  });
});
