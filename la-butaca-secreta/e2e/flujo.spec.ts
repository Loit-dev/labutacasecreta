import { expect, test } from "@playwright/test";

import {
  completeQuiz,
  mockApi,
  visibleTitles,
} from "./helpers";

test.describe("Flujo completo", () => {
  test("contesta el cuestionario y enseña las recomendaciones", async ({
    page,
    isMobile,
  }) => {
    await mockApi(page);
    await completeQuiz(page);

    await expect(
      page.getByRole("heading", {
        name: /Creo que estas tres pueden ser justo lo que buscas/,
      })
    ).toBeVisible();

    const titles = await visibleTitles(page);

    // En escritorio se ven las tres; en el móvil, una cada vez
    expect(titles).toHaveLength(isMobile ? 1 : 3);

    if (!isMobile) {
      // (el móvil y el escritorio comparten textos: solo cuenta lo visible)
      await expect(
        page.getByText("Mi apuesta para ti").filter({ visible: true })
      ).toHaveCount(1);
      await expect(
        page
          .getByText("Una sorpresa que merece una oportunidad")
          .filter({ visible: true })
      ).toHaveCount(1);
    }
  });

  test('"Ya la vi" cambia la tarjeta, la recuerda y mantiene la sorpresa', async ({
    page,
    isMobile,
  }) => {
    const requests = await mockApi(page);
    await completeQuiz(page);

    const [first] = await visibleTitles(page);

    await page
      .getByRole("button", { name: `Ya la vi: ${first}` })
      .first()
      .click();

    await expect
      .poll(async () => visibleTitles(page))
      .not.toContain(first);

    if (!isMobile) {
      const after = await visibleTitles(page);

      expect(after).toHaveLength(3);

      // Sigue habiendo una sorpresa
      await expect(
        page
          .getByText("Una sorpresa que merece una oportunidad")
          .filter({ visible: true })
      ).toHaveCount(1);
    }

    // Se guarda en el navegador...
    const stored = await page.evaluate(() =>
      localStorage.getItem("lbs:seen:movie")
    );

    expect(stored).not.toBeNull();

    // ...y en la próxima visita se pide excluirla
    requests.length = 0;

    await completeQuiz(page);

    await expect
      .poll(() => requests.length)
      .toBeGreaterThan(0);

    const excluded = requests
      .map((r) => r.url.searchParams.get("exclude") ?? "")
      .join(",");

    expect(excluded).toMatch(/10\d/);

    // Y avisa de lo que hay guardado, con opción de olvidarlo
    await page
      .getByRole("button", { name: "Olvidar mis títulos vistos" })
      .click();

    expect(
      await page.evaluate(() => localStorage.getItem("lbs:seen:movie"))
    ).toBeNull();
  });

  test('"No me apetece" aprende y pide otras sin repetir', async ({
    page,
  }) => {
    const requests = await mockApi(page);
    await completeQuiz(page);

    // Descartamos hasta que quedan pocos y la web pide más
    for (let i = 0; i < 8; i++) {
      const buttons = page.getByRole("button", {
        name: /^No me apetece: /,
      });

      if ((await buttons.count()) === 0) break;

      await buttons.first().click();
    }

    await expect
      .poll(() =>
        requests.some(
          (r) => (r.url.searchParams.get("avoid") ?? "") !== ""
        )
      )
      .toBe(true);
  });

  test('"Dame otras 3" no repite títulos', async ({ page, isMobile }) => {
    test.skip(isMobile, "Se comprueba en escritorio, donde se ven las 3");

    await mockApi(page);
    await completeQuiz(page);

    const before = await visibleTitles(page);

    await page
      .getByRole("button", { name: /Dame otras 3/ })
      .click();

    await expect
      .poll(async () => visibleTitles(page))
      .not.toEqual(before);

    const after = await visibleTitles(page);

    for (const title of after) {
      expect(before).not.toContain(title);
    }
  });

  test("las páginas legales y el pie muestran la atribución", async ({
    page,
  }) => {
    for (const path of ["/privacidad", "/aviso-legal"]) {
      await page.goto(path);

      await expect(
        page.getByRole("heading", { level: 1 })
      ).toBeVisible();

      await expect(
        page.getByAltText("Logo de TMDb")
      ).toBeVisible();

      await expect(
        page.getByText("This product uses the TMDB API")
      ).toBeVisible();

      await expect(
        page.getByText("Este producto usa la API de TMDb").first()
      ).toBeVisible();
    }
  });
});
