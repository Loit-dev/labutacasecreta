export interface TMDBMovie {
  id: number;

  title?: string;

  name?: string;

  original_title?: string;

  original_name?: string;

  overview: string;

  poster_path: string | null;

  backdrop_path: string | null;

  release_date?: string;

  first_air_date?: string;

  vote_average: number;

  vote_count: number;

  genre_ids: number[];

  adult: boolean;

  original_language: string;

  popularity: number;
}

export interface TMDBResponse {
  page: number;

  results: TMDBMovie[];

  total_pages: number;

  total_results: number;
}

export interface TMDBGenre {
  id: number;

  name: string;
}

export interface TMDBMovieDetails {
  id: number;

  runtime?: number;

  episode_run_time?: number[];

  genres: TMDBGenre[];

  homepage?: string;

  status: string;

  tagline: string;
}

export interface TMDBProvider {
  provider_id: number;

  provider_name: string;

  logo_path: string;
}

export interface TMDBCountryProviders {
  flatrate?: TMDBProvider[];

  rent?: TMDBProvider[];

  buy?: TMDBProvider[];
}

export interface TMDBWatchProviders {
  results: Record<
    string,
    TMDBCountryProviders
  >;
}

export interface TMDBCastMember {
  id: number;

  name: string;

  character: string;

  profile_path: string | null;
}

export interface TMDBCrewMember {
  id: number;

  name: string;

  job: string;

  department: string;

  profile_path: string | null;
}

export interface TMDBCredits {
  cast: TMDBCastMember[];

  crew: TMDBCrewMember[];
}