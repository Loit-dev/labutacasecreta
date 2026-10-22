/**
 * Qué tres tarjetas se muestran ahora.
 *
 * Siempre: dos principales (🥇 🥈) y una sorpresa (🥉). Si el usuario
 * descarta una, la siguiente DEL MISMO TIPO ocupa su lugar, así que la
 * sorpresa sigue siendo sorpresa y los motivos siempre cuadran con
 * la insignia que se ve.
 */

export interface Windowable {
  id: number;

  role?: "main" | "surprise" | "trending";
}

export function pickWindow<T extends Windowable>(
  items: T[],
  hidden: readonly number[]
): T[] {
  const hiddenSet = new Set(hidden);

  const available = items.filter(
    (item) => !hiddenSet.has(item.id)
  );

  const mains = available.filter(
    (item) => item.role !== "surprise"
  );

  const surprises = available.filter(
    (item) => item.role === "surprise"
  );

  const result: T[] = mains.slice(0, 2);

  // La tercera: una sorpresa; si no queda, otra principal
  const third = surprises[0] ?? mains[2];

  if (third) {
    result.push(third);
  }

  // Si faltan para llegar a 3, se completa con lo que haya
  for (const item of [...mains, ...surprises]) {
    if (result.length >= 3) break;

    if (!result.includes(item)) {
      result.push(item);
    }
  }

  return result;
}

/**
 * Cuántos títulos quedan por mostrar (sin contar los descartados).
 */
export function countAvailable<T extends Windowable>(
  items: T[],
  hidden: readonly number[]
): number {
  const hiddenSet = new Set(hidden);

  return items.filter(
    (item) => !hiddenSet.has(item.id)
  ).length;
}
