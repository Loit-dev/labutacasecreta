import { UserProfile } from "@/lib/conversation/types";

/**
 * Explica de forma sencilla por qué se recomienda un título
 * ("Transparencia" en docs/RECOMMENDATION_ENGINE.md).
 *
 * Solo afirma cosas que se pueden comprobar con los datos de
 * TMDb (géneros, nota, nº de votos): nunca inventa motivos.
 */

interface ReasonInput {
  genreIds: number[];
  voteAverage: number;
  voteCount: number;
}

const MOOD_REASONS: Record<
  string,
  { genres: number[]; text: string }
> = {
  laugh: {
    genres: [35],
    text: "te va a sacar más de una sonrisa",
  },
  emotion: {
    genres: [18, 10749],
    text: "es de las que emocionan",
  },
  tension: {
    genres: [53, 9648],
    text: "te mantendrá en tensión",
  },
  think: {
    genres: [878, 9648],
    text: "te dará mucho en que pensar",
  },
  adventure: {
    genres: [12, 28],
    text: "tiene aventura de sobra",
  },
  surprise: {
    genres: [53, 878],
    text: "puede sorprenderte",
  },
};

const GENRE_REASONS: Record<
  string,
  { genres: number[]; label: string }
> = {
  scifi: { genres: [878], label: "ciencia ficción" },
  action: { genres: [28], label: "acción" },
  thriller: {
    genres: [53, 9648, 80],
    label: "thriller",
  },
  comedy: { genres: [35], label: "comedia" },
  horror: { genres: [27], label: "terror" },
  drama: { genres: [18], label: "drama" },
  romance: { genres: [10749], label: "romance" },
  adventure: {
    genres: [12, 14],
    label: "aventuras",
  },
};

const COMPANY_REASONS: Record<
  string,
  { genres: number[]; text: string }
> = {
  partner: {
    genres: [10749, 35],
    text: "funciona muy bien para ver en pareja",
  },
  friends: {
    genres: [35, 28, 12],
    text: "es un plan genial para ver con amigos",
  },
  family: {
    genres: [10751, 16],
    text: "es apta para ver en familia",
  },
};

function hasAny(ids: number[], wanted: number[]) {
  return wanted.some((id) => ids.includes(id));
}

export function buildRecommendationReason(
  profile: UserProfile,
  item: ReasonInput
): string {
  const reasons: string[] = [];

  const genre = profile.preferredGenre
    ? GENRE_REASONS[profile.preferredGenre]
    : undefined;

  if (genre && hasAny(item.genreIds, genre.genres)) {
    reasons.push(
      `encaja con tus ganas de ${genre.label}`
    );
  }

  const mood = profile.mood
    ? MOOD_REASONS[profile.mood]
    : undefined;

  if (mood && hasAny(item.genreIds, mood.genres)) {
    reasons.push(mood.text);
  }

  const company = profile.company
    ? COMPANY_REASONS[profile.company]
    : undefined;

  if (
    company &&
    hasAny(item.genreIds, company.genres)
  ) {
    reasons.push(company.text);
  }

  switch (profile.discoveryMode) {
    case "hidden-gem":
      if (
        item.voteAverage >= 7 &&
        item.voteCount <= 5000
      ) {
        reasons.push(
          "es una joya que no ha llegado a tanta gente"
        );
      }
      break;

    case "impact":
      if (item.voteAverage >= 7.5) {
        reasons.push(
          "es de las que dejan huella"
        );
      }
      break;

    case "relax":
      if (hasAny(item.genreIds, [35, 12])) {
        reasons.push("es ideal para desconectar");
      }
      break;
  }

  // Siempre queda algo verificable que decir
  if (reasons.length === 0) {
    return `Muy bien valorada por el público (${item.voteAverage.toFixed(
      1
    )} en TMDb).`;
  }

  const [first, second] = reasons;

  const sentence = second
    ? `${first} y ${second}`
    : first;

  return `Te la recomiendo porque ${sentence}.`;
}
