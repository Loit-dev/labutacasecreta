import type { RecommendationFilters } from "./filters";

// Cuántos años hacia atrás cuenta como «reciente»
export const RECENT_YEARS = 12;

/**
 * Las búsquedas por nota («joya oculta», «algo que me marque») ordenan por
 * la mejor nota de toda la historia, y salen casi solo clásicos. Cuando la
 * persona no ha pedido ninguna época, se hace una segunda búsqueda igual
 * pero solo con títulos recientes, para que haya de todo entre los candidatos.
 *
 * Devuelve null si no hace falta (ya hay una época elegida o no se ordena
 * por nota).
 */
export function recentPoolFilters(
  filters: RecommendationFilters,
  currentYear: number = new Date().getFullYear()
): RecommendationFilters | null {
  if (filters.sortBy !== "vote_average.desc") return null;

  if (filters.releaseAfter || filters.releaseBefore) return null;

  return {
    ...filters,
    releaseAfter: `${currentYear - RECENT_YEARS}-01-01`,
  };
}
