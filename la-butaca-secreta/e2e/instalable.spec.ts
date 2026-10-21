import { expect, test } from "@playwright/test";

test.describe("Web instalable", () => {
  test("tiene manifiesto con nombre, colores e iconos que existen", async ({
    page,
    request,
  }) => {
    await page.goto("/");

    const href = await page
      .locator('link[rel="manifest"]')
      .getAttribute("href");

    expect(href).toBeTruthy();

    const response = await request.get(href as string);

    expect(response.ok()).toBe(true);

    const manifest = await response.json();

    expect(manifest.name).toContain("La Butaca Secreta");
    expect(manifest.short_name).toBe("Butaca Secreta");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.lang).toBe("es");

    const sizes = manifest.icons.map(
      (icon: { sizes: string }) => icon.sizes
    );

    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");

    expect(
      manifest.icons.some(
        (icon: { purpose?: string }) => icon.purpose === "maskable"
      )
    ).toBe(true);

    // Cada icono se puede descargar y es una imagen
    for (const icon of manifest.icons as { src: string }[]) {
      const image = await request.get(icon.src);

      expect(image.ok(), icon.src).toBe(true);
      expect(image.headers()["content-type"], icon.src).toContain(
        "image/png"
      );
    }
  });

  test("el iPhone encuentra su icono", async ({ page, request }) => {
    await page.goto("/");

    const href = await page
      .locator('link[rel="apple-touch-icon"]')
      .getAttribute("href");

    expect(href).toBeTruthy();

    const image = await request.get(href as string);

    expect(image.ok()).toBe(true);
  });

  test("el color de la barra coincide con el de la web", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.locator('meta[name="theme-color"]').first()
    ).toHaveAttribute("content", "#09090b");
  });
});
