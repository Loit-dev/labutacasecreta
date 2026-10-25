/**
 * Valoración (1-5, con medias estrellas: 1, 1.5, 2, 2.5...5) de lo
 * que el usuario marca como "Ya la vi".
 *
 * Se guarda siempre en su navegador (localStorage), igual que las
 * vistas de lib/viewed.ts, y además en Supabase cuando hay sesión
 * (ver lib/supabase/watched.ts). Nunca pesa en las recomendaciones
 * todavía: solo se guarda, de cara al resumen y a fases futuras.
 */

export type Rating = 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5;

const MAX_RATINGS = 500;

/** ¿Es un número válido de la escala (1-5, en pasos de 0.5)? */
function isValidRating(value: unknown): value is Rating {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;

  // value * 2 debe ser un entero entre 2 (=1 estrella) y 10 (=5 estrellas).
  const doubled = value * 2;

  return (
    Number.isInteger(doubled) && doubled >= 2 && doubled <= 10
  );
}

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

      if (Number.isInteger(numId) && numId > 0 && isValidRating(value)) {
        clean[numId] = value;
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
