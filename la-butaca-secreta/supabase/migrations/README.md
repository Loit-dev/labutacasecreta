# Migraciones de la base de datos

Los cambios de la base de datos se aplican **solos** al desplegar en
producción (Vercel), antes de que la versión nueva de la web se publique.
Ya no hay que pegar SQL en Supabase.

## Añadir un cambio

1. Crea aquí un archivo `AAAAMMDDHHMM_descripcion.sql`
   (por ejemplo `202612011830_denuncias.sql`). El orden lo marca el nombre.
2. Súbelo a `main` junto con el código que lo usa.
3. Al desplegar, `scripts/migrate.mjs` lo aplica en una transacción y lo
   apunta en `public._migrations`. Si falla, no se aplica nada de ese
   archivo y el despliegue se para (la web sigue como estaba).

Reglas:

- **Nunca edites una migración ya aplicada**: haz otra nueva que corrija.
- Mejor si se puede volver a ejecutar sin fallar (`if not exists`,
  `create or replace`, `drop policy if exists`…).
- Los archivos antiguos de `supabase/*.sql` ya están aplicados en
  producción; quedan como referencia.

## Configuración (una vez)

En Vercel → Settings → Environment Variables, una variable **Secret**
solo para **Production**:

- `DATABASE_URL`: la cadena de conexión de Supabase → botón **Connect** →
  **Session pooler** (no la "Direct connection": Vercel no tiene IPv6),
  con la contraseña de la base de datos en lugar de `[YOUR-PASSWORD]`.

Sin esa variable, el build simplemente no aplica migraciones.

## A mano

```bash
DATABASE_URL=... node scripts/migrate.mjs --force --dry-run   # qué aplicaría
DATABASE_URL=... node scripts/migrate.mjs --force             # aplicarlas
```
