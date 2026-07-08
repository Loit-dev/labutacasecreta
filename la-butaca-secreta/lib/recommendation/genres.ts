export type Mood =
  | "laugh"
  | "emotion"
  | "tension"
  | "think"
  | "adventure"
  | "surprise"
  | "anything";

export interface MoodProfile {
  genres: number[];
  excludedGenres?: number[];
}

export const MoodGenres: Record<Mood, MoodProfile> = {
  laugh: {
    genres: [35],
    excludedGenres: [27],
  },

  emotion: {
    genres: [18, 10749],
  },

  tension: {
    genres: [53, 9648, 80],
  },

  think: {
    genres: [878, 18, 9648],
  },

  adventure: {
    genres: [12, 14, 28],
  },

  surprise: {
    genres: [53, 9648, 878],
  },

  anything: {
    genres: [],
  },
};

export const GenreNames: Record<number, string> = {
  12: "Aventura",
  14: "Fantasía",
  16: "Animación",
  18: "Drama",
  27: "Terror",
  28: "Acción",
  35: "Comedia",
  36: "Historia",
  37: "Western",
  53: "Thriller",
  80: "Crimen",
  878: "Ciencia ficción",
  9648: "Misterio",
  10402: "Música",
  10749: "Romance",
  10751: "Familia",
  10752: "Bélica",
};