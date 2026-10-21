import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { mockApi } from "./helpers";

/** Cada persona contesta la pregunta actual eligiendo la opción nº `index`. */
async function vote(page: Page, names: string[], indexes: number[]) {
  for (let i = 0; i < names.length; i++) {
    if (i > 0) {
      await expect(
        page.getByRole("heading", {
          name: `Pasa el móvil a ${names[i]}`,
        })
      ).toBeVisible();

      await page.getByRole("button", { name: `Soy ${names[i]}` }).click();
    }

    await expect(
      page.getByRole("heading", { name: `Turno de ${names[i]}` })
    ).toBeVisible();

    await page.locator("[data-options] button").nth(indexes[i]).click();
  }
}

async function startGroup(page: Page, names: string[]) {
  await page.goto("/");

  await page.getByRole("button", { name: /Acompañado/ }).click();

  const plus = page.getByRole("button", { name: "Una persona más" });

  for (let i = 2; i < names.length; i++) await plus.click();

  for (let i = 0; i < names.length; i++) {
    await page
      .getByLabel(`Nombre de la persona ${i + 1}`)
      .fill(names[i]);
  }

  await page.getByRole("button", { name: "Empezar" }).click();
}

test.describe("Modo acompañado", () => {
  test("al entrar se elige entre solo y acompañado", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: /^Solo/ })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Acompañado/ })
    ).toBeVisible();

    // Aún no hay preguntas ni nombres
    await expect(page.locator("[data-options]")).toHaveCount(0);
    await expect(page.getByLabel("Nombre de la persona 1")).toHaveCount(0);
  });

  test("solo: no pregunta con quién vas", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Solo/ }).click();

    await expect(page.locator("[data-options] button").first()).toBeVisible();

    for (let i = 0; i < 6; i++) {
      const first = page.locator("[data-options] button").first();

      if (!(await first.isVisible().catch(() => false))) break;

      await expect(
        page.getByText("¿Con quién vas a verla?")
      ).toHaveCount(0);

      const before = await page.locator('[role="log"] > div').count();

      await first.click();

      await expect
        .poll(() => page.locator('[role="log"] > div').count())
        .toBeGreaterThan(before);
    }
  });

  test("dos personas: coincidencias, desempate y recomendaciones", async ({
    page,
  }) => {
    const requests = await mockApi(page);
    const names = ["Ana", "Luis"];

    await startGroup(page, names);

    // 1. Película o serie: coinciden
    await vote(page, names, [0, 0]);

    await expect(
      page.getByRole("heading", { name: /Coincidís todos/ })
    ).toBeVisible();

    await page.getByRole("button", { name: "Siguiente" }).click();

    // 2. Ánimo: no coinciden → piedra, papel o tijera
    await vote(page, names, [0, 1]);

    await expect(
      page.getByRole("heading", { name: /Empate/ })
    ).toBeVisible();

    await page.getByRole("button", { name: /A jugar/ }).click();

    await expect(
      page.getByRole("heading", { name: "Ana contra Luis" })
    ).toBeVisible();

    // Primero empatan y se repite solo
    await page.getByRole("button", { name: "Ana: Piedra" }).click();

    // Lo que ha elegido no se ve hasta que elige el otro
    await expect(page.getByText("✔ Listo")).toBeVisible();
    await expect(page.getByLabel(/eligió/)).toHaveCount(0);

    await page.getByRole("button", { name: "Luis: Piedra" }).click();

    await expect(page.getByText("¡Empate! Otra vez…")).toBeVisible();

    await page.getByRole("button", { name: "Ana: Piedra" }).click({
      timeout: 5000,
    });
    await page.getByRole("button", { name: "Luis: Tijera" }).click();

    await expect(page.getByText("¡Gana Ana!")).toBeVisible();

    await page.getByRole("button", { name: "Seguir" }).click();

    // 3 y 4: coinciden
    await vote(page, names, [0, 0]);
    await page.getByRole("button", { name: "Siguiente" }).click();

    await vote(page, names, [0, 0]);
    await page.getByRole("button", { name: "Siguiente" }).click();

    // Lo que evita cualquiera se evita para todos
    await vote(page, names, [0, 5]);

    await expect(
      page.getByRole("heading", { name: "75 % de coincidencia" })
    ).toBeVisible();

    await expect(page.getByText("Evitaremos: Nada de terror")).toBeVisible();
    await expect(page.getByText("✊ Ganó Ana")).toBeVisible();

    await page
      .getByRole("button", { name: "Ver recomendaciones" })
      .click();

    await expect(page.locator("#recommendations")).toBeVisible();

    await expect
      .poll(() => requests.length)
      .toBeGreaterThan(0);

    const query = requests[0].url.searchParams;

    expect(query.get("company")).toBe("partner");
    expect(query.get("mood")).toBe("laugh");
    expect(query.get("restrictions")).toBe("terror");
  });

  test("tres personas: gana la mayoría sin desempatar", async ({ page }) => {
    const names = ["Ana", "Luis", "Eva"];

    await startGroup(page, names);

    await vote(page, names, [0, 0, 1]);

    await expect(
      page.getByRole("heading", { name: /Gana la mayoría: .*Película/ })
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /A jugar/ })
    ).toHaveCount(0);
  });

  test("los nombres vacíos se sustituyen por Persona N", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Acompañado/ }).click();
    await page.getByRole("button", { name: "Empezar" }).click();

    await expect(
      page.getByRole("heading", { name: "Turno de Persona 1" })
    ).toBeVisible();
  });

  test("las pantallas del modo acompañado no tienen fallos graves", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Acompañado/ }).click();

    await expect(
      page.getByRole("heading", { name: "¿Cuántos sois?" })
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? "")
    );

    expect(
      serious.map((v) => `${v.id}: ${v.help}`)
    ).toEqual([]);
  });
});
