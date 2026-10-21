import {
  getMovieFull,
  getTVFull,
} from "./api";

import {
  mapRecommendation,
} from "./mapper";

import {
  TMDBMovie,
} from "./types";

export async function enrichRecommendation(
  movie: TMDBMovie,
  type: "movie" | "tv"
) {
  const details =
    type === "movie"
      ? await getMovieFull(movie.id)
      : await getTVFull(movie.id);

  return mapRecommendation(
    movie,
    details,
    details["watch/providers"],
    details.credits
  );
}
