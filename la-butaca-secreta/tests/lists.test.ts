import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  canOptimize,
  fromCanon,
  fromListItems,
  fromTop,
  isListKey,
  isOfficialKey,
  itemsLabel,
  listHref,
  splitLists,
  stripPosters,
  timeAgo,
  titleHref,
  toggleLike,
} from "@/lib/lists/shared";

describe("claves y enlaces de listas", () => {
  test("canon y top son oficiales; un uuid no", () => {
    assert.equal(isOfficialKey("canon"), true);
    assert.equal(isOfficialKey("top"), true);
    assert.equal(isOfficialKey("3f2b6c1e-8a4d-4f0e-9b7a-1c2d3e4f5a6b"), false);
  });

  test("solo se aceptan oficiales o uuid en /lista/[id]", () => {
    assert.equal(isListKey("canon"), true);
    assert.equal(isListKey("3f2b6c1e-8a4d-4f0e-9b7a-1c2d3e4f5a6b"), true);
    assert.equal(isListKey("hola"), false);
    assert.equal(isListKey("1 or 1=1"), false);
  });

  test("listHref y titleHref", () => {
    assert.equal(listHref("canon"), "/lista/canon");
    assert.equal(titleHref("movie", 603), "/pelicula/603");
    assert.equal(titleHref("tv", 1396), "/serie/1396");
    assert.equal(titleHref("movie", null), null);
  });
});

describe("pósters", () => {
  test("solo se pueden pintar los de TMDb o locales (CSP)", () => {
    assert.equal(canOptimize("https://image.tmdb.org/t/p/w185/x.jpg"), true);
    assert.equal(canOptimize("/placeholder-poster.svg"), true);
    assert.equal(canOptimize("https://otra-web.com/x.jpg"), false);
    assert.equal(canOptimize(null), false);
    assert.equal(canOptimize(""), false);
  });

  test("la tira solo lleva los pósters que hay, sin huecos", () => {
    const posters = [
      { poster: "https://image.tmdb.org/a.jpg" },
      { poster: null },
      { poster: "https://image.tmdb.org/b.jpg" },
    ];

    assert.deepEqual(
      stripPosters(posters).map((p) => p.poster),
      ["https://image.tmdb.org/a.jpg", "https://image.tmdb.org/b.jpg"]
    );
  });

  test("la tira se corta en 7", () => {
    const posters = Array.from({ length: 10 }, (_, i) => ({
      poster: `https://image.tmdb.org/${i}.jpg`,
    }));

    assert.equal(stripPosters(posters).length, 7);
  });

  test("mapeos a pósters numerables", () => {
    const top = fromTop([
      {
        tmdbId: 1,
        mediaType: "tv",
        title: "Serie",
        posterUrl: null,
        avgRating: 4.25,
        votes: 3,
      },
    ]);

    assert.equal(top[0].href, "/serie/1");
    assert.equal(top[0].note, "★ 4.3 · 3 votos");

    const canon = fromCanon([
      { title: "Metrópolis", year: 1927, director: "Fritz Lang", tmdbId: 19, poster: null },
      { title: "Sin id", year: 1930, director: "X", tmdbId: null, poster: null },
    ]);

    assert.equal(canon[0].href, "/pelicula/19");
    assert.equal(canon[1].href, null);
    assert.notEqual(canon[0].key, canon[1].key);

    // Una misma película repetida en una lista no debe romper las keys
    const items = fromListItems([
      { tmdbId: 5, mediaType: "movie", title: "A", posterUrl: null },
      { tmdbId: 5, mediaType: "movie", title: "A", posterUrl: null },
    ]);

    assert.notEqual(items[0].key, items[1].key);
  });
});

describe("listas de la comunidad", () => {
  test("con me gusta esta semana van a Popular; el resto a Recientes", () => {
    const { popular, recent } = splitLists([
      { id: "a", likesRecent: 3 },
      { id: "b", likesRecent: 0 },
      { id: "c", likesRecent: 1 },
    ]);

    assert.deepEqual(popular.map((l) => l.id), ["a", "c"]);
    assert.deepEqual(recent.map((l) => l.id), ["b"]);
  });

  test("dar y quitar me gusta", () => {
    assert.deepEqual(toggleLike({ count: 4, liked: false }), { count: 5, liked: true });
    assert.deepEqual(toggleLike({ count: 5, liked: true }), { count: 4, liked: false });
    assert.deepEqual(toggleLike({ count: 0, liked: true }), { count: 0, liked: false });
  });

  test("itemsLabel", () => {
    assert.equal(itemsLabel(1), "1 título");
    assert.equal(itemsLabel(2), "2 títulos");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-11-27T20:00:00Z").getTime();

  test("minutos, horas y días", () => {
    assert.equal(timeAgo("2026-11-27T19:59:50Z", now), "ahora");
    assert.equal(timeAgo("2026-11-27T19:45:00Z", now), "hace 15 min");
    assert.equal(timeAgo("2026-11-27T17:00:00Z", now), "hace 3 h");
    assert.equal(timeAgo("2026-11-26T20:00:00Z", now), "hace 1 día");
    assert.equal(timeAgo("2026-11-20T20:00:00Z", now), "hace 7 días");
  });

  test("más de un mes: fecha", () => {
    assert.match(timeAgo("2026-01-05T12:00:00Z", now), /2026/);
  });
});
