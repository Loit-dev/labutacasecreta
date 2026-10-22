import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { buildRecommendationReason } from "@/lib/recommendation/prompt";

const item = (
  genreIds: number[],
  voteAverage = 7.2,
  voteCount = 9000
) => ({ genreIds, voteAverage, voteCount });

describe("buildRecommendationReason", () => {
  test("menciona el género solo si el título lo tiene", () => {
    const profile = { preferredGenre: "thriller" };

    assert.ok(
      buildRecommendationReason(profile, item([53])).includes(
        "thriller"
      )
    );

    assert.ok(
      !buildRecommendationReason(profile, item([35])).includes(
        "thriller"
      )
    );
  });

  test("menciona el ánimo solo si encaja", () => {
    const profile = { mood: "laugh" };

    assert.ok(
      buildRecommendationReason(profile, item([35])).includes(
        "sonrisa"
      )
    );

    assert.ok(
      !buildRecommendationReason(profile, item([18])).includes(
        "sonrisa"
      )
    );
  });

  test("«joya oculta» solo si de verdad es poco conocida", () => {
    const profile = { discoveryMode: "hidden-gem" as const };

    assert.ok(
      buildRecommendationReason(
        profile,
        item([18], 7.8, 900)
      ).includes("joya")
    );

    assert.ok(
      !buildRecommendationReason(
        profile,
        item([18], 7.8, 90000)
      ).includes("joya")
    );
  });

  test("si no hay nada que decir, usa la nota (sin inventar)", () => {
    const reason = buildRecommendationReason(
      { mood: "laugh" },
      item([18], 7.234)
    );

    assert.equal(
      reason,
      "Muy bien valorada por el público (7.2 en TMDb)."
    );
  });

  test("une como mucho dos motivos", () => {
    const reason = buildRecommendationReason(
      {
        preferredGenre: "comedy",
        mood: "laugh",
        company: "friends",
      },
      item([35, 28])
    );

    assert.equal(
      (reason.match(/ y /g) ?? []).length,
      1
    );
  });

  test("«infantil y familiar» dice que es apta para familia, aunque vayan en pareja", () => {
    const reason = buildRecommendationReason(
      { preferredGenre: "family", company: "partner" },
      item([16, 10751, 35])
    );

    assert.ok(reason.includes("en familia"), reason);
    assert.ok(!reason.includes("en pareja"), reason);
  });

  test("en pareja normal sigue diciendo que va bien en pareja", () => {
    const reason = buildRecommendationReason(
      { preferredGenre: "comedy", company: "partner" },
      item([35, 10749])
    );

    assert.ok(reason.includes("en pareja"), reason);
  });

  test("dos títulos del mismo lote, con el mismo género y ánimo, no repiten la frase exacta", () => {
    const profile = {
      preferredGenre: "scifi",
      mood: "adventure",
    };

    const usedReasons = new Set<string>();

    // Ambos títulos encajan por los mismos dos motivos (ciencia ficción +
    // aventura): sin el Set compartido, salía la misma frase dos veces.
    const first = buildRecommendationReason(
      profile,
      item([878, 12], 8.6),
      usedReasons
    );

    const second = buildRecommendationReason(
      profile,
      item([878, 28], 7.8),
      usedReasons
    );

    assert.notEqual(first, second);
  });

  test("añade la primera frase de la sinopsis, tal cual", () => {
    const reason = buildRecommendationReason(
      { preferredGenre: "scifi" },
      {
        ...item([878]),
        overview:
          "Ryland Grace se despierta solo en una nave espacial sin recordar cómo llegó allí. Debe resolver el misterio antes de que sea tarde.",
      }
    );

    assert.ok(
      reason.includes(
        "Ryland Grace se despierta solo en una nave espacial sin recordar cómo llegó allí."
      ),
      reason
    );

    // No se cuela el resto de la sinopsis, solo la primera frase
    assert.ok(
      !reason.includes("Debe resolver el misterio"),
      reason
    );
  });

  test("sin sinopsis, o con una demasiado corta/larga, no añade nada raro", () => {
    const withoutOverview = buildRecommendationReason(
      { preferredGenre: "scifi" },
      item([878])
    );

    assert.equal(
      withoutOverview,
      "Te la recomiendo porque encaja con tus ganas de ciencia ficción."
    );

    const withTinyOverview = buildRecommendationReason(
      { preferredGenre: "scifi" },
      { ...item([878]), overview: "Temporada 2." }
    );

    assert.ok(!withTinyOverview.includes("Temporada 2."));
  });

  test("dos títulos con los mismos motivos ya no dependen solo de la nota: la sinopsis los diferencia", () => {
    const profile = {
      preferredGenre: "scifi",
      mood: "adventure",
    };

    const usedReasons = new Set<string>();

    const first = buildRecommendationReason(
      profile,
      {
        ...item([878, 12], 8.6),
        overview:
          "Un ingeniero despierta en Marte tras un accidente y debe sobrevivir solo.",
      },
      usedReasons
    );

    const second = buildRecommendationReason(
      profile,
      {
        ...item([878, 28], 7.8),
        overview:
          "Un cazador llega a un planeta hostil en busca del mejor adversario de su vida.",
      },
      usedReasons
    );

    assert.notEqual(first, second);
    assert.ok(first.includes("Marte"), first);
    assert.ok(second.includes("cazador"), second);
  });
});
