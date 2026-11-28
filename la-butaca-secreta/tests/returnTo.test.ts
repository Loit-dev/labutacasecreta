import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { loginHref, safePath } from "@/lib/returnTo";

describe("volver tras iniciar sesión", () => {
  test("solo rutas de esta web", () => {
    assert.equal(safePath("/admin/uso"), "/admin/uso");
    assert.equal(safePath("/lista/canon?x=1"), "/lista/canon?x=1");
    assert.equal(safePath("//evil.com"), null);
    assert.equal(safePath("https://evil.com"), null);
    assert.equal(safePath("/entrar"), null);
    assert.equal(safePath(""), null);
    assert.equal(safePath(null), null);
  });

  test("enlace a /entrar con volver", () => {
    assert.equal(loginHref("/admin/uso"), "/entrar?volver=%2Fadmin%2Fuso");
    assert.equal(loginHref("/"), "/entrar");
    assert.equal(loginHref("//evil.com"), "/entrar");
  });
});
