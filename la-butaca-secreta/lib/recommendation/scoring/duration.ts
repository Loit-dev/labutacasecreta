import { ScoreContext, ScoredItem } from "./types";

export function scoreDuration(
  item: ScoredItem,
  context: ScoreContext
): number {
  if (!item.runtime) {
    return 0;
  }

  switch (context.profile.duration) {
    case "short":
      if (item.runtime <= 90) {
        return 20;
      }

      if (item.runtime > 120) {
        return -20;
      }

      return 0;

    case "normal":
      if (
        item.runtime >= 90 &&
        item.runtime <= 140
      ) {
        return 15;
      }

      return 0;

    case "long":
      if (item.runtime >= 140) {
        return 20;
      }

      if (item.runtime < 90) {
        return -10;
      }

      return 0;

    case "any":
    default:
      return 0;
  }
}