import { expect, test } from "@playwright/test";

import { mockApi } from "./helpers";

test.describe("Navegación por teclado de las pestañas", () => {
  test("flecha derecha/izquierda mueve el foco y activa la pestaña", async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto("/");

    const recommenderTab = page.getByRole("tab", {
      name: /Recomendador/,
    });
    const calendarTab = page.getByRole("tab", {
      name: /Calendario/,
    });
    const searchTab = page.getByRole("tab", {
      name: /Buscar/,
    });

    await recommenderTab.focus();
    await expect(recommenderTab).toHaveAttribute(
      "aria-selected",
      "true"
    );

    await page.keyboard.press("ArrowRight");

    await expect(calendarTab).toBeFocused();
    await expect(calendarTab).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(
      page.getByRole("tabpanel", { name: /Calendario/i })
    ).toBeVisible();

    await page.keyboard.press("ArrowRight");

    await expect(searchTab).toBeFocused();
    await expect(searchTab).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("tabpanel", { name: /Buscar/i })
    ).toBeVisible();

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");

    await expect(recommenderTab).toBeFocused();
    await expect(recommenderTab).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("Home y End van a la primera y a la última pestaña", async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto("/");

    const recommenderTab = page.getByRole("tab", {
      name: /Recomendador/,
    });
    const searchTab = page.getByRole("tab", {
      name: /Buscar/,
    });

    await recommenderTab.focus();

    await page.keyboard.press("End");
    await expect(searchTab).toBeFocused();
    await expect(searchTab).toHaveAttribute("aria-selected", "true");

    await page.keyboard.press("Home");
    await expect(recommenderTab).toBeFocused();
    await expect(recommenderTab).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("solo la pestaña activa está en el orden de tabulación", async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto("/");

    await expect(
      page.getByRole("tab", { name: /Recomendador/ })
    ).toHaveAttribute("tabindex", "0");

    await expect(
      page.getByRole("tab", { name: /Calendario/ })
    ).toHaveAttribute("tabindex", "-1");

    await expect(
      page.getByRole("tab", { name: /Buscar/ })
    ).toHaveAttribute("tabindex", "-1");
  });
});
