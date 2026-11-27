"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { useListLikes } from "@/hooks/useListLikes";
import type { CanonResult } from "@/lib/canon";
import {
  TOP_MIN_TITLES,
  fromCanon,
  fromTop,
  type Poster,
  type TopTitle,
} from "@/lib/lists/shared";
import { fetchListComments } from "@/lib/supabase/listsFeed";

import { AuthorBadge, LikeButton, ListComments, PosterGrid } from "./parts";

type Props = {
  // Id de la lista de usuario, o "canon" / "top".
  listKey: string;
  title: string;
  author: string;
  authorHref?: string;
  official: boolean;
  description?: string;
  // Para listas de usuario ya vienen del servidor; para las oficiales
  // se piden aquí (null).
  initialPosters: Poster[] | null;
  // Recuento de "me gusta" (solo listas de usuario).
  likesTotal?: number;
};

/**
 * Página de una lista (/lista/[id]): pósters numerados, "me gusta" (en
 * las de la comunidad) y comentarios. Con dirección propia, así que se
 * puede compartir, el botón "atrás" vuelve a donde estabas y las
 * notificaciones enlazan aquí (con #comentarios para abrir esa pestaña).
 */
export default function ListPage({
  listKey,
  title,
  author,
  authorHref,
  official,
  description,
  initialPosters,
  likesTotal,
}: Props) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const likes = useListLikes(userId);

  const [posters, setPosters] = useState<Poster[] | null>(initialPosters);
  const [section, setSection] = useState<"titles" | "comments">("titles");
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const onCount = useCallback((count: number) => setCommentCount(count), []);

  // /lista/xxx#comentarios (desde una notificación) abre los comentarios.
  useEffect(() => {
    if (window.location.hash === "#comentarios") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSection("comments");
    }
  }, []);

  // Las oficiales se cargan aquí (comparten caché con la pestaña Listas).
  useEffect(() => {
    if (initialPosters) return;

    let cancelled = false;

    if (listKey === "canon") {
      fetch("/api/canon")
        .then((response) => (response.ok ? response.json() : []))
        .then((rows: CanonResult[]) => {
          if (!cancelled) setPosters(fromCanon(rows));
        })
        .catch(() => {
          if (!cancelled) setPosters([]);
        });
    } else if (listKey === "top") {
      fetch("/api/listas")
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { top: TopTitle[] } | null) => {
          if (cancelled) return;
          const top = data?.top ?? [];
          setPosters(top.length >= TOP_MIN_TITLES ? fromTop(top) : []);
        })
        .catch(() => {
          if (!cancelled) setPosters([]);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [listKey, initialPosters]);

  // El número de comentarios se ve en la pestaña desde el principio.
  useEffect(() => {
    let cancelled = false;

    fetchListComments(listKey).then((rows) => {
      if (!cancelled && rows) setCommentCount(rows.length);
    });

    return () => {
      cancelled = true;
    };
  }, [listKey]);

  const commentsLabel =
    commentCount === null
      ? "Comentarios"
      : `${commentCount} ${commentCount === 1 ? "comentario" : "comentarios"}`;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/?tab=listas"
        className="flex w-fit items-center gap-2 text-sm text-zinc-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span aria-hidden="true">←</span> Listas
      </Link>

      <div>
        <p className="text-sm">
          {authorHref ? (
            <a href={authorHref} className="hover:underline">
              <AuthorBadge author={author} official={official} />
            </a>
          ) : (
            <AuthorBadge author={author} official={official} />
          )}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-zinc-400">{description}</p>
        )}
      </div>

      {!official && likesTotal !== undefined && (
        <LikeButton
          like={likes.likeFor(listKey, likesTotal)}
          canLike={Boolean(userId)}
          onToggle={() => likes.toggle(listKey, likesTotal)}
        />
      )}

      <div
        role="tablist"
        aria-label="Contenido de la lista"
        className="flex border-b border-white/10"
      >
        {(
          [
            ["titles", "Títulos"],
            ["comments", commentsLabel],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`lista-tab-${id}`}
            aria-selected={section === id}
            aria-controls={`lista-panel-${id}`}
            onClick={() => setSection(id)}
            className={`flex-1 border-b-2 px-2 pb-2.5 pt-1 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-white ${
              section === id
                ? "border-amber-300 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`lista-panel-${section}`}
        aria-labelledby={`lista-tab-${section}`}
      >
        {section === "comments" ? (
          <ListComments listKey={listKey} userId={userId} onCount={onCount} />
        ) : posters === null ? (
          <p className="text-sm text-zinc-400">Cargando…</p>
        ) : posters.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {listKey === "top"
              ? "Todavía no hay suficientes valoraciones para el Top. ¡Valora lo que ves!"
              : "Esta lista está vacía."}
          </p>
        ) : (
          <PosterGrid posters={posters} />
        )}
      </div>
    </div>
  );
}
