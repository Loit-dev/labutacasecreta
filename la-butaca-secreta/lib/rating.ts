/**
 * Valoración (1-5) de lo que el usuario marca como "Ya la vi".
 *
 * Se guarda siempre en su navegador (localStorage), igual que las
 * vistas de lib/viewed.ts, y además en Supabase cuando hay sesión
 * (ver lib/supabase/watched.ts). Nunca pesa en las recomendaciones
 * todavía: solo se guarda, de cara al resumen y a fases futuras.
 */

export type Rating = 1 | 2 | 3 | 4 | 5;

const MAX_RATINGS = 500;

function storageKey(type: string) {
  return `lbs:rating:${type}`;
}

function readAll(type: string): Record<number, Rating> {
  try {
    const raw = window.localStorage.getItem(storageKey(type));

    const parsed: unknown = raw ? JSON.parse(raw) : {};

    if (!parsed || typeof parsed !== "object") return {};

    const clean: Record<number, Rating> = {};

    for (const [id, value] of Object.entries(parsed)) {
      const numId = Number(id);

      if (
        Number.isInteger(numId) &&
        numId > 0 &&
        Number.isInteger(value) &&
        (value as number) >= 1 &&
        (value as number) <= 5
      ) {
        clean[numId] = value as Rating;
      }
    }

    return clean;
  } catch {
    return {};
  }
}

export function readRating(
  type: string,
  id: number
): Rating | undefined {
  return readAll(type)[id];
}

export function setRating(
  type: string,
  id: number,
  rating: Rating
) {
  try {
    const all = readAll(type);

    all[id] = rating;

    const entries = Object.entries(all).slice(-MAX_RATINGS);

    window.localStorage.setItem(
      storageKey(type),
      JSON.stringify(Object.fromEntries(entries))
    );
  } catch {
    // Si no se puede guardar, solo se pierde la valoración local
  }
}
