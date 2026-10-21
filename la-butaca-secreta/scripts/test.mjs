/**
 * Ejecuta los tests de `tests/` sin instalar nada más.
 *
 * Usa solo cosas que el proyecto ya tiene: TypeScript (para convertir
 * los .ts a JavaScript en una carpeta temporal) y el ejecutor de tests
 * incluido en Node (`node --test`).
 *
 * - Solo se prueba la lógica pura de `lib/` y `data/` (sin React ni Next).
 * - Los alias "@/..." se reescriben a rutas reales.
 *
 *   npm test
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const require = createRequire(import.meta.url);

function loadTypeScript() {
  try {
    return require("typescript");
  } catch (error) {
    // Permite usar un TypeScript instalado en otro sitio
    if (process.env.TS_PATH) {
      return require(process.env.TS_PATH);
    }

    console.error(
      "No se encuentra TypeScript. Ejecuta `npm install` primero."
    );

    throw error;
  }
}

const ts = loadTypeScript();

const out = fs.mkdtempSync(
  path.join(os.tmpdir(), "lbs-tests-")
);

const SOURCE_DIRS = ["lib", "data", "tests"];

function walk(dir) {
  const full = path.join(root, dir);

  if (!fs.existsSync(full)) return [];

  return fs
    .readdirSync(full, { withFileTypes: true })
    .flatMap((entry) => {
      const relative = path.join(dir, entry.name);

      return entry.isDirectory()
        ? walk(relative)
        : [relative];
    });
}

const testFiles = [];

for (const file of SOURCE_DIRS.flatMap(walk)) {
  const target = path.join(out, file);

  fs.mkdirSync(path.dirname(target), {
    recursive: true,
  });

  if (file.endsWith(".json")) {
    fs.copyFileSync(path.join(root, file), target);
    continue;
  }

  if (!file.endsWith(".ts") || file.endsWith(".d.ts")) {
    continue;
  }

  const source = fs.readFileSync(
    path.join(root, file),
    "utf8"
  );

  const js = ts
    .transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    })
    .outputText.replace(
      /require\("@\/([^"]+)"\)/g,
      (_match, aliased) =>
        `require(${JSON.stringify(
          path.join(out, aliased)
        )})`
    );

  const jsTarget = target.replace(/\.ts$/, ".js");

  fs.writeFileSync(jsTarget, js);

  if (file.endsWith(".test.ts")) {
    testFiles.push(jsTarget);
  }
}

if (testFiles.length === 0) {
  console.error("No hay tests en tests/*.test.ts");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--test", ...testFiles],
  { stdio: "inherit" }
);

fs.rmSync(out, { recursive: true, force: true });

process.exit(result.status ?? 1);
