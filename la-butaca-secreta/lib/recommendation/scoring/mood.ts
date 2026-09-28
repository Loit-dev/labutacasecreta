import { MoodGenres } from "../genres";

import {
  ScoreContext,
  ScoredItem,
} from "./types";

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

  // Género principal asociado al mood
  const primaryGenre = config.genres[0];

  if (
    primaryGenre &&
    item.genres.includes(primaryGenre)
  ) {
    score += 30;
  }

  // Géneros secundarios
  config.genres
    .slice(1)
    .forEach((genre) => {
      if (item.genres.includes(genre)) {
        score += 8;
      }
    });

  // Penalizaciones del mood
  if (config.excludedGenres) {
    config.excludedGenres.forEach((genre) => {
      if (item.genres.includes(genre)) {
        score -= 20;
      }
    });
  }

  return score;
}