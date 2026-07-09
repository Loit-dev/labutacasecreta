import { ScoreContext, ScoredItem } from "./types";

export function scoreCompany(
  item: ScoredItem,
  context: ScoreContext
): number {
  const company =
    context.profile.company;

  if (!company) {
    return 0;
  }

  let score = 0;

  switch (company) {
    case "family":
      if (item.genres.includes(10751)) score += 30;
      if (item.genres.includes(16)) score += 20;
      if (item.genres.includes(12)) score += 15;
      if (item.genres.includes(35)) score += 10;

      if (item.genres.includes(27)) score -= 50;
      if (item.genres.includes(53)) score -= 25;
      if (item.genres.includes(80)) score -= 25;

      break;

    case "partner":
      if (item.genres.includes(10749))
        score += 25;

      if (item.genres.includes(35))
        score += 15;

      if (item.voteAverage >= 7.5)
        score += 15;

      if (item.voteAverage >= 8)
        score += 10;

      if (item.genres.includes(10751))
        score -= 10;

      break;

    case "friends":
      if (item.genres.includes(35))
        score += 20;

      if (item.genres.includes(28))
        score += 15;

      if (item.genres.includes(12))
        score += 15;

      if (item.genres.includes(878))
        score += 5;

      break;

    case "alone":
      if (item.genres.includes(53))
        score += 20;

      if (item.genres.includes(9648))
        score += 20;

      if (item.genres.includes(878))
        score += 15;

      if (item.genres.includes(18))
        score += 5;

      break;
  }

  return score;
}