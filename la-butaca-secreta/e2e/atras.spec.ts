import { expect, test } from "@playwright/test";

import { mockApi } from "./helpers";

test.describe("Volver a la pregunta anterior", () => {
  test("deshace la última respuesta y permite elegir otra vez", async ({
    page,
  }) => {
    await mockApi(page);

    await page.goto("/");

    await page.getByRole("button", { name: /^Solo/ }).click();

    const log = page.locator('[role="log"] > div');

    // Primera pregunta: "¿Qué te apetece hoy?" (Película / Serie)
    const first = page.locator("[data-options] button").first();

    await first.waitFor();

    const before = await log.count();

    await first.click();

    await expect.poll(() => log.count()).toBeGreaterThan(before);

    const backButton = page.getByRole("button", {
      name: /Volver a la pregunta anterior/,
    });

    await expect(backButton).toBeVisible();

    await backButton.click();

    // Vuelve a la primera pregunta y el botón desaparece (nada que deshacer)
    await expect(
      page.getByText("¿Qué te apetece hoy?")
    ).toBeVisible();

    await expect(backButton).toBeHidden();

    await expect.poll(() => log.count()).toBe(before);
  });
});
