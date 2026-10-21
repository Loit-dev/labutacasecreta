/**
 * Títulos que el usuario ha marcado como "Ya la vi".
 *
 * Se guardan solo en su navegador (localStorage), separados por tipo
 * porque en TMDb una película y una serie pueden tener el mismo id.
 * Nunca se envían a ningún sitio salvo como lista de ids para excluirlos
 * de la búsqueda (ver la página de privacidad).
 */

const MAX_SEEN = 500;

function storageKey(type: string) {
  return `lbs:seen:${type}`;
}

export function readSeen(type: string): number[] {
  try {
    const raw = window.localStorage.getItem(
      storageKey(type)
    );

    const parsed: unknown = raw
      ? JSON.parse(raw)
      : [];

    return Array.isArray(parsed)
      ? parsed
          .filter(
            (id): id is number =>
              Number.isInteger(id) && id > 0
          )
          .slice(-MAX_SEEN)
      : [];
  } catch {
    // Sin localStorage (modo privado, bloqueado...): funcionamos igual
    return [];
  }
}

export function addSeen(type: string, id: number) {
  try {
    const seen = readSeen(type).filter(
      (seenId) => seenId !== id
    );

    seen.push(id);

    window.localStorage.setItem(
      storageKey(type),
      JSON.stringify(seen.slice(-MAX_SEEN))
    );
  } catch {
    // Si no se puede guardar, solo se pierde la memoria entre visitas
  }
}

export function clearSeen(type: string) {
  try {
    window.localStorage.removeItem(
      storageKey(type)
    );
  } catch {
    // Nada que borrar
  }
}
