import { ScoredItem } from "./scoring/types";

export function diversify(
  items: ScoredItem[],
  max = 12
): ScoredItem[] {
  const selected: ScoredItem[] = [];

  const usedGenres = new Set<number>();

  for (const item of items) {
    const hasNewGenre = item.genres.some(
      (genre) => !usedGenres.has(genre)
    );

    if (
      selected.length < 3 ||
      hasNewGenre
    ) {
      selected.push(item);

      item.genres.forEach((genre) =>
        usedGenres.add(genre)
      );
    }

    if (selected.length >= max) {
      break;
    }
  }

  return selected;
}