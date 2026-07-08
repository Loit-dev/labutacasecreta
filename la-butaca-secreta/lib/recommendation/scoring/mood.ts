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

  // Premiar géneros deseados
  for (const genre of config.genres) {
    if (item.genres.includes(genre)) {
      score += 25;
    }
  }

  // Penalizar géneros excluidos
  if (config.excludedGenres) {
    for (const genre of config.excludedGenres) {
      if (item.genres.includes(genre)) {
        score -= 35;
      }
    }
  }

  return score;
}