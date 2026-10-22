import { expect, test } from "@playwright/test";

// Estos parámetros raros se rechazan antes de llamar a TMDb, así que
// no hace falta tener el token configurado para estas pruebas.
test("type desconocido en /api/tmdb devuelve 400", async ({ request }) => {
  const response = await request.get("/api/tmdb?type=bogus");

  expect(response.status()).toBe(400);
});

test("platforms desconocida en /api/tmdb devuelve 400", async ({
  request,
}) => {
  const response = await request.get(
    "/api/tmdb?platforms=notreal"
  );

  expect(response.status()).toBe(400);
});

test("una página inexistente muestra la 404 propia", async ({ page }) => {
  await page.goto("/esto-no-existe");

  await expect(
    page.getByRole("heading", { name: "Esta escena no existe" })
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Pedir recomendaciones" })
  ).toBeVisible();
});
