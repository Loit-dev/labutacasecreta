import { GenreMap } from "./genre";
import { ScoreContext, ScoredItem } from "./types";

// Penalización por cada vez que un género del título ha sido rechazado
const PENALTY_PER_DISLIKE = 4;

// Tope: rechazar cosas nunca debe sepultar un título que encaja bien
const MAX_PENALTY = 24;

/**
 * Aprende de "No me apetece": cuantas más veces rechaza el usuario un
 * género, menos puntúan los títulos de ese género.
 *
 * El género que el usuario eligió explícitamente nunca se penaliza:
 * si pidió thriller y descarta un thriller concreto, no quiere
 * "menos thrillers", quiere otro distinto.
 */
export function scoreFeedback(
  item: ScoredItem,
  context: ScoreContext
): number {
  const disliked = context.dislikedGenres;

  if (!disliked?.length) {
    return 0;
  }

  const protectedGenres =
    GenreMap[context.profile.preferredGenre ?? ""] ??
    [];

  let penalty = 0;

  for (const genre of item.genres) {
    if (protectedGenres.includes(genre)) {
      continue;
    }

    const times = disliked.filter(
      (id) => id === genre
    ).length;

    penalty += times * PENALTY_PER_DISLIKE;
  }

  // (evita devolver -0 cuando no hay nada que penalizar)
  return penalty === 0
    ? 0
    : -Math.min(penalty, MAX_PENALTY);
}
