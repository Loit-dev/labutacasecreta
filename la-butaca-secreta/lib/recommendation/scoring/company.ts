import {
  ScoreContext,
  ScoredItem,
} from "./types";

/**
 * Quien pide algo «infantil y familiar» lo va a ver con niños,
 * vaya con quien vaya: se trata como un plan en familia.
 */
export function effectiveCompany(
  profile: ScoreContext["profile"]
) {
  return profile.preferredGenre === "family"
    ? "family"
    : profile.company;
}

export function scoreCompany(
  item: ScoredItem,
  context: ScoreContext
): number {
  const company = effectiveCompany(
    context.profile
  );

  if (!company) {
    return 0;
  }

  let score = 0;

  switch (company) {
    case "family":
      if (item.genres.includes(10751)) {
        score += 30;
      }

      if (item.genres.includes(16)) {
        score += 20;
      }

      if (item.genres.includes(12)) {
        score += 15;
      }

      if (item.genres.includes(35)) {
        score += 10;
      }

      if (item.genres.includes(27)) {
        score -= 50;
      }

      if (item.genres.includes(53)) {
        score -= 25;
      }

      if (item.genres.includes(80)) {
        score -= 25;
      }

      break;

    case "partner":
      if (item.genres.includes(10749)) {
        score += 25;
      }

      if (item.genres.includes(35)) {
        score += 15;
      }

      if (item.genres.includes(18)) {
        score += 5;
      }

      if (item.genres.includes(10751)) {
        score -= 10;
      }

      break;

    case "friends":
      if (item.genres.includes(35)) {
        score += 20;
      }

      if (item.genres.includes(28)) {
        score += 15;
      }

      if (item.genres.includes(12)) {
        score += 15;
      }

      if (item.genres.includes(878)) {
        score += 5;
      }

      break;

    case "alone":
      if (item.genres.includes(53)) {
        score += 20;
      }

      if (item.genres.includes(9648)) {
        score += 20;
      }

      if (item.genres.includes(878)) {
        score += 15;
      }

      if (item.genres.includes(18)) {
        score += 5;
      }

      break;
  }

  return score;
}