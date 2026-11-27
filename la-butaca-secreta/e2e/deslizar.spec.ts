import { expect, test, type Page } from "@playwright/test";

import { mockApi } from "./helpers";

// Deslizar el dedo sobre la tarjeta de la portada cambia de pestaña.
// Se simula el gesto con eventos táctiles (solo en el proyecto móvil).

async function swipe(page: Page, selector: string, dx: number, dy = 0) {
  await page.evaluate(
    ({ selector, dx, dy }) => {
      const element = document.querySelector(selector)!;
      const box = element.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + Math.min(box.height / 2, 200);

      const touch = (cx: number, cy: number) =>
        new Touch({ identifier: 1, target: element, clientX: cx, clientY: cy });

      const start = touch(x, y);
      const end = touch(x + dx, y + dy);

      element.dispatchEvent(
        new TouchEvent("touchstart", {
          bubbles: true,
          touches: [start],
          targetTouches: [start],
          changedTouches: [start],
        })
      );
      element.dispatchEvent(
        new TouchEvent("touchend", {
          bubbles: true,
          touches: [],
          targetTouches: [],
          changedTouches: [end],
        })
      );
    },
    { selector, dx, dy }
  );
}

test.describe("Deslizar entre pestañas", () => {
  test.skip(({ isMobile }) => !isMobile, "Solo en móvil");

  test("a la izquierda pasa a la siguiente; a la derecha vuelve", async ({
    page,
  }) => {
    await mockApi(page);
    await page.goto("/");

    const selected = page.locator('[role="tab"][aria-selected="true"]');

    await expect(selected).toContainText(/Recomendador/i);

    await swipe(page, "#panel-recommender", -150);
    await expect(selected).toContainText(/Calendario/i);

    await swipe(page, "#panel-calendar", 150);
    await expect(selected).toContainText(/Recomendador/i);

    // Un gesto casi vertical es scroll, no cambia de pestaña
    await swipe(page, "#panel-recommender", -80, 200);
    await expect(selected).toContainText(/Recomendador/i);

    // En la primera pestaña, deslizar a la derecha no hace nada
    await swipe(page, "#panel-recommender", 150);
    await expect(selected).toContainText(/Recomendador/i);
  });
});
