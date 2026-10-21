import { expect, test } from "@playwright/test";

import { completeQuiz, mockApi, visibleTitles } from "./helpers";

test.describe("Ventanas (detalles y compartir)", () => {
  test("los detalles se abren, atrapan el foco y se cierran con Escape", async ({
    page,
  }) => {
    await mockApi(page);
    await completeQuiz(page);

    const [title] = await visibleTitles(page);

    const open = page
      .getByRole("button", { name: `Ver detalles de ${title}` })
      .first();

    await open.click();

    const dialog = page.getByRole("dialog", {
      name: `Detalles de ${title}`,
    });

    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Netflix")).toBeVisible();
    await expect(dialog.getByText("Prime Video")).toBeVisible();

    // El foco empieza dentro y no se escapa con Tab
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");

      const inside = await page.evaluate(() =>
        !!document.activeElement?.closest('[role="dialog"]')
      );

      expect(inside).toBe(true);
    }

    // El fondo no se desplaza mientras está abierta
    expect(
      await page.evaluate(() => document.body.style.overflow)
    ).toBe("hidden");

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();

    // Al cerrar, el scroll vuelve y el foco regresa al botón
    expect(
      await page.evaluate(() => document.body.style.overflow)
    ).not.toBe("hidden");

    await expect(open).toBeFocused();
  });

  test("compartir crea la imagen y permite descargarla", async ({
    page,
  }) => {
    await mockApi(page);
    await completeQuiz(page);

    await page
      .getByRole("button", { name: /Compartir mis sugerencias/ })
      .click();

    const dialog = page.getByRole("dialog", {
      name: "Comparte tus sugerencias",
    });

    await expect(dialog).toBeVisible();

    // La imagen aparece cuando está lista
    const preview = dialog.getByRole("img", {
      name: /Imagen con tus sugerencias/,
    });

    await expect(preview).toBeVisible({ timeout: 20_000 });

    // Es una imagen de verdad, del tamaño previsto
    const size = await preview.evaluate((img: HTMLImageElement) => ({
      w: img.naturalWidth,
      h: img.naturalHeight,
    }));

    expect(size).toEqual({ w: 1080, h: 1920 });

    const downloadPromise = page.waitForEvent("download");

    await dialog
      .getByRole("button", { name: "Descargar imagen" })
      .click();

    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(
      "mis-sugerencias-la-butaca-secreta.png"
    );

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();
  });
});
