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
              entry(1, "Serie Uno", day, ["netflix"]),
              entry(2, "Serie Dos", day, ["max", "netflix"]),
            ],
          },
        },
      });
    });

    await page.goto("/");

    await page.getByRole("button", { name: /Calendario/ }).click();

    const dialog = page.getByRole("dialog", {
      name: "Calendario de estrenos",
    });

    await expect(dialog).toBeVisible();

    // Hoy está seleccionado y enseña sus estrenos
    await expect(
      dialog.getByRole("link", { name: /Serie Uno/ })
    ).toBeVisible();

    await expect(
      dialog.getByRole("link", { name: /Serie Dos/ })
    ).toBeVisible();

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

    // Cambiar de mes pide ese mes y se cierra con Escape
    await dialog.getByRole("button", { name: "Mes siguiente" }).click();

    await expect.poll(() => requested.length).toBeGreaterThan(1);

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();
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

    await page.getByRole("button", { name: /Calendario/ }).click();

    const dialog = page.getByRole("dialog", {
      name: "Calendario de estrenos",
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

    await page.getByRole("button", { name: /Calendario/ }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "No he podido cargar" })
    ).toBeVisible();
  });
});
