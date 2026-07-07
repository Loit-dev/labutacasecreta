import { UserProfile } from "./types";

const weights = {
  contentType: 25,
  company: 15,
  mood: 30,
  restrictions: 20,
  duration: 5,
  pace: 3,
  freshness: 2,
  language: 2,
  animation: 2,
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