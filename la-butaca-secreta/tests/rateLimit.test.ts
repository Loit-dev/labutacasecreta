import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { isRateLimited } from "@/lib/rateLimit";

describe("isRateLimited", () => {
  test("deja pasar hasta el límite y luego bloquea", () => {
    const key = `test-${Date.now()}-${Math.random()}`;

    for (let i = 0; i < 3; i++) {
      assert.equal(isRateLimited(key, 3, 60_000), false);
    }

    assert.equal(isRateLimited(key, 3, 60_000), true);
  });

  test("claves distintas no se mezclan entre sí", () => {
    const a = `a-${Date.now()}-${Math.random()}`;
    const b = `b-${Date.now()}-${Math.random()}`;

    for (let i = 0; i < 2; i++) isRateLimited(a, 2, 60_000);

    assert.equal(isRateLimited(b, 2, 60_000), false);
  });

  test("se reinicia pasada la ventana de tiempo", () => {
    const key = `window-${Date.now()}-${Math.random()}`;

    assert.equal(isRateLimited(key, 1, 20), false);
    assert.equal(isRateLimited(key, 1, 20), true);
  });
});
