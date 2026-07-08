import { ScoreContext, ScoredItem } from "./types";

export function scoreFreshness(
  item: ScoredItem,
  context: ScoreContext
): number {
  if (!item.releaseDate) {
    return 0;
  }

  const year = Number(
    item.releaseDate.substring(0, 4)
  );

  if (!year) {
    return 0;
  }

  switch (context.profile.freshness) {
    case "new":
      if (year >= 2024) return 25;
      if (year >= 2022) return 18;
      if (year >= 2020) return 10;
      return -10;

    case "classic":
      if (year <= 1990) return 25;
      if (year <= 2005) return 18;
      if (year <= 2015) return 8;
      return -10;

    case "any":
    default:
      return 0;
  }
}