// Lógica pura de la pestaña Listas y de /lista/[id] (sin React ni
// Supabase), para poder probarla en tests/lists.test.ts.

export type MediaType = "movie" | "tv";

export type Poster = {
  key: string;
  title: string;
  poster: string | null;
  href: string | null;
  note?: string;
};

export type LikeState = { count: number; liked: boolean };

export type TopTitle = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterUrl: string | null;
  avgRating: number;
  votes: number;
};

export type PopularList = {
  id: string;
  name: string;
  username: string | null;
  itemsCount: number;
  likesRecent: number;
  likesTotal: number;
  posters: string[];
};

export type PublicListItem = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterUrl: string | null;
};

export type CanonLike = {
  title: string;
  year: number;
  director: string;
  tmdbId: number | null;
  poster: string | null;
};

// El Top se enseña cuando hay al menos TOP_MIN_TITLES títulos con
// TOP_MIN_VOTES votos o más (con menos, el ranking aún no dice nada).
export const TOP_MIN_TITLES = 5;
export const TOP_MIN_VOTES = 2;

export const OFFICIAL_LISTS = {
  top: {
    title: "Top de La Butaca",
    description:
      "Las películas y series mejor valoradas por la comunidad de La Butaca Secreta. Se usa una media ponderada para que un título con muy pocos votos no salga arriba del todo.",
  },
  canon: {
    title: "El Canon",
    description:
      "250 películas imprescindibles de la historia del cine, de los años 20 a hoy. Lleva tu progreso en Mi cuenta → El Canon.",
  },
} as const;

export type OfficialKey = keyof typeof OFFICIAL_LISTS;

export function isOfficialKey(key: string): key is OfficialKey {
  return key === "top" || key === "canon";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ¿Es un id válido para /lista/[id]? ("top", "canon" o un uuid) */
export function isListKey(key: string): boolean {
  return isOfficialKey(key) || UUID.test(key);
}

export function listHref(key: string): string {
  return `/lista/${key}`;
}

export function titleHref(mediaType: MediaType, tmdbId: number | null) {
  if (!tmdbId) return null;

  return mediaType === "tv" ? `/serie/${tmdbId}` : `/pelicula/${tmdbId}`;
}

export function fromTop(items: TopTitle[]): Poster[] {
  return items.map((item) => ({
    key: `${item.mediaType}-${item.tmdbId}`,
    title: item.title,
    poster: item.posterUrl,
    href: titleHref(item.mediaType, item.tmdbId),
    note: `★ ${item.avgRating.toFixed(1)} · ${item.votes} votos`,
  }));
}

export function fromCanon(items: CanonLike[]): Poster[] {
  return items.map((item, index) => ({
    key: `canon-${item.tmdbId ?? index}`,
    title: item.title,
    poster: item.poster,
    href: titleHref("movie", item.tmdbId),
    note: `${item.director} · ${item.year}`,
  }));
}

export function fromListItems(items: PublicListItem[]): Poster[] {
  return items.map((item, index) => ({
    key: `${item.mediaType}-${item.tmdbId}-${index}`,
    title: item.title,
    poster: item.posterUrl,
    href: titleHref(item.mediaType, item.tmdbId),
  }));
}

/**
 * Solo se pueden mostrar pósters que pasen por next/image: la CSP
 * (next.config.ts) únicamente deja cargar imágenes de 'self', así que
 * un <img> directo a image.tmdb.org sale roto.
 */
export function canOptimize(src: string | null | undefined): src is string {
  return (
    typeof src === "string" &&
    (src.startsWith("/") || src.startsWith("https://image.tmdb.org/"))
  );
}

/** Los pósters de la tira de una tarjeta: solo los que hay, máximo 7. */
export function stripPosters<T extends { poster: string | null }>(
  items: T[],
  max = 7
): T[] {
  return items.filter((item) => canOptimize(item.poster)).slice(0, max);
}

/**
 * Reparte las listas de la comunidad: las que han recibido algún "me
 * gusta" esta semana van a "Popular esta semana"; el resto, a
 * "Recientes" (así la pestaña no se ve vacía mientras hay pocos "me
 * gusta").
 */
export function splitLists<T extends { likesRecent: number }>(
  lists: T[]
): { popular: T[]; recent: T[] } {
  return {
    popular: lists.filter((list) => list.likesRecent > 0),
    recent: lists.filter((list) => list.likesRecent <= 0),
  };
}

/** Aplica un "me gusta" (o lo quita) a un recuento, sin bajar de 0. */
export function toggleLike(state: LikeState): LikeState {
  return {
    liked: !state.liked,
    count: Math.max(0, state.count + (state.liked ? -1 : 1)),
  };
}

export function timeAgo(iso: string, now: number = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);

  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.round(minutes / 60);

  if (hours < 24) return `hace ${hours} h`;

  const days = Math.round(hours / 24);

  if (days < 30) return `hace ${days} ${days === 1 ? "día" : "días"}`;

  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function itemsLabel(count: number): string {
  return `${count} ${count === 1 ? "título" : "títulos"}`;
}
