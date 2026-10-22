import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { completeQuiz, mockApi } from "./helpers";

// Reglas WCAG 2.1 A y AA. Se revisa solo lo grave: lo demás se
// puede ver en el informe, pero no debe bloquear.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function report(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]
) {
  return violations
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help} → ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(" "))
          .join(" | ")}`
    )
    .join("\n");
}

test.describe("Accesibilidad", () => {
  test("la página de inicio no tiene fallos graves", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("[data-mode-select] button").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(TAGS)
      .analyze();

    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? "")
    );

    expect(serious, report(serious)).toEqual([]);
  });

  test("las recomendaciones no tienen fallos graves", async ({ page }) => {
    await mockApi(page);
    await completeQuiz(page);

    await expect(page.getByRole("article").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(TAGS)
      .analyze();

    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? "")
    );

    expect(serious, report(serious)).toEqual([]);
  });

  for (const path of ["/privacidad", "/aviso-legal"]) {
    test(`${path} no tiene fallos graves`, async ({ page }) => {
      await page.goto(path);

      const results = await new AxeBuilder({ page })
        .withTags(TAGS)
        .analyze();

      const serious = results.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? "")
      );

      expect(serious, report(serious)).toEqual([]);
    });
  }
});
