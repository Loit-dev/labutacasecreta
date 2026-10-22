import { UserProfile } from "@/lib/conversation/types";
import { effectiveCompany } from "./scoring/company";

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
  action: {
    genres: [28, 12],
    label: "acción y aventuras",
  },
  thriller: {
    genres: [53, 9648, 80],
    label: "thriller",
  },
  comedy: { genres: [35], label: "comedia" },
  horror: { genres: [27], label: "terror" },
  drama: { genres: [18], label: "drama" },
  romance: { genres: [10749], label: "romance" },
  family: {
    genres: [10751, 16],
    label: "un plan infantil y familiar",
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
  item: ReasonInput,
  // Frases ya usadas en el mismo lote de 3 recomendaciones. Dos títulos
  // con el mismo género y el mismo estado de ánimo generaban, si no,
  // la frase exactamente idéntica — se nota mucho al verlas una junto
  // a la otra y resta credibilidad a "te entiendo".
  usedReasons?: Set<string>
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

  // Quien pide «infantil y familiar» lo ve con niños, vaya con quien vaya
  const withWhom = effectiveCompany(profile);

  const company = withWhom
    ? COMPANY_REASONS[withWhom]
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

  // Todas las combinaciones de uno o dos motivos, de la más a la menos
  // específica. Cuando dos títulos del mismo lote comparten género y
  // estado de ánimo, probar varias combinaciones evita que acaben con
  // la misma frase exacta.
  const combos: string[] = [];

  for (let i = 0; i < reasons.length; i++) {
    for (let j = i + 1; j < reasons.length; j++) {
      combos.push(`${reasons[i]} y ${reasons[j]}`);
    }
  }

  combos.push(...reasons);

  let sentence =
    combos.find((candidate) => !usedReasons?.has(candidate)) ??
    combos[0];

  // Si ni variando la combinación se libra de la repetición (lote con
  // muy poca variedad de motivos posibles), se añade un dato propio
  // de la película: la nota, que casi nunca coincide entre dos títulos.
  if (usedReasons?.has(sentence)) {
    sentence = `${sentence}, y tiene ${item.voteAverage.toFixed(
      1
    )} en TMDb`;
  }

  usedReasons?.add(sentence);

  return `Te la recomiendo porque ${sentence}.`;
}
