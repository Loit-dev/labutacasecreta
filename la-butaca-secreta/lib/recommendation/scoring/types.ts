import { UserProfile } from "@/lib/conversation/types";

export interface ScoreContext {
  profile: UserProfile;

  // Géneros de los títulos que el usuario ha rechazado o valorado mal
  // (1-2 estrellas), de forma duradera entre visitas
  // (lib/genreAffinity.ts). Con repeticiones: un género rechazado 3
  // veces aparece 3 veces.
  dislikedGenres?: number[];

  // Géneros de los títulos que el usuario ha valorado con 4-5
  // estrellas, con la misma lógica de repeticiones y la misma fuente.
  likedGenres?: number[];
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