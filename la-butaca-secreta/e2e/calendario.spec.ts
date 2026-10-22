import { expect, test } from "@playwright/test";

import { mockApi } from "./helpers";

function today() {
  const now = new Date();

  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    month: `${now.getFullYear()}-${pad(now.getMonth() + 1)}`,
    day: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
  };
}

function entry(
  id: number,
  title: string,
  date: string,
  platforms: string[]
) {
  return {
    id,
    type: "tv",
    title,
    date,
    poster: null,
    overview: `Sinopsis de ${title}.`,
    rating: 7.9,
    popularity: 10 - id,
    platforms,
  };
}

test.describe("Calendario de estrenos", () => {
  test("muestra el mes, los logos del día y el detalle al pulsar", async ({
    page,
  }) => {
    await mockApi(page);

    const { month, day } = today();

    const requested: string[] = [];

    await page.route("**/api/calendar**", async (route) => {
      const url = new URL(route.request().url());

      requested.push(url.searchParams.get("month") ?? "");

      await route.fulfill({
        json: {
          month: url.searchParams.get("month"),
          logos: {},
          days: {
            [day]: [
              {
                ...entry(1, "Serie Uno", day, ["netflix"]),
                note: "Nueva temporada (2)",
                confirmed: true,
              },
              entry(2, "Serie Dos", day, ["max", "netflix"]),
            ],
          },
        },
      });
    });

    await page.goto("/");

    await page.getByRole("tab", { name: /Calendario/ }).click();

    const dialog = page.getByRole("tabpanel", {
      name: /Calendario/,
    });

    await expect(dialog).toBeVisible();

    // Hoy está seleccionado y enseña sus estrenos
    await expect(
      dialog.getByRole("link", { name: /Serie Uno/ })
    ).toBeVisible();

    await expect(
      dialog.getByRole("link", { name: /Serie Dos/ })
    ).toBeVisible();

    // Nota de temporada nueva y sello de «dos fuentes»
    await expect(dialog.getByText(/Nueva temporada \(2\)/)).toBeVisible();
    await expect(dialog.getByText(/2 fuentes/).first()).toBeVisible();

    await expect(
      dialog.getByRole("button", { name: /2 estrenos/ })
    ).toBeVisible();

    expect(requested).toContain(month);

    // Otro día, sin estrenos
    await dialog
      .getByRole("button", { name: /: 0 estrenos/ })
      .first()
      .click();

    await expect(
      dialog.getByText("No hay estrenos este día en tus plataformas.")
    ).toBeVisible();

    // Cambiar de mes pide ese mes
    await dialog.getByRole("button", { name: "Mes siguiente" }).click();

    await expect.poll(() => requested.length).toBeGreaterThan(1);

    // Y se puede volver al recomendador
    await page.getByRole("tab", { name: /Recomendador/ }).click();

    await expect(dialog).toBeHidden();

    await expect(
      page.getByRole("button", { name: /^Solo/ })
    ).toBeVisible();
  });

  test("solo enseña las plataformas que has marcado", async ({ page }) => {
    await mockApi(page);

    const { day } = today();

    await page.route("**/api/calendar**", (route) =>
      route.fulfill({
        json: {
          month: day.substring(0, 7),
          logos: {},
          days: {
            [day]: [
              entry(1, "Solo en Max", day, ["max"]),
              entry(2, "Solo en Netflix", day, ["netflix"]),
            ],
          },
        },
      })
    );

    await page.goto("/");

    const group = page.getByRole("group", { name: "Tus plataformas" });

    for (const name of ["Prime Video", "Disney+", "Max", "Filmin"]) {
      await group.getByRole("button", { name }).click();
    }

    await page.getByRole("tab", { name: /Calendario/ }).click();

    const dialog = page.getByRole("tabpanel", {
      name: /Calendario/,
    });

    await expect(
      dialog.getByRole("link", { name: /Solo en Netflix/ })
    ).toBeVisible();

    await expect(
      dialog.getByRole("link", { name: /Solo en Max/ })
    ).toHaveCount(0);
  });

  test("si falla la carga, lo dice", async ({ page }) => {
    await mockApi(page);

    await page.route("**/api/calendar**", (route) =>
      route.fulfill({ status: 502, json: { error: "x" } })
    );

    await page.goto("/");

    await page.getByRole("tab", { name: /Calendario/ }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "No he podido cargar" })
    ).toBeVisible();
  });

  test("al volver al recomendador, todo sigue como estaba", async ({
    page,
  }) => {
    await mockApi(page);

    await page.route("**/api/calendar**", (route) =>
      route.fulfill({ json: { month: "2026-10", logos: {}, days: {} } })
    );

    await page.goto("/");

    await page.getByRole("button", { name: /^Solo/ }).click();

    const first = page.locator("[data-options] button").first();

    await first.waitFor();
    await first.click();

    const log = page.locator('[role="log"] > div');

    await expect.poll(() => log.count()).toBeGreaterThan(0);

    const before = await log.count();

    await page.getByRole("tab", { name: /Calendario/ }).click();
    await page.getByRole("tab", { name: /Recomendador/ }).click();

    expect(await log.count()).toBe(before);
  });

  test("avisa de los títulos sin contrastar en TMDb", async ({ page }) => {
    await mockApi(page);

    const { day } = today();

    await page.route("**/api/calendar**", async (route) => {
      const url = new URL(route.request().url());

      await route.fulfill({
        json: {
          month: url.searchParams.get("month"),
          logos: {},
          days: {
            [day]: [
              {
                ...entry(3, "Rumor sin ficha", day, ["disney"]),
                id: -1,
                unverified: true,
              },
            ],
          },
        },
      });
    });

    await page.goto("/");

    await page.getByRole("tab", { name: /Calendario/ }).click();

    const dialog = page.getByRole("tabpanel", {
      name: /Calendario/,
    });

    await expect(
      dialog.getByRole("link", { name: /Rumor sin ficha/ })
    ).toBeVisible();

    await expect(dialog.getByText("Sin contrastar")).toBeVisible();
  });
});
