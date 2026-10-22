import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  CATALOG_GENRES,
  catalogParams,
  genreBySlug,
  genreSlugForLabel,
  platformBySlug,
  platformKeyForName,
} from "@/lib/catalog";
import { PreferredGenreMap } from "@/lib/recommendation/filters";
import { ALL_PLATFORM_KEYS } from "@/lib/platforms";

describe("catálogo de páginas género+plataforma", () => {
  test("cada género del catálogo existe en el mapa del cuestionario", () => {
    for (const genre of CATALOG_GENRES) {
      assert.ok(
        PreferredGenreMap[genre.key],
        `"${genre.key}" no está en PreferredGenreMap`
      );
    }
  });

  test("genreBySlug encuentra por slug y no inventa géneros", () => {
    assert.equal(genreBySlug("terror")?.key, "horror");
    assert.equal(genreBySlug("ciencia-ficcion")?.key, "scifi");
    assert.equal(genreBySlug("no-existe"), undefined);
  });

  test("platformBySlug encuentra por clave y no inventa plataformas", () => {
    assert.equal(platformBySlug("netflix")?.label, "Netflix");
    assert.equal(platformBySlug("no-existe"), undefined);
  });

  test("catalogParams genera todas las combinaciones, sin repetir", () => {
    const params = catalogParams();

    assert.equal(
      params.length,
      CATALOG_GENRES.length * ALL_PLATFORM_KEYS.length
    );

    const seen = new Set(
      params.map(({ genero, plataforma }) => `${genero}/${plataforma}`)
    );

    assert.equal(seen.size, params.length);

    for (const { plataforma } of params) {
      assert.ok(ALL_PLATFORM_KEYS.includes(plataforma));
    }
  });

  test("genreSlugForLabel encuentra el slug a partir del nombre que muestra una ficha", () => {
    assert.equal(genreSlugForLabel("Comedia"), "comedia");
    assert.equal(genreSlugForLabel("ciencia ficción"), "ciencia-ficcion");

    // Géneros que la ficha puede mostrar pero que no tienen página de
    // catálogo propia (no están en PreferredGenreMap)
    assert.equal(genreSlugForLabel("Documental"), undefined);
    assert.equal(genreSlugForLabel("Animación"), undefined);
  });

  test("platformKeyForName encuentra la clave a partir del nombre que muestra una ficha", () => {
    assert.equal(platformKeyForName("Netflix"), "netflix");
    assert.equal(platformKeyForName("prime video"), "prime");
    assert.equal(platformKeyForName("Apple TV+"), undefined);
  });
});
