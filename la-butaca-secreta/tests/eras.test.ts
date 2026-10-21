import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  RECENT_YEARS,
  recentPoolFilters,
} from "@/lib/recommendation/eras";
import type { RecommendationFilters } from "@/lib/recommendation/filters";

const base: RecommendationFilters = {
  type: "movie",
  withGenres: [878],
  withoutGenres: [],
};

describe("recentPoolFilters", () => {
  test("en las búsquedas por nota añade una con títulos recientes", () => {
    const recent = recentPoolFilters(
      { ...base, sortBy: "vote_average.desc", minVotes: 100 },
      2026
    );

    assert.equal(recent?.releaseAfter, `${2026 - RECENT_YEARS}-01-01`);
    assert.equal(recent?.sortBy, "vote_average.desc");
    assert.equal(recent?.minVotes, 100);
    assert.deepEqual(recent?.withGenres, [878]);
  });

  test("no hace nada si no se ordena por nota", () => {
    assert.equal(recentPoolFilters(base, 2026), null);
  });

  test("respeta la época si la persona ya eligió una", () => {
    assert.equal(
      recentPoolFilters(
        { ...base, sortBy: "vote_average.desc", releaseAfter: "2023-01-01" },
        2026
      ),
      null
    );

    assert.equal(
      recentPoolFilters(
        { ...base, sortBy: "vote_average.desc", releaseBefore: "2005-12-31" },
        2026
      ),
      null
    );
  });
});
