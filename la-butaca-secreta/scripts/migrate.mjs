#!/usr/bin/env node
/**
 * Migraciones de la base de datos (Supabase), automáticas al desplegar.
 *
 * Aplica, en orden, los archivos de supabase/migrations/*.sql que aún no
 * se hayan aplicado, cada uno en su propia transacción, y los apunta en
 * public._migrations. Si uno falla, se deshace entero, el build se para
 * y el despliegue no llega a producción (la web sigue con la versión
 * anterior y la base de datos como estaba).
 *
 * Cuándo se ejecuta (ver "build" en package.json):
 *   - En Vercel, solo en el despliegue de producción (VERCEL_ENV =
 *     "production") y solo si existe DATABASE_URL. Los de vista previa
 *     no tocan la base de datos de producción.
 *   - A mano: DATABASE_URL=... node scripts/migrate.mjs --force
 *   - Sin DATABASE_URL (CI, en local) no hace nada.
 *
 * Opciones:
 *   --force    ejecuta aunque no sea producción de Vercel
 *   --dry-run  solo dice qué aplicaría
 *
 * Los archivos antiguos de supabase/*.sql (los que se pegaban a mano)
 * ya están aplicados y no se tocan; los cambios nuevos van siempre en
 * supabase/migrations/, con nombre AAAAMMDDHHMM_descripcion.sql.
 */

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, "..", "supabase", "migrations");

const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const dryRun = args.has("--dry-run");

const log = (message) => console.log(`[migraciones] ${message}`);

const url = process.env.DATABASE_URL;
const isProduction = process.env.VERCEL_ENV === "production";

if (!url) {
  log("Sin DATABASE_URL: no se aplica nada.");
  process.exit(0);
}

if (!isProduction && !force) {
  log(
    `No es el despliegue de producción (VERCEL_ENV=${process.env.VERCEL_ENV ?? "—"}): no se aplica nada.`
  );
  process.exit(0);
}

// Nombres válidos: 202611281200_algo.sql
const NAME = /^\d{12}_[a-z0-9_]+\.sql$/;

const files = (await readdir(dir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

for (const file of files) {
  if (!NAME.test(file)) {
    console.error(
      `[migraciones] Nombre no válido: ${file} (debe ser AAAAMMDDHHMM_descripcion.sql)`
    );
    process.exit(1);
  }
}

const client = new pg.Client({
  connectionString: url,
  // Supabase exige SSL; su certificado no está en la cadena por defecto
  // de Node, así que no se valida (la conexión sigue cifrada).
  // PGSSLMODE=disable solo para probarlo contra un Postgres local.
  ssl:
    process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
  statement_timeout: 120_000,
});

await client.connect();

try {
  // Un solo despliegue a la vez aplicando migraciones.
  await client.query("select pg_advisory_lock(726354)");

  await client.query(`
    create table if not exists public._migrations (
      name text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    );
    -- Sin políticas: invisible desde la web (anon/authenticated).
    alter table public._migrations enable row level security;
  `);

  const { rows } = await client.query(
    "select name, checksum from public._migrations"
  );
  const applied = new Map(rows.map((row) => [row.name, row.checksum]));

  let count = 0;

  for (const file of files) {
    const sql = await readFile(path.join(dir, file), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");

    if (applied.has(file)) {
      if (applied.get(file) !== checksum) {
        log(
          `AVISO: ${file} ha cambiado después de aplicarse; no se vuelve a ejecutar. Los cambios van en un archivo nuevo.`
        );
      }
      continue;
    }

    if (dryRun) {
      log(`Se aplicaría: ${file}`);
      count++;
      continue;
    }

    log(`Aplicando ${file}…`);

    try {
      await client.query("begin");
      await client.query(sql);
      await client.query(
        "insert into public._migrations (name, checksum) values ($1, $2)",
        [file, checksum]
      );
      await client.query("commit");
      count++;
    } catch (error) {
      await client.query("rollback");
      console.error(`[migraciones] Falló ${file}; no se ha aplicado nada de ese archivo.`);
      console.error(error);
      process.exitCode = 1;
      break;
    }
  }

  if (process.exitCode !== 1) {
    log(count === 0 ? "Todo al día." : `${dryRun ? "Pendientes" : "Aplicadas"}: ${count}.`);
  }
} finally {
  await client.query("select pg_advisory_unlock(726354)").catch(() => {});
  await client.end();
}
