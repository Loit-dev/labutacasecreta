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
    <div className="flex flex-col gap-10 sm:gap-12">
      <section className="flex flex-col gap-4">
        <SectionHeader title="Listas oficiales" />

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
            <section className="flex flex-col gap-4">
              <SectionHeader title="Popular esta semana" count={popular.length} />
              {popular.map(card)}
            </section>
          )}

          {recent.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionHeader
                title={popular.length > 0 ? "Más listas" : "Listas de la comunidad"}
                count={recent.length}
              />
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
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.05] sm:p-5">
      <Link
        href={href}
        className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold leading-snug text-zinc-100 group-hover:text-white sm:text-lg">
            {title}
          </h3>
          <AuthorBadge author={author} official={official} />
        </div>

        <PosterStrip posters={posters} />

        {description && (
          <p className="mt-3 text-xs text-zinc-400 sm:text-sm">{description}</p>
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

/**
 * Cabecera de sección (Listas oficiales, Popular esta semana…): rótulo
 * de marquesina en dorado con una barra a la izquierda y una línea que
 * cierra la fila, para que no se confunda con el título de una lista.
 */
function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="h-6 w-1 shrink-0 rounded-full bg-gradient-to-b from-amber-300 to-red-600" />
      <h2 className="marquee-font shrink-0 text-xl leading-none text-amber-200 sm:text-2xl">
        {title}
      </h2>
      {count !== undefined && (
        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-zinc-300">
          {count}
        </span>
      )}
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
    </div>
  );
}
