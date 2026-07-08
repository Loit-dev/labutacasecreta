import { ScoreContext, ScoredItem } from "./types";

import { scoreMood } from "./mood";
import { scoreCompany } from "./company";
import { scoreDuration } from "./duration";
import { scorePopularity } from "./popularity";
import { scoreFreshness } from "./freshness";
import { scoreProviders } from "./providers";

export function scoreItem(
  item: ScoredItem,
  context: ScoreContext
): number {
  let score = 0;

  score += scoreMood(item, context);

  score += scoreCompany(item, context);

  score += scoreDuration(item, context);

  score += scorePopularity(item, context);

  score += scoreFreshness(item, context);

  score += scoreProviders(item, context);

  return score;
}

export function sortByScore(
  items: ScoredItem[],
  context: ScoreContext
): ScoredItem[] {
  return items
    .map((item) => ({
      ...item,
      score: scoreItem(item, context),
    }))
    .sort((a, b) => b.score - a.score);
}