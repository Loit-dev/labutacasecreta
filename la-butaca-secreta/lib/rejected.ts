/**
 * Títulos que el usuario ha marcado como "No me apetece".
 *
 * Igual que lib/viewed.ts: solo en su navegador (localStorage),
 * separados por tipo. Antes "No me apetece" solo afectaba a la
 * sesión (ocultar la tarjeta + bajar el género en lib/genreAffinity),
 * y se olvidaba al cerrar la pestaña; ahora también se cuenta, para
 * poder mostrarlo en Mi Resumen.
 */

const MAX_REJECTED = 500;

function storageKey(type: string) {
  return `lbs:rejected:${type}`;
}

export function readRejected(type: string): number[] {
  try {
    const raw = window.localStorage.getItem(storageKey(type));

    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? parsed
          .filter((id): id is number => Number.isInteger(id) && id > 0)
          .slice(-MAX_REJECTED)
      : [];
  } catch {
    // Sin localStorage (modo privado, bloqueado...): funcionamos igual
    return [];
  }
}

export function addRejected(type: string, id: number) {
  try {
    const rejected = readRejected(type).filter(
      (rejectedId) => rejectedId !== id
    );

    rejected.push(id);

    window.localStorage.setItem(
      storageKey(type),
      JSON.stringify(rejected.slice(-MAX_REJECTED))
    );
  } catch {
    // Si no se puede guardar, solo se pierde el contador
  }
}

export function clearRejected(type: string) {
  try {
    window.localStorage.removeItem(storageKey(type));
  } catch {
    // Nada que borrar
  }
}

/** Nº de "no me apetece" guardados, sumando películas y series. */
export function countRejected(): number {
  return readRejected("movie").length + readRejected("tv").length;
}
