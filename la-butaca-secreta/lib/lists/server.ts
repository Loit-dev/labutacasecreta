/**
 * Datos de la pestaña Listas y de /lista/[id] leídos en el servidor
 * (lib/supabase/rest.ts), para poder cachearlos: así la base de datos
 * calcula "Popular esta semana" y el Top una vez cada pocos minutos en
 * vez de en cada visita. Lo que depende de quién mira (sus "me gusta")
 * se pide aparte desde el navegador.
 */

import { supabaseRpc, supabaseSelect } from "@/lib/supabase/rest";

import {
  TOP_MIN_VOTES,
  type PopularList,
  type PublicListItem,
  type TopTitle,
} from "./shared";

// Segundos que se reutiliza la respuesta antes de volver a preguntar.
export const FEED_REVALIDATE = 300;
export const LIST_REVALIDATE = 60;

type PopularRow = {
  id: string;
  name: string;
  username: string | null;
  items_count: number;
  likes_recent: number;
  likes_total: number;
  posters: string[] | null;
};

type TopRow = {
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_url: string | null;
  avg_rating: number;
  votes: number;
};

export type ListsFeedData = {
  top: TopTitle[];
  lists: PopularList[];
};

export async function fetchListsFeed(): Promise<ListsFeedData> {
  const [popular, top] = await Promise.all([
    supabaseRpc<PopularRow[]>(
      "popular_lists",
      { p_days: 7, p_limit: 30 },
      FEED_REVALIDATE
    ),
    supabaseRpc<TopRow[]>(
      "top_rated_titles",
      { p_min_votes: TOP_MIN_VOTES, p_limit: 100 },
      FEED_REVALIDATE
    ),
  ]);

  return {
    lists: (Array.isArray(popular) ? popular : []).map((row) => ({
      id: row.id,
      name: row.name,
      username: row.username ?? null,
      itemsCount: Number(row.items_count) || 0,
      likesRecent: Number(row.likes_recent) || 0,
      likesTotal: Number(row.likes_total) || 0,
      posters: row.posters ?? [],
    })),
    top: (Array.isArray(top) ? top : []).map((row) => ({
      tmdbId: Number(row.tmdb_id),
      mediaType: row.media_type === "tv" ? "tv" : "movie",
      title: row.title,
      posterUrl: row.poster_url ?? null,
      avgRating: Number(row.avg_rating) || 0,
      votes: Number(row.votes) || 0,
    })),
  };
}

export type UserListPage = {
  id: string;
  name: string;
  username: string | null;
  likesTotal: number;
  items: PublicListItem[];
};

type MetaRow = {
  id: string;
  name: string;
  username: string | null;
  likes_total: number;
};

type ItemRow = {
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_url: string | null;
};

/** Una lista pública de un usuario, o null si no existe o es privada. */
export async function fetchUserListPage(
  id: string
): Promise<UserListPage | null> {
  const meta = await supabaseRpc<MetaRow[]>(
    "public_list_meta",
    { p_list_id: id },
    LIST_REVALIDATE
  );

  const row = Array.isArray(meta) ? meta[0] : undefined;

  if (!row) return null;

  const items = await supabaseSelect<ItemRow[]>(
    `list_items?list_id=eq.${encodeURIComponent(id)}&select=tmdb_id,media_type,title,poster_url&order=added_at.asc`,
    LIST_REVALIDATE
  );

  return {
    id: row.id,
    name: row.name,
    username: row.username ?? null,
    likesTotal: Number(row.likes_total) || 0,
    items: (items ?? []).map((item) => ({
      tmdbId: Number(item.tmdb_id),
      mediaType: item.media_type === "tv" ? "tv" : "movie",
      title: item.title,
      posterUrl: item.poster_url,
    })),
  };
}
