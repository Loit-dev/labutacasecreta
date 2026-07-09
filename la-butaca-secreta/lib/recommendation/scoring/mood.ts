import { MoodGenres } from "../genres";

import { ScoreContext, ScoredItem } from "./types";

export function scoreMood(
  item: ScoredItem,
  context: ScoreContext
): number {
  const mood = context.profile.mood;

  if (!mood) {
    return 0;
  }

  const config =
    MoodGenres[
      mood as keyof typeof MoodGenres
    ];

  if (!config) {
    return 0;
  }

  let score = 0;

  // Géneros deseados
  const matchingGenres =
    config.genres.filter((genre) =>
      item.genres.includes(genre)
    ).length;

  score += matchingGenres * 15;

  // Bonus si coincide con varios géneros
  if (matchingGenres >= 2) {
    score += 15;
  }

  if (matchingGenres >= 3) {
    score += 10;
  }

  // Géneros no deseados
  if (config.excludedGenres) {
    const excludedMatches =
      config.excludedGenres.filter(
        (genre) =>
          item.genres.includes(genre)
      ).length;

    score -= excludedMatches * 15;
  }

  return score;
}