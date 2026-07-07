import { UserProfile } from "./types";

const replies: Record<string, Record<string, string>> = {
  contentType: {
    movie: "Quiero ver una película.",
    tv: "Prefiero una serie.",
  },

  company: {
    alone: "Voy a verla solo.",
    partner: "La veré con mi pareja.",
    friends: "Voy a verla con amigos.",
    family: "Será un plan en familia.",
  },

  mood: {
    laugh: "Quiero reírme.",
    tension: "Me apetece estar en tensión.",
    think: "Quiero algo que me haga pensar.",
    emotion: "Me apetece emocionarme.",
    adventure: "Quiero vivir una aventura.",
    surprise: "Sorpréndeme.",
    anything: "Me da un poco igual.",
  },

  restrictions: {
    terror: "Prefiero evitar el terror.",
    violence: "No me apetece violencia.",
    romance: "Hoy paso del romance.",
    musical: "No quiero musicales.",
    documentary: "No me apetecen documentales.",
    none: "No tengo ninguna restricción.",
  },

  duration: {
    short: "Tengo menos de hora y media.",
    normal: "Una duración normal está bien.",
    long: "Hoy tengo tiempo de sobra.",
    any: "La duración me da igual.",
  },

  freshness: {
    new: "Prefiero algo reciente.",
    classic: "Me apetece un clásico.",
    any: "Me da igual.",
  },
};

export function getUserReply(
  field: keyof UserProfile,
  value: string,
  fallback: string
) {
  return replies[field]?.[value] ?? fallback;
}