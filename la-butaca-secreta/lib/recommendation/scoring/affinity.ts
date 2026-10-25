import { ScoreContext, ScoredItem } from "./types";

// Bonificación por cada vez que un género del título ha sido valorado
// con 4-5 estrellas. Simétrico a scoreFeedback.ts (penalización por
// rechazo), pero más suave: que algo se valore bien no debe sepultar
// el resto de señales (ánimo, con quién, etc).
const BONUS_PER_LIKE = 3;

const MAX_BONUS = 18;

/**
 * Aprende de las valoraciones altas: cuantas más veces valoras bien
 * un género, más puntúan los títulos de ese género en próximas
 * búsquedas (ver lib/genreAffinity.ts, que es quien acumula esto).
 */
export function scoreAffinity(
  item: ScoredItem,
  context: ScoreContext
): number {
  const liked = context.likedGenres;

  if (!liked?.length) {
    return 0;
  }

  let bonus = 0;

  for (const genre of item.genres) {
    const times = liked.filter((id) => id === genre).length;

    bonus += times * BONUS_PER_LIKE;
  }

  return Math.min(bonus, MAX_BONUS);
}
