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

  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

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
