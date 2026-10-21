import { expect, test } from "@playwright/test";

import { completeQuiz, mockApi } from "./helpers";

// Los pósters del TMDb de mentira no pasan por el optimizador de Next
test.beforeEach(async ({ page }) => {
  await page.route("**/_next/image**", (route) =>
    route.fulfill({
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64"
      ),
      contentType: "image/png",
    })
  );
});

test.describe("Compartir con enlace", () => {
  test("el enlace abre las mismas recomendaciones", async ({
    page,
    context,
  }) => {
    await mockApi(page);
    await completeQuiz(page);

    await page
      .getByRole("button", { name: /Compartir mis sugerencias/ })
      .click();

    const dialog = page.getByRole("dialog", {
      name: "Comparte tus sugerencias",
    });

    const input = dialog.getByLabel(
      "Enlace para compartir estas recomendaciones"
    );

    await expect(input).toBeVisible();

    const link = await input.inputValue();

    expect(link).toMatch(/\/r\/movie-\d+m-\d+m-\d+s$/);

    // Copiar enlace avisa
    await dialog.getByRole("button", { name: "Copiar enlace" }).click();

    await expect(dialog.getByRole("status")).toContainText(/copiado|copiarlo/);

    // Otra persona abre el enlace (sin haber hecho el cuestionario)
    const other = await context.newPage();

    await other.route("**/_next/image**", (route) =>
      route.fulfill({
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          "base64"
        ),
        contentType: "image/png",
      })
    );

    await other.goto(new URL(link).pathname);

    await expect(
      other.getByRole("heading", { level: 1 })
    ).toContainText("Te han compartido sus sugerencias");

    await expect(other.getByRole("article")).toHaveCount(3);

    await expect(
      other.getByText("Compartida 10", { exact: false }).first()
    ).toBeVisible();

    // Se pueden ver detalles y guardar, pero no hay descartar
    await expect(
      other.getByRole("button", { name: /^No me apetece/ })
    ).toHaveCount(0);

    await other
      .getByRole("button", { name: /^Guardar en mi lista/ })
      .first()
      .click();

    await expect(
      other.getByRole("button", { name: /^Mi lista/ })
    ).toContainText("(1)");

    await expect(
      other.getByRole("link", { name: /hacer el cuestionario/ })
    ).toBeVisible();
  });

  test("un enlace con forma rara da 404", async ({ page }) => {
    for (const bad of ["movie-abc", "libro-1m", "movie-1m-2m-3m-4m-5m-6m-7m"]) {
      const response = await page.goto(`/r/${bad}`);

      expect(response?.status(), bad).toBe(404);
    }
  });

  test("si un título no existe, se enseñan los demás", async ({ page }) => {
    await page.route("**/_next/image**", (route) =>
      route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("") })
    );

    await page.goto("/r/tv-101m-999m-103s");

    await expect(page.getByRole("article")).toHaveCount(2);
  });

  test("si ninguno existe, lo explica y ofrece el cuestionario", async ({
    page,
  }) => {
    await page.goto("/r/movie-999m");

    await expect(
      page.getByText("No he podido cargar estas recomendaciones")
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Hacer el cuestionario" })
    ).toBeVisible();
  });

  test("la vista previa del enlace es una imagen", async ({ page }) => {
    await page.goto("/r/movie-101m-102m-103s");

    const og = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");

    expect(og).toBeTruthy();

    const response = await page.request.get(new URL(og as string).pathname);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");

    // Los enlaces personales no se indexan
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/
    );
  });
});
