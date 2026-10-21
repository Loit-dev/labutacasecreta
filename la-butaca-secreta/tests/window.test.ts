import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  countAvailable,
  pickWindow,
} from "@/lib/recommendation/window";

type Entry = {
  id: number;
  role?: "main" | "surprise";
};

const main = (id: number): Entry => ({ id, role: "main" });
const surprise = (id: number): Entry => ({
  id,
  role: "surprise",
});

const POOL: Entry[] = [
  main(1),
  main(2),
  surprise(3),
  main(4),
  main(5),
  surprise(6),
];

describe("pickWindow", () => {
  test("muestra dos principales y una sorpresa", () => {
    const ids = pickWindow(POOL, []).map((e) => e.id);

    assert.deepEqual(ids, [1, 2, 3]);
  });

  test("al descartar una principal entra la siguiente principal", () => {
    const ids = pickWindow(POOL, [1]).map((e) => e.id);

    assert.deepEqual(ids, [2, 4, 3]);
  });

  test("al descartar la sorpresa entra la siguiente sorpresa", () => {
    const window = pickWindow(POOL, [3]);

    assert.deepEqual(
      window.map((e) => e.id),
      [1, 2, 6]
    );

    assert.equal(window[2].role, "surprise");
  });

  test("tras pasar de tanda se muestra la siguiente", () => {
    const ids = pickWindow(POOL, [1, 2, 3]).map((e) => e.id);

    assert.deepEqual(ids, [4, 5, 6]);
  });

  test("sin sorpresas disponibles, la tercera es otra principal", () => {
    const ids = pickWindow(
      [main(1), main(2), main(3), main(4)],
      []
    ).map((e) => e.id);

    assert.deepEqual(ids, [1, 2, 3]);
  });

  test("con pocos títulos devuelve los que haya", () => {
    assert.deepEqual(
      pickWindow([main(1), surprise(2)], []).map((e) => e.id),
      [1, 2]
    );

    assert.deepEqual(pickWindow([], []), []);
  });

  test("sin dos principales se completa con sorpresas", () => {
    const ids = pickWindow(
      [main(1), surprise(2), surprise(3)],
      []
    ).map((e) => e.id);

    assert.equal(ids.length, 3);
    assert.deepEqual([...ids].sort(), [1, 2, 3]);
  });

  test("nunca devuelve un título descartado ni repetido", () => {
    for (let hiddenCount = 0; hiddenCount <= 6; hiddenCount++) {
      const hidden = POOL.slice(0, hiddenCount).map(
        (e) => e.id
      );

      const ids = pickWindow(POOL, hidden).map((e) => e.id);

      assert.equal(new Set(ids).size, ids.length);
      assert.ok(ids.every((id) => !hidden.includes(id)));
    }
  });
});

describe("countAvailable", () => {
  test("cuenta los que no están descartados", () => {
    assert.equal(countAvailable(POOL, []), 6);
    assert.equal(countAvailable(POOL, [1, 2, 99]), 4);
  });
});
