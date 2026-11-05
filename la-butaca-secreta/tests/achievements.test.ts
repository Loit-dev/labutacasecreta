import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { computeAchievements, diffNewLevels, type AchievementWatchedRow } from "@/lib/achievements/compute";

function row(
  overrides: Partial<AchievementWatchedRow> & { tmdbId: number }
): AchievementWatchedRow {
  return {
    mediaType: "movie",
    genres: [],
    // Un día distinto por cada tmdbId por defecto (mes 1 + tmdbId
    // días), para que un test de "total visto" con muchas filas no
    // dispare también "volumen diario" sin querer.
    seenAt: new Date(2026, 0, 1 + overrides.tmdbId, 12).toISOString(),
    ...overrides,
  };
}

describe("computeAchievements", () => {
  test("total_visto sube de nivel según el nº de títulos vistos", () => {
    const watched = Array.from({ length: 25 }, (_, i) => row({ tmdbId: i }));

    const state = computeAchievements({
      watched,
      friendsCount: 0,
      compatibleFriendsCount: 0,
      listsCount: 0,
      recommendationsSentCount: 0,
      shareEventsCount: 0,
    });

    const totalVisto = state.general.find((p) => p.key === "total_visto");

    assert.equal(totalVisto?.level, 1);
    assert.equal(totalVisto?.value, 25);
    assert.equal(totalVisto?.nextThreshold, 100);
  });

  test("volumen_diario mira el día con más títulos, no el total", () => {
    const watched = [
      // Agrupadas cerca del mediodía UTC para que caigan en el mismo
      // día local sea cual sea la zona horaria de quien ejecute el test.
      row({ tmdbId: 1, seenAt: "2026-06-01T11:00:00.000Z" }),
      row({ tmdbId: 2, seenAt: "2026-06-01T12:00:00.000Z" }),
      row({ tmdbId: 3, seenAt: "2026-06-01T13:00:00.000Z" }),
      row({ tmdbId: 4, seenAt: "2026-06-03T12:00:00.000Z" }),
    ];

    const state = computeAchievements({
      watched,
      friendsCount: 0,
      compatibleFriendsCount: 0,
      listsCount: 0,
      recommendationsSentCount: 0,
      shareEventsCount: 0,
    });

    const volumen = state.general.find((p) => p.key === "volumen_diario");

    assert.equal(volumen?.value, 3);
    assert.equal(volumen?.level, 1); // umbral Bronce = 3
  });

  test("racha cuenta días consecutivos hasta hoy", () => {
    const now = new Date("2026-06-10T18:00:00.000Z");
    const watched = [
      row({ tmdbId: 1, seenAt: "2026-06-08T10:00:00.000Z" }),
      row({ tmdbId: 2, seenAt: "2026-06-09T10:00:00.000Z" }),
      row({ tmdbId: 3, seenAt: "2026-06-10T10:00:00.000Z" }),
    ];

    const state = computeAchievements({
      watched,
      friendsCount: 0,
      compatibleFriendsCount: 0,
      listsCount: 0,
      recommendationsSentCount: 0,
      shareEventsCount: 0,
      now,
    });

    assert.equal(state.general.find((p) => p.key === "racha")?.value, 3);
  });

  test("nota_media solo cuenta filas con tmdbVoteAverage conocido y ≥1 punto por debajo", () => {
    const watched = [
      row({ tmdbId: 1, rating: 2, tmdbVoteAverage: 8 }), // 8/2=4, 2<=4-1 → cuenta
      row({ tmdbId: 2, rating: 4, tmdbVoteAverage: 8 }), // 4<=3? no → no cuenta
      row({ tmdbId: 3, rating: 1, tmdbVoteAverage: undefined }), // sin dato TMDb → no cuenta
    ];

    const state = computeAchievements({
      watched,
      friendsCount: 0,
      compatibleFriendsCount: 0,
      listsCount: 0,
      recommendationsSentCount: 0,
      shareEventsCount: 0,
    });

    assert.equal(state.general.find((p) => p.key === "nota_media")?.value, 1);
  });

  test("géneros vistos cuenta géneros distintos y cada familia de género sus propios títulos", () => {
    const watched = [
      row({ tmdbId: 1, genres: ["Terror"] }),
      row({ tmdbId: 2, genres: ["Terror", "Comedia"] }),
      row({ tmdbId: 3, genres: ["Comedia"] }),
    ];

    const state = computeAchievements({
      watched,
      friendsCount: 0,
      compatibleFriendsCount: 0,
      listsCount: 0,
      recommendationsSentCount: 0,
      shareEventsCount: 0,
    });

    assert.equal(state.general.find((p) => p.key === "generos_vistos")?.value, 2);

    const terror = state.genero.find((p) => p.key.includes("terror"));
    const comedia = state.genero.find((p) => p.key.includes("comedia"));

    assert.equal(terror?.value, 2);
    assert.equal(comedia?.value, 2);
  });

  test("estacional Terrorífico exige género Terror DENTRO de la ventana de Halloween", () => {
    const now = new Date("2026-10-28T12:00:00.000Z");

    const conFuera = computeAchievements({
      watched: [row({ tmdbId: 1, genres: ["Terror"], seenAt: "2026-05-01T12:00:00.000Z" })],
      friendsCount: 0,
      compatibleFriendsCount: 0,
      listsCount: 0,
      recommendationsSentCount: 0,
      shareEventsCount: 0,
      now,
    });

    assert.equal(
      conFuera.seasonal.find((s) => s.key === "terrorifico")?.unlocked,
      false
    );

    const conDentro = computeAchievements({
      watched: [row({ tmdbId: 1, genres: ["Terror"], seenAt: "2026-10-30T12:00:00.000Z" })],
      friendsCount: 0,
      compatibleFriendsCount: 0,
      listsCount: 0,
      recommendationsSentCount: 0,
      shareEventsCount: 0,
      now,
    });

    assert.equal(
      conDentro.seasonal.find((s) => s.key === "terrorifico")?.unlocked,
      true
    );
    assert.equal(
      conDentro.seasonal.find((s) => s.key === "terrorifico")?.windowOpen,
      true
    );
  });

  test("Navideño exige un título conocido, no cualquier cosa vista en diciembre", () => {
    const now = new Date("2026-12-10T12:00:00.000Z");

    const generico = computeAchievements({
      watched: [row({ tmdbId: 999999, seenAt: "2026-12-05T12:00:00.000Z" })],
      friendsCount: 0,
      compatibleFriendsCount: 0,
      listsCount: 0,
      recommendationsSentCount: 0,
      shareEventsCount: 0,
      now,
    });

    assert.equal(generico.seasonal.find((s) => s.key === "navideno")?.unlocked, false);

    const navideno = computeAchievements({
      watched: [row({ tmdbId: 5255, seenAt: "2026-12-05T12:00:00.000Z" })], // Love Actually
      friendsCount: 0,
      compatibleFriendsCount: 0,
      listsCount: 0,
      recommendationsSentCount: 0,
      shareEventsCount: 0,
      now,
    });

    assert.equal(navideno.seasonal.find((s) => s.key === "navideno")?.unlocked, true);
  });
});

describe("diffNewLevels", () => {
  test("solo devuelve los niveles por encima de lo ya guardado", () => {
    const watched = Array.from({ length: 300 }, (_, i) => row({ tmdbId: i }));

    const state = computeAchievements({
      watched,
      friendsCount: 0,
      compatibleFriendsCount: 0,
      listsCount: 0,
      recommendationsSentCount: 0,
      shareEventsCount: 0,
    });

    // total_visto con 300 vistos ya es nivel 3 (Veterano, umbral 250)
    const diffs = diffNewLevels(state, { total_visto: 1 });

    const totalVistoDiffs = diffs.filter((d) => d.key === "total_visto");

    assert.deepEqual(
      totalVistoDiffs.map((d) => d.level),
      [2, 3]
    );
  });

  test("nada nuevo si ya está guardado el nivel actual", () => {
    const watched = Array.from({ length: 25 }, (_, i) => row({ tmdbId: i }));

    const state = computeAchievements({
      watched,
      friendsCount: 0,
      compatibleFriendsCount: 0,
      listsCount: 0,
      recommendationsSentCount: 0,
      shareEventsCount: 0,
    });

    const diffs = diffNewLevels(state, { total_visto: 1 });

    assert.equal(diffs.length, 0);
  });
});
