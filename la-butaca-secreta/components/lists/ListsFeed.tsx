"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { useListLikes } from "@/hooks/useListLikes";
import type { CanonResult } from "@/lib/canon";
import {
  OFFICIAL_LISTS,
  TOP_MIN_TITLES,
  fromCanon,
  fromTop,
  itemsLabel,
  listHref,
  splitLists,
  type LikeState,
  type PopularList,
  type Poster,
  type TopTitle,
} from "@/lib/lists/shared";

import { AuthorBadge, LikeButton, PosterStrip } from "./parts";

/**
 * Pestaña "Listas" de la portada, al estilo de Letterboxd: listas
 * oficiales (Top de La Butaca y El Canon), las listas públicas de la
 * comunidad con "me gusta" esta semana y, debajo, las más recientes.
 * Cada tarjeta lleva a su propia página, /lista/[id].
 *
 * Los datos comunes vienen de /api/listas (cacheado en el servidor);
 * los "me gusta" propios, de useListLikes.
 */
export default function ListsFeed() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const likes = useListLikes(userId);

  const [top, setTop] = useState<TopTitle[] | null>(null);
  const [canon, setCanon] = useState<CanonResult[] | null>(null);
  const [lists, setLists] = useState<PopularList[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/listas")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { top: TopTitle[]; lists: PopularList[] } | null) => {
        if (cancelled) return;
        setTop(data?.top ?? []);
        setLists(data?.lists ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setTop([]);
        setLists([]);
      });

    fetch("/api/canon")
      .then((response) => (response.ok ? response.json() : []))
      .then((rows: CanonResult[]) => {
        if (!cancelled) setCanon(rows);
      })
      .catch(() => {
        if (!cancelled) setCanon([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const showTop = (top?.length ?? 0) >= TOP_MIN_TITLES;
  const { popular, recent } = splitLists(lists ?? []);

  function card(list: PopularList) {
    return (
      <ListCard
        key={list.id}
        href={listHref(list.id)}
        title={list.name}
        author={list.username ? `@${list.username}` : "Anónimo"}
        posters={list.posters.map((poster, index) => ({
          key: `${list.id}-${index}`,
          poster,
        }))}
        description={itemsLabel(list.itemsCount)}
        like={likes.likeFor(list.id, list.likesTotal)}
        canLike={Boolean(userId)}
        onToggleLike={() => likes.toggle(list.id, list.likesTotal)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-6">
        <h2 className="marquee-font text-2xl text-white sm:text-3xl">
          Listas oficiales
        </h2>

        {showTop && top && (
          <ListCard
            href={listHref("top")}
            title={OFFICIAL_LISTS.top.title}
            author="Oficial"
            official
            posters={fromTop(top)}
            description={`Las ${top.length} películas y series mejor valoradas por la comunidad de La Butaca Secreta.`}
          />
        )}

        <ListCard
          href={listHref("canon")}
          title={OFFICIAL_LISTS.canon.title}
          author="Oficial"
          official
          posters={canon ? fromCanon(canon) : []}
          description="250 películas imprescindibles de la historia del cine, de los años 20 a hoy."
        />
      </section>

      {lists === null ? (
        <p className="text-sm text-zinc-400">Cargando listas…</p>
      ) : lists.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-6 text-center text-sm text-zinc-300">
          Aún no hay listas públicas de la comunidad. Haz pública una de
          tus listas en{" "}
          <a
            href="/mi-cuenta?tab=listas"
            className="text-amber-300 underline-offset-2 hover:underline"
          >
            Mi cuenta → Listas
          </a>{" "}
          y aparecerá aquí.
        </p>
      ) : (
        <>
          {popular.length > 0 && (
            <section className="flex flex-col gap-6">
              <h2 className="marquee-font text-2xl text-white sm:text-3xl">
                Popular esta semana
              </h2>
              {popular.map(card)}
            </section>
          )}

          {recent.length > 0 && (
            <section className="flex flex-col gap-6">
              <h2 className="marquee-font text-2xl text-white sm:text-3xl">
                {popular.length > 0 ? "Más listas" : "Listas de la comunidad"}
              </h2>
              {recent.map(card)}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ListCard({
  href,
  title,
  author,
  official,
  posters,
  description,
  like,
  canLike,
  onToggleLike,
}: {
  href: string;
  title: string;
  author: string;
  official?: boolean;
  posters: Pick<Poster, "key" | "poster">[];
  description?: string;
  like?: LikeState;
  canLike?: boolean;
  onToggleLike?: () => void;
}) {
  return (
    <article className="border-b border-white/10 pb-6 last:border-b-0">
      <Link
        href={href}
        className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-snug text-zinc-100 group-hover:text-white sm:text-xl">
            {title}
          </h3>
          <AuthorBadge author={author} official={official} />
        </div>

        <PosterStrip posters={posters} />

        {description && (
          <p className="mt-3 text-sm text-zinc-400">{description}</p>
        )}
      </Link>

      {like && onToggleLike && (
        <LikeButton
          like={like}
          canLike={Boolean(canLike)}
          onToggle={onToggleLike}
          compact
        />
      )}
    </article>
  );
}
