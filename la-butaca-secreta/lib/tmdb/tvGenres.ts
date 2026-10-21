import type { RecommendationFilters } from "@/lib/recommendation/filters";

/**
 * TMDb usa géneros distintos para series y para películas:
 *
 * - Las series juntan varios en uno: "Action & Adventure" (10759),
 *   "Sci-Fi & Fantasy" (10765) y "War & Politics" (10768).
 * - No existen Terror (27), Thriller (53) ni Romance (10749).
 *
 * Todo el motor trabaja con los géneros de películas, así que aquí
 * se traduce en las dos direcciones.
 */

// ---------- De serie a película (para puntuar y mostrar) ----------

const TV_TO_MOVIE: Record<number, number[]> = {
  10759: [28, 12],
  10765: [878, 14],
  10768: [10752],
  10762: [10751],
};

export function normalizeTvGenreIds(ids: number[] = []): number[] {
  const result: number[] = [];

  for (const id of ids) {
    for (const mapped of TV_TO_MOVIE[id] ?? [id]) {
      if (!result.includes(mapped)) {
        result.push(mapped);
      }
    }
  }

  return result;
}

// ---------- De película a serie (para buscar) ----------

// Género de película → su equivalente más cercano en series.
// Terror y thriller no existen: lo más parecido es "Misterio".
// Romance tampoco: las series románticas van como "Drama".
const MOVIE_TO_TV_WITH: Record<number, number> = {
  28: 10759,
  12: 10759,
  878: 10765,
  14: 10765,
  10752: 10768,
  27: 9648,
  53: 9648,
  10749: 18,
};

// Solo se excluye lo que existe tal cual en series: no se puede
// "excluir terror" si las series no tienen ese género.
const TV_EXCLUDABLE = new Set([16, 35, 80, 99, 18, 9648, 10751, 37]);

export function toTvFilters(
  filters: RecommendationFilters
): RecommendationFilters {
  const withGenres = [
    ...new Set(
      filters.withGenres.map((id) => MOVIE_TO_TV_WITH[id] ?? id)
    ),
  ];

  const withoutGenres = [
    ...new Set(
      filters.withoutGenres.filter((id) => TV_EXCLUDABLE.has(id))
    ),
  ].filter((id) => !withGenres.includes(id));

  return { ...filters, withGenres, withoutGenres };
}
