import { ScoreContext, ScoredItem } from "./types";

export function scoreDiscoveryMode(
  item: ScoredItem,
  context: ScoreContext
): number {
  const mode =
    context.profile.discoveryMode;

  if (!mode) {
    return 0;
  }

  switch (mode) {
    case "impact":
      if (item.voteAverage >= 8.5) {
        return 40;
      }

      if (item.voteAverage >= 8) {
        return 30;
      }

      if (item.voteAverage >= 7.5) {
        return 20;
      }

      return 0;

    case "relax": {
  let score = 0;

  // Entretenidas

  if (item.genres.includes(35)) {
    score += 25;
  }

  if (item.genres.includes(28)) {
    score += 20;
  }

  if (item.genres.includes(12)) {
    score += 15;
  }

  if (item.genres.includes(878)) {
    score += 10;
  }

  // Ya no premiamos Familia

  // Géneros más densos

  if (item.genres.includes(18)) {
    score -= 15;
  }

  if (item.genres.includes(9648)) {
    score -= 10;
  }

  if (item.genres.includes(27)) {
    score -= 25;
  }

  return score;
}

    case "hidden-gem":
      if (
        item.voteAverage >= 7.5 &&
        item.voteCount >= 100 &&
        item.voteCount <= 5000
      ) {
        return 45;
      }

      return 0;

    case "surprise":
      return Math.floor(
        Math.random() * 40
      );

    default:
      return 0;
  }
}