import { UserProfile } from "@/lib/conversation/types";

export interface ScoreContext {
  profile: UserProfile;

  // Géneros de los títulos que el usuario ha rechazado en esta sesión
  // (con repeticiones: un género rechazado 3 veces aparece 3 veces).
  dislikedGenres?: number[];
}

export interface ScoredItem {
  id: number;

  title: string;

  genres: number[];

  voteAverage: number;

  voteCount: number;

  popularity: number;

  runtime: number;

  releaseDate?: string;

  originalLanguage?: string;

  providers?: string[];

  director?: string;

  cast?: string[];

  score: number;
}