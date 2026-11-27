import { expect, test } from "@playwright/test";

import { mockApi } from "./helpers";

test.describe("Pestaña Listas", () => {
  test("abre una lista oficial en su propia página y «atrás» vuelve a Listas", async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto("/");

    await page.getByRole("tab", { name: /Listas/ }).click();

    // La pestaña queda en la dirección
    await expect(page).toHaveURL(/\?tab=listas/);
    await expect(
      page.getByRole("heading", { name: /Listas oficiales/i })
    ).toBeVisible();

    await page.getByRole("link", { name: /El Canon/ }).click();

    await expect(page).toHaveURL(/\/lista\/canon$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "El Canon" })
    ).toBeVisible();

    // Cuadrícula numerada (las 250 del canon, resueltas contra el
    // TMDb de mentira)
    await expect(page.getByRole("listitem").first()).toBeVisible();

    // Pestaña de comentarios
    await page.getByRole("tab", { name: /Comentario/ }).click();
    await expect(page.getByRole("tab", { name: /Comentario/ })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    await page.goBack();

    await expect(page).toHaveURL(/\?tab=listas/);
    await expect(page.getByRole("tab", { name: /Listas/ })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("una dirección de lista que no existe da 404", async ({ page }) => {
    const response = await page.goto("/lista/no-existe");

    expect(response?.status()).toBe(404);
  });

  test("/lista/canon#comentarios abre directamente los comentarios", async ({
    page,
  }) => {
    await page.goto("/lista/canon#comentarios");

    await expect(page.getByRole("tab", { name: /Comentario/ })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
});
