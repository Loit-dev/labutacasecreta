/**
 * Helpers para el selector de fecha "¿cuándo la viste?" al marcar un
 * título como visto (components/recommendations/RatingPrompt.tsx).
 */

/** Hoy, en formato YYYY-MM-DD y huso horario local (para <input type="date">). */
export function todayDateInput(): string {
  const now = new Date();

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Convierte el valor de un <input type="date"> (YYYY-MM-DD, en el
 * huso horario del navegador) a un timestamp ISO estable. Usamos el
 * mediodía local en vez de medianoche para que un pequeño desfase de
 * huso horario (al guardar o al volver a leer) no cambie el día.
 */
export function dateInputToISO(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0).toISOString();
}
