import type { Recommendation } from "@/lib/tmdb/mapper";

export type Badge = {
  badge: string;
  badgeTitle: string;
};

const GOLD: Badge = {
  badge: "🥇",
  badgeTitle: "Mi apuesta para ti",
};

const SILVER: Badge = {
  badge: "🥈",
  badgeTitle: "Otra que creo que disfrutarás",
};

const BRONZE: Badge = {
  badge: "🥉",
  badgeTitle: "Una sorpresa que merece una oportunidad",
};

const EXTRA: Badge = {
  badge: "🎬",
  badgeTitle: "Otra que puede gustarte",
};

const TRENDING: Badge = {
  badge: "🔥",
  badgeTitle: "Lo más visto ahora mismo",
};

// Cuando la recomendación la ve otra persona (enlace compartido),
// los textos no hablan «para ti».
const SHARED: Record<"gold" | "silver" | "bronze" | "extra", Badge> = {
  gold: { badge: "🥇", badgeTitle: "Apuesta principal" },
  silver: { badge: "🥈", badgeTitle: "Otra opción" },
  bronze: { badge: "🥉", badgeTitle: "La sorpresa" },
  extra: { badge: "🎬", badgeTitle: "Otra recomendación" },
};

// La insignia depende del tipo de recomendación, no de la posición:
// así la sorpresa siempre es 🥉 aunque se descarte otra tarjeta.
export function badgeFor(
  item: Recommendation,
  index: number,
  list: Recommendation[],
  shared = false
): Badge {
  if (item.role === "trending") {
    return TRENDING;
  }

  if (item.role === "surprise") {
    return shared ? SHARED.bronze : BRONZE;
  }

  const mainsBefore = list
    .slice(0, index)
    .filter((other) => other.role !== "surprise")
    .length;

  if (shared) {
    return [SHARED.gold, SHARED.silver][mainsBefore] ?? SHARED.extra;
  }

  return [GOLD, SILVER][mainsBefore] ?? EXTRA;
}
