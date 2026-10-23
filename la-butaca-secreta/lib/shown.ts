/**
 * Qué se le ha mostrado a este visitante como «Butaca Exprés» en los
 * últimos días, para no repetirle lo mismo aunque no haya marcado nada
 * como visto.
 *
 * Es distinto de `lib/viewed.ts` (títulos que el usuario dice que ya
 * ha visto): esto se rellena solo, cada vez que calculamos su «hoy»,
 * y sirve únicamente para dar variedad día a día. Se guarda solo en
 * su navegador (localStorage); nunca se envía a ningún sitio salvo
 * como lista de ids para excluirlos de la búsqueda.
 */

const DAYS_TO_REMEMBER = 10;
const MAX_ENTRIES = 200;

function storageKey(type: string) {
  return `lbs:shown:${type}`;
}

type ShownEntry = { id: number; date: string };

function daysSince(dateStr: string): number {
  const shown = new Date(`${dateStr}T00:00:00Z`).getTime();

  if (!Number.isFinite(shown)) return Infinity;

  return (Date.now() - shown) / (1000 * 60 * 60 * 24);
}

function isShownEntry(value: unknown): value is ShownEntry {
  return (
    !!value &&
    typeof value === "object" &&
    Number.isInteger((value as ShownEntry).id) &&
    typeof (value as ShownEntry).date === "string"
  );
}

function readAll(type: string): ShownEntry[] {
  try {
    const raw = window.localStorage.getItem(storageKey(type));
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed.filter(isShownEntry) : [];
  } catch {
    // Sin localStorage (modo privado, bloqueado...): funcionamos igual
    return [];
  }
}

/**
 * Ids mostrados en los últimos `DAYS_TO_REMEMBER` días. Pasado ese
 * tiempo un título puede volver a salir: no es una lista negra
 * permanente, solo evita la repetición inmediata.
 */
export function readRecentlyShown(type: string): number[] {
  return readAll(type)
    .filter((entry) => daysSince(entry.date) < DAYS_TO_REMEMBER)
    .map((entry) => entry.id);
}

/** Registra que en `date` (YYYY-MM-DD) se le mostraron estos ids. */
export function addShown(type: string, ids: number[], date: string) {
  if (ids.length === 0) return;

  try {
    const stillFresh = readAll(type).filter(
      (entry) => daysSince(entry.date) < DAYS_TO_REMEMBER
    );

    const today = ids.map((id) => ({ id, date }));

    const merged = [...stillFresh, ...today].slice(-MAX_ENTRIES);

    window.localStorage.setItem(storageKey(type), JSON.stringify(merged));
  } catch {
    // Si no se puede guardar, solo se pierde la variedad entre visitas
  }
}
