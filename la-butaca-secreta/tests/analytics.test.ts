import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";

import { cleanData, track } from "@/lib/analytics";

type FakeWindow = {
  va?: (...args: unknown[]) => void;
  vaq?: unknown[];
};

function setWindow(value: unknown) {
  (globalThis as unknown as { window: unknown }).window = value;
}

describe("cleanData", () => {
  test("deja solo valores simples", () => {
    assert.deepEqual(
      cleanData({
        a: "x",
        b: 3,
        c: true,
        d: null,
        e: undefined,
        f: Number.NaN,
      }),
      { a: "x", b: 3, c: true }
    );
  });

  test("recorta textos largos", () => {
    const clean = cleanData({ a: "x".repeat(500) });

    assert.equal(clean?.a, "x".repeat(100));
  });

  test("sin datos válidos, no hay datos", () => {
    assert.equal(cleanData(), undefined);
    assert.equal(cleanData({ a: null }), undefined);
  });
});

describe("track", () => {
  beforeEach(() => setWindow({}));

  test("si el script aún no ha cargado, guarda el evento en cola", () => {
    track("answer", { question: "mood", value: "laugh" });

    const win = (globalThis as unknown as { window: FakeWindow }).window;

    assert.deepEqual(win.vaq, [
      [
        "event",
        {
          name: "answer",
          data: { question: "mood", value: "laugh" },
        },
      ],
    ]);
  });

  test("si el script está, le entrega el evento", () => {
    const calls: unknown[][] = [];

    setWindow({ va: (...args: unknown[]) => calls.push(args) });

    track("more_clicked", { type: "movie" });

    assert.deepEqual(calls, [
      [
        "event",
        { name: "more_clicked", data: { type: "movie" } },
      ],
    ]);
  });

  test("nunca lanza errores, pase lo que pase", () => {
    setWindow({
      va: () => {
        throw new Error("roto");
      },
    });

    assert.doesNotThrow(() => track("share_open"));

    // Sin navegador (servidor)
    (globalThis as unknown as { window?: unknown }).window = undefined;

    assert.doesNotThrow(() => track("share_open"));
  });
});
