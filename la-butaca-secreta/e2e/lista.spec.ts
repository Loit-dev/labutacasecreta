import { expect, test } from "@playwright/test";

import { completeQuiz, mockApi, visibleTitles } from "./helpers";

// «Mi lista» (guardar para luego): ya no hay botón «Mi lista (n)» en la
// portada — lo guardado se ve en Mi cuenta → Pendientes —, así que aquí
// se comprueba que guardar/quitar funciona y se recuerda en el
// dispositivo.
test.describe("Mi lista", () => {
  test("guardar, recordarlo al volver y quitar", async ({ page }) => {
    await mockApi(page);
    await completeQuiz(page);

    const [title] = await visibleTitles(page);

    await page
      .getByRole("button", { name: `Guardar en mi lista: ${title}` })
      .first()
      .click();

    const saved = page
      .getByRole("button", { name: `Guardada, quitar de mi lista: ${title}` })
      .first();

    await expect(saved).toHaveAttribute("aria-pressed", "true");

    // Queda guardado en el navegador
    await expect
      .poll(() =>
        page.evaluate(() =>
          (localStorage.getItem("lbs:list") ?? "").length > 2
        )
      )
      .toBe(true);

    // Y se puede quitar
    await saved.click();

    await expect(
      page
        .getByRole("button", { name: `Guardar en mi lista: ${title}` })
        .first()
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("también se puede guardar desde los detalles", async ({ page }) => {
    await mockApi(page);
    await completeQuiz(page);

    const [title] = await visibleTitles(page);

    await page
      .getByRole("button", { name: `Ver detalles de ${title}` })
      .first()
      .click();

    const dialog = page.getByRole("dialog", {
      name: `Detalles de ${title}`,
    });

    await dialog
      .getByRole("button", { name: `Guardar en mi lista: ${title}` })
      .click();

    await expect(
      dialog.getByRole("button", {
        name: `Guardada, quitar de mi lista: ${title}`,
      })
    ).toBeVisible();

    await page.keyboard.press("Escape");

    // La tarjeta lo refleja también
    await expect(
      page
        .getByRole("button", { name: `Guardada, quitar de mi lista: ${title}` })
        .first()
    ).toHaveAttribute("aria-pressed", "true");
  });
});
