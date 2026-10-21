import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  platformOfChannel,
  premieresFrom,
  premiereNote,
  type TvmazeEpisode,
} from "@/lib/tvmaze";

function ep(over: {
  season?: number;
  number?: number | null;
  airdate?: string;
  type?: string;
  showId?: number;
  channel?: string | null;
  imdb?: string | null;
}): TvmazeEpisode {
  return {
    season: over.season ?? 1,
    number: over.number === undefined ? 1 : over.number,
    airdate: over.airdate ?? "2026-10-21",
    type: over.type ?? "regular",
    _embedded: {
      show: {
        id: over.showId ?? 1,
        name: "Serie",
        webChannel:
          over.channel === null ? null : { name: over.channel ?? "Netflix" },
        externals: { imdb: over.imdb ?? "tt1", thetvdb: 99 },
      },
    },
  };
}

describe("TVmaze", () => {
  test("reconoce las plataformas por su nombre", () => {
    assert.equal(platformOfChannel("Netflix"), "netflix");
    assert.equal(platformOfChannel("Prime Video"), "prime");
    assert.equal(platformOfChannel("Disney+"), "disney");
    assert.equal(platformOfChannel("HBO Max"), "max");
    assert.equal(platformOfChannel("Start"), null);
    assert.equal(platformOfChannel(undefined), null);
  });

  test("solo se queda con el primer episodio de cada temporada", () => {
    const found = premieresFrom([
      ep({ showId: 1, number: 1 }),
      ep({ showId: 1, number: 2 }),
      ep({ showId: 2, number: null }),
    ]);

    assert.equal(found.length, 1);
    assert.equal(found[0].showId, 1);
    assert.equal(found[0].platform, "netflix");
    assert.equal(found[0].imdb, "tt1");
  });

  test("ignora canales ajenos, especiales y fechas raras", () => {
    const found = premieresFrom([
      ep({ showId: 1, channel: "Mango TV" }),
      ep({ showId: 2, channel: null }),
      ep({ showId: 3, type: "significant_special" }),
      ep({ showId: 4, airdate: "ayer" }),
      ep({ showId: 5, channel: "Max" }),
    ]);

    assert.deepEqual(found.map((p) => p.showId), [5]);
  });

  test("no repite la misma temporada y separa temporadas distintas", () => {
    const found = premieresFrom([
      ep({ showId: 1, season: 2 }),
      ep({ showId: 1, season: 2 }),
      ep({ showId: 1, season: 3 }),
    ]);

    assert.deepEqual(found.map((p) => p.season), [2, 3]);
  });

  test("nota: serie nueva o temporada nueva", () => {
    assert.equal(premiereNote(1), "Estreno de la serie");
    assert.equal(premiereNote(3), "Nueva temporada (3)");
  });
});
