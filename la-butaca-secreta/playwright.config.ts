import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas de interfaz: abren la web de verdad en un navegador, contestan
 * el cuestionario y comprueban lo que ve el usuario.
 *
 * TMDb está simulado (ver e2e/helpers.ts), así que no hace falta token
 * ni red y los resultados son siempre los mismos.
 *
 *   npm run build && npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["list"]]
    : [["list"]],

  use: {
    baseURL: "http://localhost:3000",
    locale: "es-ES",
    trace: "retain-on-failure",
  },

  webServer: [
    // TMDb de mentira (para abrir enlaces compartidos sin token)
    {
      command: "node e2e/mock-tmdb.mjs",
      url: "http://localhost:4010/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "npm run start",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        TMDB_API_TOKEN: "token-de-prueba",
        TMDB_BASE_URL: "http://localhost:4010/3",
        TMDB_IMAGE_URL: "http://localhost:4010/img",
      },
    },
  ],

  projects: [
    {
      name: "escritorio",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "movil",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
