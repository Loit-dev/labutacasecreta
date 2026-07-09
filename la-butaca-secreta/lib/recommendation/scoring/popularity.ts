import { ScoreContext, ScoredItem } from "./types";

export function scorePopularity(
  item: ScoredItem,
  _context: ScoreContext
): number {
  let score = 0;

  // Valoración media

  if (item.voteAverage >= 8.5) {
    score += 20;
  } else if (item.voteAverage >= 8) {
    score += 15;
  } else if (item.voteAverage >= 7.5) {
    score += 10;
  } else if (item.voteAverage >= 7) {
    score += 5;
  }

  // Confianza en la nota

  if (item.voteCount >= 10000) {
    score += 5;
  } else if (item.voteCount >= 5000) {
    score += 4;
  } else if (item.voteCount >= 1000) {
    score += 3;
  } else if (item.voteCount >= 300) {
    score += 2;
  }

  // Popularidad actual

  if (item.popularity >= 500) {
    score += 5;
  } else if (item.popularity >= 200) {
    score += 3;
  } else if (item.popularity >= 100) {
    score += 2;
  }

  return score;
}
