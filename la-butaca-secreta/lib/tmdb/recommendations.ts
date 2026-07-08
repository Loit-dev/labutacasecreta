import { discoverMovies } from "./api";
import { mapMovie } from "./mapper";

export async function getRecommendations() {
  const movies = await discoverMovies();

  return movies.results
    .slice(0, 3)
    .map(mapMovie);
}