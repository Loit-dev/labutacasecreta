import { ScoreContext, ScoredItem } from "./types";

export function scoreCompany(
  item: ScoredItem,
  context: ScoreContext
): number {
  switch (context.profile.company) {
    case "family":
      if (item.genres.includes(10751)) {
        return 20;
      }

      if (
        item.genres.includes(27) ||
        item.genres.includes(53)
      ) {
        return -25;
      }

      return 0;

    case "partner":
      if (item.genres.includes(10749)) {
        return 15;
      }

      if (item.genres.includes(18)) {
        return 8;
      }

      return 0;

    case "friends":
      if (
        item.genres.includes(35) ||
        item.genres.includes(28)
      ) {
        return 15;
      }

      return 0;

    case "alone":
      return 0;

    default:
      return 0;
  }
}