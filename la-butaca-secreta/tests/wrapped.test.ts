import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { buildWrapped, type WrappedInput } from "@/lib/wrapped";
import type { WatchedRow } from "@/lib/supabase/summary";

function row(overrides: Partial<WatchedRow> & { tmdbId: number }): WatchedRow {
  return {
    mediaType: "movie",
    title: `Título ${overrides.tmdbId}`,
    genres: [],
    seenAt: new Date(2026, 0, 1 + overrides.tmdbId, 12).toISOString(),
    ...overrides,
  };
}

function baseInput(overrides: Partial<WrappedInput> = {}): WrappedInput {
  return {
    year: 2026,
    watched: [],
    canonIds: new Set(),
    canonTotal: 250,
    achievementUnlocks: [],
    rejectedThisYearCount: 0,
    now: new Date(2026, 11, 25),
    ...overrides,
  };
}

describe("buildWrapped", () => {
  test("cuenta solo las filas del año pedido", () => {
    const watched = [
      row({ tmdbId: 1, seenAt: new Date(2025, 5, 1).toISOString() }),
      row({ tmdbId: 2, seenAt: new Date(2026, 5, 1).toISOString() }),
      row({ tmdbId: 3, seenAt: new Date(2026, 6, 1).toISOString() }),
    ];

    const stats = buildWrapped(baseInput({ watched }));

    assert.equal(stats.totalWatched, 2);
  });

  test("separa películas y series y estima horas", () => {
    const watched = [
      row({ tmdbId: 1, mediaType: "movie" }),
      row({ tmdbId: 2, mediaType: "movie" }),
      row({ tmdbId: 3, mediaType: "tv" }),
    ];

    const stats = buildWrapped(baseInput({ watched }));

    assert.equal(stats.movieCount, 2);
    assert.equal(stats.seriesCount, 1);
    assert.ok(stats.approxHours > 0);
  });

  test("topGenres da el % correcto sobre las etiquetas del año", () => {
    const watched = [
      row({ tmdbId: 1, genres: ["Comedia"] }),
      row({ tmdbId: 2, genres: ["Comedia"] }),
      row({ tmdbId: 3, genres: ["Drama"] }),
    ];

    const stats = buildWrapped(baseInput({ watched }));

    assert.equal(stats.topGenres[0].name, "Comedia");
    assert.equal(stats.topGenres[0].percent, 67);
  });

  test("longestStreak encuentra la racha más larga, no la actual", () => {
    const watched = [
      row({ tmdbId: 1, seenAt: new Date(2026, 0, 1).toISOString() }),
      row({ tmdbId: 2, seenAt: new Date(2026, 0, 2).toISOString() }),
      row({ tmdbId: 3, seenAt: new Date(2026, 0, 3).toISOString() }),
      // hueco
      row({ tmdbId: 4, seenAt: new Date(2026, 5, 10).toISOString() }),
    ];

    const stats = buildWrapped(baseInput({ watched }));

    assert.equal(stats.longestStreak, 3);
  });

  test("peakDay exige al menos 2 títulos el mismo día", () => {
    const watched = [
      row({ tmdbId: 1, seenAt: new Date(2026, 7, 15, 10).toISOString(), title: "A" }),
      row({ tmdbId: 2, seenAt: new Date(2026, 7, 15, 20).toISOString(), title: "B" }),
      row({ tmdbId: 3, seenAt: new Date(2026, 7, 16, 10).toISOString(), title: "C" }),
    ];

    const stats = buildWrapped(baseInput({ watched }));

    assert.equal(stats.peakDay?.count, 2);
    assert.deepEqual(stats.peakDay?.titles.sort(), ["A", "B"]);
  });

  test("El Canon separa progreso de siempre y el de este año", () => {
    const watched = [
      row({ tmdbId: 10, mediaType: "movie", seenAt: new Date(2025, 0, 1).toISOString() }),
      row({ tmdbId: 11, mediaType: "movie", seenAt: new Date(2026, 0, 1).toISOString() }),
      row({ tmdbId: 12, mediaType: "movie", seenAt: new Date(2026, 0, 2).toISOString() }),
      // no es de El Canon, no debe contar
      row({ tmdbId: 99, mediaType: "movie", seenAt: new Date(2026, 0, 3).toISOString() }),
    ];

    const stats = buildWrapped(
      baseInput({ watched, canonIds: new Set([10, 11, 12]) })
    );

    assert.equal(stats.canonTotalProgress, 3);
    assert.equal(stats.canonThisYear, 2);
  });

  test("achievementsThisYear filtra por año y resuelve el nombre de la familia", () => {
    const stats = buildWrapped(
      baseInput({
        achievementUnlocks: [
          { key: "total_visto", level: 2, unlockedAt: new Date(2026, 3, 1).toISOString() },
          { key: "racha", level: 1, unlockedAt: new Date(2025, 3, 1).toISOString() },
          { key: "key_inexistente", level: 1, unlockedAt: new Date(2026, 3, 1).toISOString() },
        ],
      })
    );

    assert.equal(stats.achievementsThisYear.length, 1);
    assert.equal(stats.achievementsThisYear[0].familyName, "Total visto");
    assert.equal(stats.achievementsThisYear[0].tierName, "Plata");
    assert.equal(stats.achievementsTotalUnlocked, 3);
  });

  test("pendiente más antiguo calcula los meses desde now", () => {
    const now = new Date(2026, 11, 25);
    const savedAt = new Date(2026, 3, 25).getTime(); // 8 meses antes

    const stats = buildWrapped(
      baseInput({
        now,
        pendingOldest: { title: "Perfect Days", savedAt },
      })
    );

    assert.equal(stats.oldestPendingTitle, "Perfect Days");
    assert.equal(stats.oldestPendingMonths, 8);
  });

  test("sin historial, los campos opcionales quedan vacíos sin romper", () => {
    const stats = buildWrapped(baseInput());

    assert.equal(stats.totalWatched, 0);
    assert.equal(stats.topGenres.length, 0);
    assert.equal(stats.peakMonth, undefined);
    assert.equal(stats.peakDay, undefined);
    assert.equal(stats.lastOfYear, undefined);
  });
});
