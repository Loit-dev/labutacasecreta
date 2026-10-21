import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  ALL_PLATFORM_KEYS,
  parsePlatforms,
  providerIdsFor,
  serializePlatforms,
} from "@/lib/platforms";

describe("plataformas", () => {
  test("lee solo claves válidas y sin repetidos", () => {
    assert.deepEqual(parsePlatforms("netflix,foo,netflix,max"), [
      "netflix",
      "max",
    ]);

    assert.deepEqual(parsePlatforms(""), []);
    assert.deepEqual(parsePlatforms(undefined), []);
  });

  test("devuelve los ids de TMDb de las elegidas (con sus planes con anuncios)", () => {
    assert.deepEqual(providerIdsFor("netflix"), [8, 1796]);
    assert.deepEqual(providerIdsFor("prime,filmin"), [119, 2100, 63]);
  });

  test("sin elección válida se usan todas", () => {
    const all = providerIdsFor(undefined);

    assert.equal(all.length, 8);
    assert.deepEqual(providerIdsFor("nada"), all);
  });

  test("si están todas marcadas, la URL no lleva nada", () => {
    assert.equal(serializePlatforms(ALL_PLATFORM_KEYS), "");
    assert.equal(serializePlatforms([]), "");
    assert.equal(serializePlatforms(["max", "netflix"]), "netflix,max");
  });
});
