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

  const currentYear =
    new Date().getFullYear();

  switch (
    context.profile.freshness
  ) {
    case "new": {
      const age =
        currentYear - year;

      if (age <= 1) return 40;

      if (age <= 2) return 30;

      if (age <= 3) return 20;

      if (age <= 5) return 10;

      return -10;
    }

    case "classic": {
      if (year <= 1980)
        return 40;

      if (year <= 1990)
        return 30;

      if (year <= 2005)
        return 20;

      if (year <= 2015)
        return 10;

      return -10;
    }

    case "any":
    default:
      return 0;
  }
}