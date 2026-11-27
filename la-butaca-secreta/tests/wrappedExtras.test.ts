import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  pickTrendyAndHiddenGem,
  summarizeGroupCompatibility,
  topCastHighlights,
  yearCommunityLine,
  type CastCredit,
  type GroupCompatInput,
  type TitleWithCount,
} from "@/lib/wrappedExtras";

function credit(overrides: Partial<CastCredit>): CastCredit {
  return { director: null, cast: [], ...overrides };
}

describe("topCastHighlights", () => {
  test("elige el actor y el director que más se repiten, cada uno por su lado", () => {
    const credits: CastCredit[] = [
      credit({ director: "Christopher Nolan", cast: ["Cillian Murphy"] }),
      credit({ director: "Christopher Nolan", cast: ["Cillian Murphy"] }),
      credit({ director: "Greta Gerwig", cast: ["Cillian Murphy"] }),
    ];

    const result = topCastHighlights(credits);

    assert.deepEqual(result.director, {
      name: "Christopher Nolan",
      count: 2,
      photoPath: null,
      titles: [],
    });
    assert.deepEqual(result.actor, {
      name: "Cillian Murphy",
      count: 3,
      photoPath: null,
      titles: [],
    });
  });

  test("un solo título no cuenta como repetido", () => {
    const credits: CastCredit[] = [
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
    const credits: CastCredit[] = [
      credit({ cast: ["A", "B"] }),
      credit({ cast: ["A", "C"] }),
      credit({ cast: ["A"] }),
    ];

    const result = topCastHighlights(credits);

    assert.deepEqual(result.actor, {
      name: "A",
      count: 3,
      photoPath: null,
      titles: [],
    });
  });

  test("recoge los títulos (sin repetir) en los que aparece el ganador", () => {
    const credits: CastCredit[] = [
      credit({
        director: "Christopher Nolan",
        cast: ["Cillian Murphy"],
        title: "Oppenheimer",
      }),
      credit({
        director: "Christopher Nolan",
        cast: ["Cillian Murphy"],
        title: "Dunkerque",
      }),
      credit({
        director: "Christopher Nolan",
        cast: ["Cillian Murphy"],
        title: "Oppenheimer",
      }),
    ];

    const result = topCastHighlights(credits);

    assert.deepEqual(result.director?.titles, ["Oppenheimer", "Dunkerque"]);
    assert.deepEqual(result.actor?.titles, ["Oppenheimer", "Dunkerque"]);
  });

  test("se queda con la primera foto que encuentra para el nombre ganador", () => {
    const credits: CastCredit[] = [
      credit({
        director: "Christopher Nolan",
        directorPhoto: null,
        cast: ["Cillian Murphy"],
        castPhotos: ["/murphy.jpg"],
      }),
      credit({
        director: "Christopher Nolan",
        directorPhoto: "/nolan.jpg",
        cast: ["Cillian Murphy"],
        castPhotos: ["/murphy2.jpg"],
      }),
    ];

    const result = topCastHighlights(credits);

    assert.equal(result.director?.photoPath, "/nolan.jpg");
    assert.equal(result.actor?.photoPath, "/murphy.jpg");
  });
});

describe("pickTrendyAndHiddenGem", () => {
  function title(overrides: Partial<TitleWithCount> & { tmdbId: number }): TitleWithCount {
    return {
      mediaType: "movie",
      title: `Título ${overrides.tmdbId}`,
      watcherCount: 1,
      ...overrides,
    };
  }

  test("elige el título que más gente de la app vio como trendy", () => {
    const rows = [
      title({ tmdbId: 1, watcherCount: 2 }),
      title({ tmdbId: 2, watcherCount: 40 }),
      title({ tmdbId: 3, watcherCount: 5 }),
    ];

    const result = pickTrendyAndHiddenGem(rows);

    assert.equal(result.trendy?.tmdbId, 2);
  });

  test("si nadie más vio nada, no hay trendy", () => {
    const rows = [title({ tmdbId: 1, watcherCount: 1 })];

    const result = pickTrendyAndHiddenGem(rows);

    assert.equal(result.trendy, undefined);
  });

  test("la joya oculta es la mejor valorada entre las que menos vio nadie más", () => {
    const rows = [
      title({ tmdbId: 1, watcherCount: 1, rating: 5 }),
      title({ tmdbId: 2, watcherCount: 1, rating: 4 }),
      title({ tmdbId: 3, watcherCount: 50, rating: 5 }),
    ];

    const result = pickTrendyAndHiddenGem(rows);

    assert.equal(result.hiddenGem?.tmdbId, 1);
  });

  test("sin valoraciones altas, no hay joya oculta", () => {
    const rows = [title({ tmdbId: 1, watcherCount: 1, rating: 3 })];

    const result = pickTrendyAndHiddenGem(rows);

    assert.equal(result.hiddenGem, undefined);
  });

  test("el mismo título no puede ser trendy y joya oculta a la vez", () => {
    const rows = [
      title({ tmdbId: 1, watcherCount: 50, rating: 5 }),
      title({ tmdbId: 2, watcherCount: 1, rating: 2 }),
    ];

    const result = pickTrendyAndHiddenGem(rows);

    assert.equal(result.trendy?.tmdbId, 1);
    assert.equal(result.hiddenGem, undefined);
  });

  test("sin títulos, no rompe", () => {
    const result = pickTrendyAndHiddenGem([]);

    assert.deepEqual(result, {});
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

  test("a los que aún no tienen datos los añade detrás, con percent null (valor simbólico en vez de ocultarlos)", () => {
    const entries = [
      entry({ userId: "a", name: "Laura", percent: 64 }),
      entry({ userId: "b", name: "Marcos", percent: null }),
      entry({ userId: "c", name: "Elena", percent: 86 }),
      entry({ userId: "d", name: "David", percent: null }),
    ];

    const summary = summarizeGroupCompatibility(entries, 6);

    assert.deepEqual(
      summary.top.map((t) => [t.name, t.percent]),
      [
        ["Elena", 86],
        ["Laura", 64],
        ["Marcos", null],
        ["David", null],
      ]
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

describe("yearCommunityLine", () => {
  test("sin nada visto, no hay frase", () => {
    assert.equal(yearCommunityLine(50, 100, 0), undefined);
  });

  test("con pocas cuentas todavía, frase sin porcentaje", () => {
    assert.equal(
      yearCommunityLine(100, 2, 5),
      "De los primeros en tener un Resumen Anual en la app"
    );
  });

  test("con comunidad suficiente, incluye el percentil", () => {
    assert.equal(
      yearCommunityLine(82, 50, 30),
      "Has visto más que el 82% de la comunidad este año"
    );
  });

  test("acota el percentil entre 1 y 99", () => {
    assert.equal(
      yearCommunityLine(100, 50, 30),
      "Has visto más que el 99% de la comunidad este año"
    );
    assert.equal(
      yearCommunityLine(0, 50, 30),
      "Has visto más que el 1% de la comunidad este año"
    );
  });
});
