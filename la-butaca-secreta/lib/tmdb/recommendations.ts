import {
  getMovieCredits,
  getMovieDetails,
  getMovieProviders,
  getTVCredits,
  getTVDetails,
  getTVProviders,
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
  if (type === "movie") {
    const [
      details,
      providers,
      credits,
    ] = await Promise.all([
      getMovieDetails(movie.id),
      getMovieProviders(movie.id),
      getMovieCredits(movie.id),
    ]);

    return mapRecommendation(
      movie,
      details,
      providers,
      credits
    );
  }

  const [
    details,
    providers,
    credits,
  ] = await Promise.all([
    getTVDetails(movie.id),
    getTVProviders(movie.id),
    getTVCredits(movie.id),
  ]);

  return mapRecommendation(
    movie,
    details,
    providers,
    credits
  );
}