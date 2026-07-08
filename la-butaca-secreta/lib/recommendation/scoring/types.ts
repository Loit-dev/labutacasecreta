import { UserProfile } from "@/lib/conversation/types";

export interface ScoredItem {
  id: number;

  title: string;

  genres: number[];

  voteAverage: number;

  voteCount: number;

  popularity: number;

  runtime?: number;

  releaseDate?: string;

  originalLanguage?: string;

  providers?: string[];

  director?: string;

  cast?: string[];

  score: number;
}

export interface ScoreContext {
  profile: UserProfile;
}