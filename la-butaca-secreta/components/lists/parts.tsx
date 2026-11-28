"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { HeartIcon } from "@/components/icons/Icons";
import {
  canOptimize,
  stripPosters,
  timeAgo,
  type LikeState,
  type Poster,
} from "@/lib/lists/shared";
import {
  addListComment,
  deleteListComment,
  fetchListComments,
  type ListComment,
} from "@/lib/supabase/listsFeed";
import { loginHref } from "@/lib/returnTo";

// Piezas compartidas por la pestaña Listas (ListsFeed) y la página de
// cada lista (ListPage).

export function AuthorBadge({
  author,
  official,
}: {
  author: string;
  official?: boolean;
}) {
  if (official) {
    return (
      <span className="shrink-0 rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
        {author}
      </span>
    );
  }

  return (
    <span className="shrink-0 pt-0.5 text-xs font-semibold text-zinc-400 sm:text-sm">
      {author}
    </span>
  );
}

export function PosterImage({
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

/** Tira de pósters de una tarjeta: solo los que hay, a 1/7 del ancho. */
export function PosterStrip({ posters }: { posters: Pick<Poster, "key" | "poster">[] }) {
  const strip = stripPosters(posters);

  if (strip.length === 0) return null;

  return (
    <div className="mt-3 flex">
      {strip.map((item) => (
        <div
          key={item.key}
          className="relative aspect-[2/3] w-[14.2857%] shrink-0 overflow-hidden border border-white/15 bg-zinc-800 first:rounded-l-lg last:rounded-r-lg"
        >
          <PosterImage
            src={item.poster as string}
            alt=""
            sizes="(min-width: 896px) 128px, 15vw"
          />
        </div>
      ))}
    </div>
  );
}

/** Cuadrícula numerada de la página de una lista. */
export function PosterGrid({ posters }: { posters: Poster[] }) {
  return (
    <ol className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-5">
      {posters.map((item, index) => {
        const inner = (
          <>
            <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-white/15 bg-zinc-800">
              {canOptimize(item.poster) ? (
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
          <li
            key={item.key}
            className="relative"
            title={item.note ? `${item.title} · ${item.note}` : item.title}
          >
            {item.href ? (
              <a
                href={item.href}
                className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {inner}
              </a>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function LikeButton({
  like,
  canLike,
  onToggle,
  compact,
}: {
  like: LikeState;
  canLike: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const size = compact ? "mt-2 px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  const count = `${like.count} me gusta`;

  if (!canLike) {
    return (
      <a
        href={loginHref(pathname)}
        title="Entra para darle me gusta"
        className={`flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-black/20 font-semibold text-zinc-300 hover:bg-white/5 ${size}`}
      >
        <HeartIcon size={compact ? 14 : 16} />
        {count}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={like.liked}
      aria-label={`${like.liked ? "Quitar me gusta" : "Me gusta"} (${count})`}
      className={`flex w-fit items-center gap-1.5 rounded-full border font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${size} ${
        like.liked
          ? "border-red-400/60 bg-red-500/15 text-red-300"
          : "border-white/15 bg-black/20 text-zinc-200 hover:bg-white/5"
      }`}
    >
      <HeartIcon size={compact ? 14 : 16} filled={like.liked} />
      {count}
    </button>
  );
}

export function ListComments({
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
  const pathname = usePathname();
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
          href={loginHref(pathname)}
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
                    <a
                      href={`/u/${comment.username}`}
                      className="hover:text-white hover:underline"
                    >
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
