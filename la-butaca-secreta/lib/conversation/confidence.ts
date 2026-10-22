import { UserProfile } from "./types";

// Un punto por cada pregunta que de verdad se hace (ver
// data/conversation/nodes.ts): si falta alguna aquí, o sobra una que
// ya no se pregunta, la barra de progreso se queda parada a mitad o
// no llega nunca al 100%.
const weights = {
  contentType: 20,
  company: 16,
  mood: 19,
  preferredGenre: 18,
  discoveryMode: 14,
  freshness: 11,
  restrictions: 2,
};

export function calculateConfidence(profile: UserProfile): number {
  let score = 0;

  Object.entries(weights).forEach(([key, value]) => {
    const field = profile[key as keyof UserProfile];

    if (Array.isArray(field)) {
      if (field.length > 0) score += value;
      return;
    }

    if (field !== undefined) {
      score += value;
    }
  });

  return score;
}

export function isConversationReady(profile: UserProfile): boolean {
  return calculateConfidence(profile) >= 85;
}