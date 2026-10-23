import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

import { addShown, readRecentlyShown } from "@/lib/shown";

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

function daysAgo(n: number): string {
  const date = new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  return date.toISOString().slice(0, 10);
}

describe("mostrados recientemente (Butaca Exprés)", () => {
  let data: Map<string, string>;

  beforeEach(() => {
    data = installFakeStorage();
  });

  test("empieza vacío", () => {
    assert.deepEqual(readRecentlyShown("movie"), []);
  });

  test("lo mostrado hoy se excluye mañana", () => {
    addShown("movie", [1, 2, 3], daysAgo(0));

    assert.deepEqual(readRecentlyShown("movie"), [1, 2, 3]);
  });

  test("películas y series van por separado", () => {
    addShown("movie", [1], daysAgo(0));
    addShown("tv", [2], daysAgo(0));

    assert.deepEqual(readRecentlyShown("movie"), [1]);
    assert.deepEqual(readRecentlyShown("tv"), [2]);
  });

  test("pasados los 10 días, un título puede volver a salir", () => {
    addShown("movie", [1], daysAgo(11));
    addShown("movie", [2], daysAgo(3));

    assert.deepEqual(readRecentlyShown("movie"), [2]);
  });

  test("varios días se van acumulando", () => {
    addShown("movie", [1], daysAgo(2));
    addShown("movie", [2, 3], daysAgo(1));
    addShown("movie", [4], daysAgo(0));

    assert.deepEqual(readRecentlyShown("movie"), [1, 2, 3, 4]);
  });

  test("no añade nada si la lista de ids está vacía", () => {
    addShown("movie", [], daysAgo(0));

    assert.deepEqual(readRecentlyShown("movie"), []);
    assert.equal(data.has("lbs:shown:movie"), false);
  });

  test("al guardar, se descarta lo que ya tenía más de 10 días", () => {
    addShown("movie", [1], daysAgo(15));
    addShown("movie", [2], daysAgo(0));

    // El guardado del día 0 ya debería haber limpiado el de hace 15 días
    assert.deepEqual(readRecentlyShown("movie"), [2]);
  });

  test("datos corruptos o inválidos no rompen nada", () => {
    data.set("lbs:shown:movie", "{no es json");

    assert.deepEqual(readRecentlyShown("movie"), []);

    data.set(
      "lbs:shown:movie",
      JSON.stringify([{ id: 1, date: daysAgo(0) }, "x", { id: 2 }, null])
    );

    assert.deepEqual(readRecentlyShown("movie"), [1]);
  });

  test("sin localStorage disponible, funciona igual", () => {
    (globalThis as unknown as { window: unknown }).window = {
      get localStorage() {
        throw new Error("bloqueado");
      },
    };

    assert.deepEqual(readRecentlyShown("movie"), []);
    assert.doesNotThrow(() => addShown("movie", [1], daysAgo(0)));
  });
});
