/**
 * Títulos que el usuario ha marcado como "No me apetece".
 *
 * Igual que lib/watchlist.ts: solo en su navegador (localStorage), con
 * los datos mínimos para poder enseñarlos (título, año, nota y
 * póster) y quitarlos uno a uno desde Mi Resumen → Descartadas.
 *
 * Antes solo se guardaba el id (lbs:rejected:<type>), sin datos para
 * mostrar nada: ese formato antiguo se descarta sin más al leerlo (el
 * contador vuelve a 0 la primera vez que se usa esta versión), porque
 * es solo una preferencia local, no hay nada que migrar.
 */

export type RejectedType = "movie" | "tv";

export type RejectedItem = {
  id: number;
  type: RejectedType;
  title: string;
  year?: number;
  rating?: number;
  poster?: string;
  rejectedAt: number;
};

export const REJECTED_KEY = "lbs:rejected:v2";

export const REJECTED_EVENT = "lbs:rejected-changed";

export const MAX_REJECTED = 500;

const EMPTY = "[]";

function validPoster(poster: unknown): poster is string {
  return (
    typeof poster === "string" &&
    (poster.startsWith("https://image.tmdb.org/") ||
      poster.startsWith("/")) &&
    poster.length < 300
  );
}

/** Lee la lista guardada (en texto) descartando lo que no sea válido. */
export function parseRejected(raw: string | null): RejectedItem[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    const items: RejectedItem[] = [];

    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;

      const e = entry as Record<string, unknown>;

      if (
        !Number.isInteger(e.id) ||
        (e.id as number) <= 0 ||
        (e.type !== "movie" && e.type !== "tv") ||
        typeof e.title !== "string" ||
        !e.title.trim()
      ) {
        continue;
      }

      items.push({
        id: e.id as number,
        type: e.type,
        title: e.title.slice(0, 200),
        year:
          Number.isInteger(e.year) && (e.year as number) > 0
            ? (e.year as number)
            : undefined,
        rating:
          typeof e.rating === "number" && Number.isFinite(e.rating)
            ? e.rating
            : undefined,
        poster: validPoster(e.poster) ? e.poster : undefined,
        rejectedAt:
          typeof e.rejectedAt === "number" ? e.rejectedAt : 0,
      });
    }

    return items.slice(-MAX_REJECTED);
  } catch {
    return [];
  }
}

export function readRejectedRaw(): string {
  try {
    return window.localStorage.getItem(REJECTED_KEY) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Más reciente primero. */
export function readRejectedList(): RejectedItem[] {
  return parseRejected(readRejectedRaw()).slice().reverse();
}

function write(items: RejectedItem[]) {
  try {
    window.localStorage.setItem(
      REJECTED_KEY,
      JSON.stringify(items.slice(-MAX_REJECTED))
    );
  } catch {
    // Si no se puede guardar, solo se pierde el contador
  }

  try {
    window.dispatchEvent(new Event(REJECTED_EVENT));
  } catch {
    // (entornos sin eventos)
  }
}

export function addRejected(item: Omit<RejectedItem, "rejectedAt">) {
  const rest = parseRejected(readRejectedRaw()).filter(
    (rejected) => !(rejected.id === item.id && rejected.type === item.type)
  );

  write([...rest, { ...item, rejectedAt: Date.now() }]);
}

export function removeRejected(id: number, type: RejectedType) {
  write(
    parseRejected(readRejectedRaw()).filter(
      (rejected) => !(rejected.id === id && rejected.type === type)
    )
  );
}

export function clearRejected() {
  write([]);
}

/** Nº de "no me apetece" guardados. */
export function countRejected(): number {
  return parseRejected(readRejectedRaw()).length;
}
