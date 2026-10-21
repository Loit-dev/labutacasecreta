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
});
