"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { HeartIcon } from "@/components/icons/Icons";
import { useAuth } from "@/hooks/useAuth";
import type { CanonResult } from "@/lib/canon";
import {
  addListComment,
  deleteListComment,
  fetchListComments,
  fetchPopularLists,
  fetchPublicListItems,
  fetchTopTitles,
  setListLike,
  type ListComment,
  type PopularList,
  type PublicListItem,
  type TopTitle,
} from "@/lib/supabase/listsFeed";

/**
 * Pestaña "Listas" de la portada, al estilo de Letterboxd: listas
 * oficiales (Top de La Butaca por nota media de la comunidad y El
 * Canon) y las listas públicas de los usuarios con más "me gusta" de
 * la semana. Ver supabase/listas_populares.sql.
 */

// Con menos títulos votados el ranking no dice nada todavía: se oculta
// y queda El Canon como lista oficial.
const TOP_MIN_TITLES = 10;

type Poster = {
  key: string;
  title: string;
  poster: string | null;
  href: string | null;
  note?: string;
};

type Detail = {
  // Clave para los comentarios: id de la lista, o "canon" / "top".
  key: string;
  title: string;
  author: string;
  official: boolean;
  description?: string;
  list?: PopularList;
  posters: Poster[] | null;
};

function titleHref(mediaType: "movie" | "tv", tmdbId: number | null) {
  if (!tmdbId) return null;

  return mediaType === "tv" ? `/serie/${tmdbId}` : `/pelicula/${tmdbId}`;
}

function fromTop(items: TopTitle[]): Poster[] {
  return items.map((item) => ({
    key: `${item.mediaType}-${item.tmdbId}`,
    title: item.title,
    poster: item.posterUrl,
    href: titleHref(item.mediaType, item.tmdbId),
    note: `★ ${item.avgRating.toFixed(1)} · ${item.votes} votos`,
  }));
}

function fromCanon(items: CanonResult[]): Poster[] {
  return items.map((item, index) => ({
    key: `canon-${item.tmdbId ?? index}`,
    title: item.title,
    poster: item.poster,
    href: titleHref("movie", item.tmdbId),
    note: `${item.director} · ${item.year}`,
  }));
}

function fromListItems(items: PublicListItem[]): Poster[] {
  return items.map((item) => ({
    key: `${item.mediaType}-${item.tmdbId}`,
    title: item.title,
    poster: item.posterUrl,
    href: titleHref(item.mediaType, item.tmdbId),
  }));
}

export default function ListsFeed() {
  const { session } = useAuth();

  const [top, setTop] = useState<TopTitle[] | null>(null);
  const [canon, setCanon] = useState<CanonResult[] | null>(null);
  const [lists, setLists] = useState<PopularList[] | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchTopTitles().then((rows) => {
      if (!cancelled) setTop(rows);
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

  // Se vuelve a pedir al cambiar de sesión para que "me gusta" refleje
  // lo de la persona que ha entrado.
  const userId = session?.user.id ?? null;

  useEffect(() => {
    let cancelled = false;

    fetchPopularLists().then((rows) => {
      if (!cancelled) setLists(rows);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function openUserList(list: PopularList) {
    setDetail({
      key: list.id,
      title: list.name,
      author: list.username ? `@${list.username}` : "Anónimo",
      official: false,
      list,
      posters: null,
    });

    const items = await fetchPublicListItems(list.id);

    setDetail((current) =>
      current?.list?.id === list.id
        ? { ...current, posters: fromListItems(items) }
        : current
    );
  }

  async function toggleLike(list: PopularList) {
    if (!userId) return;

    const liked = !list.likedByMe;
    const delta = liked ? 1 : -1;
    const updated: PopularList = {
      ...list,
      likedByMe: liked,
      likesRecent: Math.max(0, list.likesRecent + delta),
      likesTotal: Math.max(0, list.likesTotal + delta),
    };

    const apply = (next: PopularList) => {
      setLists((current) =>
        current?.map((row) => (row.id === next.id ? next : row)) ?? current
      );
      setDetail((current) =>
        current?.list?.id === next.id ? { ...current, list: next } : current
      );
    };

    apply(updated);

    const ok = await setListLike(userId, list.id, liked);

    if (!ok) apply(list);
  }

  const showTop = (top?.length ?? 0) >= TOP_MIN_TITLES;

  if (detail) {
    return (
      <ListDetail
        detail={detail}
        canLike={Boolean(userId)}
        userId={userId}
        onBack={() => setDetail(null)}
        onToggleLike={toggleLike}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="marquee-font text-2xl text-white sm:text-3xl">
        Popular esta semana
      </h2>

      {showTop && top && (
        <ListCard
          title="Top de La Butaca"
          author="Oficial"
          official
          posters={fromTop(top)}
          description={`Las ${top.length} películas y series mejor valoradas por la comunidad de La Butaca Secreta, ordenadas por nota media (mínimo 3 votos).`}
          onOpen={() =>
            setDetail({
              key: "top",
              title: "Top de La Butaca",
              author: "Oficial",
              official: true,
              description:
                "Ordenadas por nota media de quienes las han visto en La Butaca Secreta. Se usa una media ponderada para que un título con muy pocos votos no salga arriba del todo.",
              posters: fromTop(top),
            })
          }
        />
      )}

      <ListCard
        title="El Canon"
        author="Oficial"
        official
        posters={canon ? fromCanon(canon) : null}
        description="250 películas imprescindibles de la historia del cine, de los años 20 a hoy."
        onOpen={() =>
          setDetail({
            key: "canon",
            title: "El Canon",
            author: "Oficial",
            official: true,
            description:
              "250 películas imprescindibles de la historia del cine. Lleva tu progreso en Mi cuenta → El Canon.",
            posters: canon ? fromCanon(canon) : null,
          })
        }
      />

      {lists === null ? (
        <p className="text-sm text-zinc-400">Cargando listas…</p>
      ) : lists.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-6 text-center text-sm text-zinc-300">
          Aún no hay listas públicas de la comunidad. Haz pública una de
          tus listas en{" "}
          <a href="/mi-cuenta" className="text-amber-300 underline-offset-2 hover:underline">
            Mi cuenta → Listas
          </a>{" "}
          y aparecerá aquí.
        </p>
      ) : (
        lists.map((list) => (
          <ListCard
            key={list.id}
            title={list.name}
            author={list.username ? `@${list.username}` : "Anónimo"}
            posters={list.posters.map((poster, index) => ({
              key: `${list.id}-${index}`,
              title: "",
              poster,
              href: null,
            }))}
            description={`${list.itemsCount} ${list.itemsCount === 1 ? "título" : "títulos"}`}
            likes={list.likesTotal}
            likedByMe={list.likedByMe}
            onOpen={() => openUserList(list)}
          />
        ))
      )}
    </div>
  );
}

function AuthorBadge({ author, official }: { author: string; official?: boolean }) {
  return (
    <span
      className={`shrink-0 text-sm font-semibold ${
        official ? "text-amber-300" : "text-zinc-400"
      }`}
    >
      {author}
    </span>
  );
}

function ListCard({
  title,
  author,
  official,
  posters,
  description,
  likes,
  likedByMe,
  onOpen,
}: {
  title: string;
  author: string;
  official?: boolean;
  posters: Poster[] | null;
  description?: string;
  likes?: number;
  likedByMe?: boolean;
  onOpen: () => void;
}) {
  const strip = (posters ?? []).slice(0, 7);

  return (
    <article className="border-b border-white/10 pb-6 last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-snug text-zinc-100 group-hover:text-white sm:text-xl">
            {title}
          </h3>
          <AuthorBadge author={author} official={official} />
        </div>

        <div className="mt-3 flex overflow-hidden rounded-lg border border-white/15 bg-zinc-900">
          {Array.from({ length: 7 }).map((_, index) => {
            const item = strip[index];

            return (
              <div
                key={item?.key ?? `empty-${index}`}
                className="relative aspect-[2/3] w-[14.2857%] shrink-0 border-r border-black/40 bg-zinc-800 last:border-r-0"
              >
                {item?.poster && (
                  <PosterImage src={item.poster} alt="" sizes="(min-width: 896px) 128px, 15vw" />
                )}
              </div>
            );
          })}
        </div>

        {description && (
          <p className="mt-3 text-sm text-zinc-400">{description}</p>
        )}
      </button>

      {likes !== undefined && (
        <p
          className={`mt-2 flex items-center gap-1.5 text-xs ${
            likedByMe ? "text-red-400" : "text-zinc-500"
          }`}
        >
          <HeartIcon size={14} />
          {likes} me gusta
        </p>
      )}
    </article>
  );
}

function ListDetail({
  detail,
  canLike,
  userId,
  onBack,
  onToggleLike,
}: {
  detail: Detail;
  canLike: boolean;
  userId: string | null;
  onBack: () => void;
  onToggleLike: (list: PopularList) => void;
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const list = detail.list;
  const [section, setSection] = useState<"titles" | "comments">("titles");
  const [commentCount, setCommentCount] = useState<number | null>(null);

  // El número de comentarios se ve en la pestaña desde el principio.
  useEffect(() => {
    let cancelled = false;

    fetchListComments(detail.key).then((rows) => {
      if (!cancelled && rows) setCommentCount(rows.length);
    });

    return () => {
      cancelled = true;
    };
  }, [detail.key]);

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-2 text-sm text-zinc-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span aria-hidden="true">←</span> Volver a Listas
      </button>

      <div>
        <p className="text-sm">
          <AuthorBadge author={detail.author} official={detail.official} />
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          {detail.title}
        </h2>
        {detail.description && (
          <p className="mt-2 text-sm text-zinc-400">{detail.description}</p>
        )}
      </div>

      {list && (
        <div className="flex items-center gap-3 text-sm">
          {canLike ? (
            <button
              type="button"
              onClick={() => onToggleLike(list)}
              aria-pressed={list.likedByMe}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                list.likedByMe
                  ? "border-red-400/60 bg-red-500/15 text-red-300"
                  : "border-white/15 bg-black/20 text-zinc-200 hover:bg-white/5"
              }`}
            >
              <HeartIcon size={16} />
              {list.likedByMe ? "Te gusta" : "¿Te gusta?"}
            </button>
          ) : (
            <a
              href="/entrar"
              className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 font-semibold text-zinc-200 hover:bg-white/5"
            >
              <HeartIcon size={16} />
              Entra para darle me gusta
            </a>
          )}
          <span className="text-zinc-400">
            {list.likesTotal} me gusta
          </span>
        </div>
      )}

      <div role="tablist" aria-label="Contenido de la lista" className="flex border-b border-white/10">
        {(
          [
            ["titles", "Títulos"],
            ["comments", commentCount === null ? "Comentarios" : `${commentCount} ${commentCount === 1 ? "comentario" : "comentarios"}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={section === id}
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

      {section === "comments" ? (
        <ListComments
          listKey={detail.key}
          userId={userId}
          onCount={setCommentCount}
        />
      ) : detail.posters === null ? (
        <p className="text-sm text-zinc-400">Cargando…</p>
      ) : detail.posters.length === 0 ? (
        <p className="text-sm text-zinc-400">Esta lista está vacía.</p>
      ) : (
        <ol className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-5">
          {detail.posters.map((item, index) => {
            const inner = (
              <>
                <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-white/15 bg-zinc-800">
                  {item.poster && canOptimize(item.poster) ? (
                    <PosterImage
                      src={item.poster}
                      alt={item.title}
                      sizes="(min-width: 768px) 160px, 33vw"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-xs text-zinc-400">
                      {item.title}
                    </span>
                  )}
                </div>
                <span className="absolute -bottom-3 left-1/2 flex h-7 min-w-7 -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-zinc-900 px-1.5 text-xs font-semibold text-zinc-200">
                  {index + 1}
                </span>
              </>
            );

            return (
              <li key={item.key} className="relative" title={item.note ? `${item.title} · ${item.note}` : item.title}>
                {item.href ? (
                  <a href={item.href} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// next/image sirve los pósters desde nuestro propio dominio
// (/_next/image): la CSP (next.config.ts) solo deja cargar imágenes de
// 'self', así que un <img> directo a image.tmdb.org sale roto.
function canOptimize(src: string) {
  return src.startsWith("/") || src.startsWith("https://image.tmdb.org/");
}

function PosterImage({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  if (!canOptimize(src)) return null;

  return <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
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

function ListComments({
  listKey,
  userId,
  onCount,
}: {
  listKey: string;
  userId: string | null;
  onCount: (count: number) => void;
}) {
  // undefined = cargando; null = comentarios aún no disponibles.
  const [comments, setComments] = useState<ListComment[] | null | undefined>(
    undefined
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const rows = await fetchListComments(listKey);

    setComments(rows);
    if (rows) onCount(rows.length);
  }

  useEffect(() => {
    let cancelled = false;

    fetchListComments(listKey).then((rows) => {
      if (cancelled) return;
      setComments(rows);
      if (rows) onCount(rows.length);
    });

    return () => {
      cancelled = true;
    };
  }, [listKey, onCount]);

  async function send() {
    const body = draft.trim();

    if (!userId || !body || sending) return;

    setSending(true);
    setError(null);

    const ok = await addListComment(userId, listKey, body);

    setSending(false);

    if (!ok) {
      setError("No se ha podido publicar el comentario. Prueba otra vez.");
      return;
    }

    setDraft("");
    await reload();
  }

  async function remove(comment: ListComment) {
    if (!window.confirm("¿Borrar este comentario?")) return;

    const ok = await deleteListComment(comment.id);

    if (ok) await reload();
  }

  if (comments === undefined) {
    return <p className="text-sm text-zinc-400">Cargando comentarios…</p>;
  }

  if (comments === null) {
    return (
      <p className="text-sm text-zinc-400">
        Los comentarios no están disponibles todavía.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {userId ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="flex flex-col gap-2"
        >
          <label htmlFor={`comentario-${listKey}`} className="sr-only">
            Escribe un comentario
          </label>
          <textarea
            id={`comentario-${listKey}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="¿Qué te parece esta lista?"
            className="w-full resize-y rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-amber-300/60 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-500">{draft.length}/1000</span>
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {sending ? "Publicando…" : "Comentar"}
            </button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      ) : (
        <a
          href="/entrar"
          className="w-fit rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/5"
        >
          Entra para comentar
        </a>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-zinc-400">
          Todavía no hay comentarios. ¡Sé el primero!
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/10">
          {comments.map((comment) => (
            <li key={comment.id} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-200">
                  {comment.username ? (
                    <a href={`/u/${comment.username}`} className="hover:text-white hover:underline">
                      @{comment.username}
                    </a>
                  ) : (
                    "Anónimo"
                  )}
                  <span className="ml-2 text-xs font-normal text-zinc-500">
                    {timeAgo(comment.createdAt)}
                  </span>
                </p>
                {comment.canDelete && (
                  <button
                    type="button"
                    onClick={() => remove(comment)}
                    className="text-xs text-zinc-500 hover:text-red-400"
                  >
                    Borrar
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-line break-words text-sm text-zinc-300">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
