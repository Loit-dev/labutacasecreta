import { expect, test } from "@playwright/test";

import { completeQuiz, mockApi } from "./helpers";

test.describe("Mis plataformas", () => {
  test("por defecto están todas y se puede elegir cuáles tienes", async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto("/");

    const group = page.getByRole("group", { name: "Tus plataformas" });

    await expect(group.getByRole("button")).toHaveCount(5);

    for (const button of await group.getByRole("button").all()) {
      await expect(button).toHaveAttribute("aria-pressed", "true");
    }

    // Quito todas menos Netflix: la última no se puede quitar
    for (const name of ["Prime Video", "Disney+", "Max", "Filmin"]) {
      await group.getByRole("button", { name }).click();
    }

    await group.getByRole("button", { name: "Netflix" }).click();

    await expect(
      group.getByRole("button", { name: "Netflix" })
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("la búsqueda de recomendaciones usa solo las plataformas elegidas", async ({
    page,
  }) => {
    const requests = await mockApi(page);

    await page.goto("/");

    const group = page.getByRole("group", { name: "Tus plataformas" });

    for (const name of ["Prime Video", "Disney+", "Max", "Filmin"]) {
      await group.getByRole("button", { name }).click();
    }

    await completeQuiz(page);

    expect(requests.length).toBeGreaterThan(0);

    for (const { url } of requests) {
      expect(url.searchParams.get("platforms")).toBe("netflix");
    }
  });

  test("con todas marcadas no se añade nada a la búsqueda", async ({
    page,
  }) => {
    const requests = await mockApi(page);

    await completeQuiz(page);

    for (const { url } of requests) {
      expect(url.searchParams.has("platforms")).toBe(false);
    }
  });
});
