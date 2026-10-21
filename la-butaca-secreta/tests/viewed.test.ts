import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  addSeen,
  clearSeen,
  readSeen,
} from "@/lib/viewed";

// Un localStorage falso, para probar sin navegador
function installFakeStorage() {
  const data = new Map<string, string>();

  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
      removeItem: (key: string) => {
        data.delete(key);
      },
    },
  };

  return data;
}

describe("títulos vistos", () => {
  let data: Map<string, string>;

  beforeEach(() => {
    data = installFakeStorage();
  });

  test("empieza vacío", () => {
    assert.deepEqual(readSeen("movie"), []);
  });

  test("guarda y lee, sin repetir", () => {
    addSeen("movie", 5);
    addSeen("movie", 7);
    addSeen("movie", 5);

    assert.deepEqual(readSeen("movie"), [7, 5]);
  });

  test("películas y series van por separado", () => {
    addSeen("movie", 1);
    addSeen("tv", 2);

    assert.deepEqual(readSeen("movie"), [1]);
    assert.deepEqual(readSeen("tv"), [2]);
  });

  test("clearSeen borra solo ese tipo", () => {
    addSeen("movie", 1);
    addSeen("tv", 2);

    clearSeen("movie");

    assert.deepEqual(readSeen("movie"), []);
    assert.deepEqual(readSeen("tv"), [2]);
  });

  test("guarda como mucho los 500 últimos", () => {
    for (let id = 1; id <= 520; id++) {
      addSeen("movie", id);
    }

    const seen = readSeen("movie");

    assert.equal(seen.length, 500);
    assert.equal(seen[seen.length - 1], 520);
    assert.ok(!seen.includes(1));
  });

  test("datos corruptos o inválidos no rompen nada", () => {
    data.set("lbs:seen:movie", "{no es json");

    assert.deepEqual(readSeen("movie"), []);

    data.set("lbs:seen:movie", JSON.stringify([1, "x", -3, 2.5, 4]));

    assert.deepEqual(readSeen("movie"), [1, 4]);
  });

  test("sin localStorage disponible, funciona igual", () => {
    (globalThis as unknown as { window: unknown }).window = {
      get localStorage() {
        throw new Error("bloqueado");
      },
    };

    assert.deepEqual(readSeen("movie"), []);

    assert.doesNotThrow(() => addSeen("movie", 1));
    assert.doesNotThrow(() => clearSeen("movie"));
  });
});
