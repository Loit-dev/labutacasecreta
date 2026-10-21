import { expect, type Page } from "@playwright/test";

// Un PNG de 1×1 píxel, para pósters y logos simulados
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

type Fake = {
  id: number;
  title: string;
  role: "main" | "surprise";
  genreIds: number[];
  genres: string[];
};

// Catálogo de mentira: 6 títulos "main" y 3 "sorpresa"
const CATALOG: Fake[] = [
  { id: 101, title: "Alfa Uno", role: "main", genreIds: [35], genres: ["Comedia"] },
  { id: 102, title: "Beta Dos", role: "main", genreIds: [18], genres: ["Drama"] },
  { id: 103, title: "Gamma Sorpresa", role: "surprise", genreIds: [99], genres: ["Documental"] },
  { id: 104, title: "Delta Cuatro", role: "main", genreIds: [35, 10749], genres: ["Comedia", "Romance"] },
  { id: 105, title: "Épsilon Cinco", role: "main", genreIds: [12], genres: ["Aventura"] },
  { id: 106, title: "Zeta Sorpresa", role: "surprise", genreIds: [36], genres: ["Historia"] },
  { id: 107, title: "Eta Siete", role: "main", genreIds: [28], genres: ["Acción"] },
  { id: 108, title: "Theta Ocho", role: "main", genreIds: [53], genres: ["Thriller"] },
  { id: 109, title: "Iota Sorpresa", role: "surprise", genreIds: [14], genres: ["Fantasía"] },
];

function recommendation(item: Fake) {
  const logo = "/logito.png";

  return {
    id: item.id,
    title: item.title,
    year: 2015,
    rating: 7.8,
    runtime: 110,
    genres: item.genres,
    overview: `Sinopsis de ${item.title}.`,
    poster: `https://image.tmdb.org/t/p/w500/poster${item.id}abc.jpg`,
    providers: [{ id: 8, name: "Netflix", logo }],
    platforms: [
      { id: 8, name: "Netflix", logo },
      { id: 119, name: "Prime Video", logo },
    ],
    director: "Directora Prueba",
    cast: ["Actor Uno", "Actriz Dos"],
    reason: "Porque encaja con lo que me has contado.",
    role: item.role,
    genreIds: item.genreIds,
  };
}

export type Captured = { url: URL }[];

/**
 * Sustituye a TMDb: responde como lo haría /api/tmdb (respetando
 * "quick" y "exclude") y devuelve las peticiones para poder revisarlas.
 */
export async function mockApi(page: Page): Promise<Captured> {
  const requests: Captured = [];

  await page.route("**/api/tmdb**", async (route) => {
    const url = new URL(route.request().url());

    requests.push({ url });

    const exclude = new Set(
      (url.searchParams.get("exclude") ?? "")
        .split(",")
        .filter(Boolean)
        .map(Number)
    );

    const pool = CATALOG.filter((item) => !exclude.has(item.id));

    const body =
      url.searchParams.get("quick") === "1"
        ? [
            ...pool.filter((i) => i.role === "main").slice(0, 2),
            ...pool.filter((i) => i.role === "surprise").slice(0, 1),
          ]
        : pool;

    await route.fulfill({
      json: body.map(recommendation),
    });
  });

  // Pósters: ni se pide nada a TMDb ni al optimizador de imágenes
  await page.route("**/api/poster**", (route) =>
    route.fulfill({ body: PIXEL, contentType: "image/png" })
  );

  await page.route("**/_next/image**", (route) =>
    route.fulfill({ body: PIXEL, contentType: "image/png" })
  );

  return requests;
}

/** Contesta siempre la primera opción hasta que salen las recomendaciones. */
export async function completeQuiz(page: Page) {
  await page.goto("/");

  await page.getByRole("button", { name: /^Solo/ }).click();

  const log = page.locator('[role="log"] > div');

  for (let step = 0; step < 15; step++) {
    if ((await page.locator("#recommendations").count()) > 0) {
      break;
    }

    const first = page.locator("[data-options] button").first();

    await first.waitFor();

    const before = await log.count();

    await first.click();

    // El mensaje del usuario aparece enseguida; así sabemos que la
    // respuesta se ha registrado antes de buscar la siguiente pregunta.
    await expect
      .poll(async () => log.count())
      .toBeGreaterThan(before);
  }

  await expect(page.locator("#recommendations")).toBeVisible();
}

/** Títulos de las tarjetas que se ven ahora mismo. */
export async function visibleTitles(page: Page) {
  const headings = page.locator("article h2");

  const texts = await headings.allTextContents();

  const shown: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    if (await headings.nth(i).isVisible()) {
      shown.push(texts[i].trim());
    }
  }

  return shown;
}
