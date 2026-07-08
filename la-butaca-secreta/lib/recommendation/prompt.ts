export function buildRecommendationReason(
  profile: {
    mood?: string;
    company?: string;
    duration?: string;
  }
) {
  return `Recomendación basada en:
- Estado de ánimo: ${profile.mood ?? "cualquiera"}
- Compañía: ${profile.company ?? "indiferente"}
- Duración: ${profile.duration ?? "indiferente"}`;
}