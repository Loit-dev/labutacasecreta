/**
 * «Mi lista»: títulos que el usuario guarda para ver más tarde.
 *
 * Se guardan solo en su navegador (localStorage), con los datos
 * mínimos para enseñarlos (título, año, nota, póster y plataformas).
 * No hay cuentas ni se envía nada a ningún servidor.
 */

export type SavedType = "movie" | "tv";

export type SavedItem = {
  id: number;
  type: SavedType;
  title: string;
  year?: number;
  rating?: number;
  poster?: string;
  platforms: string[];
  savedAt: number;
};

export const LIST_KEY = "lbs:list";

export const LIST_EVENT = "lbs:list-changed";

export const MAX_SAVED = 100;

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
export function parseList(raw: string | null): SavedItem[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    const items: SavedItem[] = [];

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
        platforms: Array.isArray(e.platforms)
          ? e.platforms
              .filter((p): p is string => typeof p === "string")
              .map((p) => p.slice(0, 40))
              .slice(0, 8)
          : [],
        savedAt:
          typeof e.savedAt === "number" ? e.savedAt : 0,
      });
    }

    return items.slice(0, MAX_SAVED);
  } catch {
    return [];
  }
}

/** Texto guardado tal cual (sirve para detectar cambios). */
export function readListRaw(): string {
  try {
    return window.localStorage.getItem(LIST_KEY) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

export function readList(): SavedItem[] {
  return parseList(readListRaw());
}

export function isSaved(
  list: SavedItem[],
  id: number,
  type: SavedType
): boolean {
  return list.some(
    (item) => item.id === id && item.type === type
  );
}

function write(list: SavedItem[]) {
  try {
    window.localStorage.setItem(
      LIST_KEY,
      JSON.stringify(list.slice(0, MAX_SAVED))
    );
  } catch {
    // Sin localStorage: la lista simplemente no se guarda
  }

  try {
    window.dispatchEvent(new Event(LIST_EVENT));
  } catch {
    // (entornos sin eventos)
  }
}

/** Guarda un título (el más reciente va primero, sin repetir). */
export function addToList(item: Omit<SavedItem, "savedAt">) {
  const rest = readList().filter(
    (saved) =>
      !(saved.id === item.id && saved.type === item.type)
  );

  write([{ ...item, savedAt: Date.now() }, ...rest]);
}

export function removeFromList(id: number, type: SavedType) {
  write(
    readList().filter(
      (saved) => !(saved.id === id && saved.type === type)
    )
  );
}

export function clearList() {
  write([]);
}
