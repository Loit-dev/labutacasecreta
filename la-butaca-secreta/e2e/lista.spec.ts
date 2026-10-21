import { expect, test } from "@playwright/test";

import { completeQuiz, mockApi, visibleTitles } from "./helpers";

test.describe("Mi lista", () => {
  test("guardar, ver la lista, recordarla y quitar", async ({ page }) => {
    await mockApi(page);
    await completeQuiz(page);

    // Sin nada guardado, el botón no aparece
    await expect(
      page.getByRole("button", { name: /^Mi lista/ })
    ).toHaveCount(0);

    const [title] = await visibleTitles(page);

    await page
      .getByRole("button", { name: `Guardar en mi lista: ${title}` })
      .first()
      .click();

    // La tarjeta lo refleja y aparece «Mi lista (1)»
    await expect(
      page
        .getByRole("button", {
          name: `Guardada, quitar de mi lista: ${title}`,
        })
        .first()
    ).toHaveAttribute("aria-pressed", "true");

    const listButton = page.getByRole("button", { name: /^Mi lista/ });

    await expect(listButton).toContainText("(1)");

    // La lista se abre y enseña el título
    await listButton.click();

    const dialog = page.getByRole("dialog", { name: "Mi lista" });

    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(title)).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();

    // Sigue ahí tras recargar la página
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: /^Mi lista/ })
    ).toContainText("(1)");

    // Quitar desde la lista
    await page.getByRole("button", { name: /^Mi lista/ }).click();

    await page
      .getByRole("button", { name: `Quitar de mi lista: ${title}` })
      .click();

    await expect(
      page.getByText("Tu lista está vacía")
    ).toBeVisible();
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

    await expect(
      page.getByRole("button", { name: /^Mi lista/ })
    ).toContainText("(1)");
  });
});
