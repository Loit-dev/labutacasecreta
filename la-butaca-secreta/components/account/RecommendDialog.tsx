"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { useDialog } from "@/hooks/useDialog";
import type { SearchHit } from "@/lib/search";
import { sendRecommendation } from "@/lib/supabase/recommendations";

type Props = {
  fromUserId: string;
  toUserId: string;
  toName: string;
  onClose: () => void;
};

const DEBOUNCE_MS = 350;

export default function RecommendDialog({
  fromUserId,
  toUserId,
  toName,
  onClose,
}: Props) {
  const dialogRef = useDialog<HTMLDivElement>(onClose);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [picked, setPicked] = useState<SearchHit | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const skipNext = useRef(false);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }

    const trimmed = query.trim();

    if (trimmed.length < 3) {
      setHits([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (!response.ok) return;
        const data: SearchHit[] = await response.json();
        if (!cancelled) setHits(data);
      } catch {
        // Sin conexión o la API falló: se queda sin resultados, sin romper el diálogo.
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function pick(hit: SearchHit) {
    setPicked(hit);
    skipNext.current = true;
    setQuery(hit.title);
    setHits([]);
  }

  async function handleSend() {
    if (!picked) return;

    setSending(true);

    const ok = await sendRecommendation({
      fromUserId,
      toUserId,
      tmdbId: picked.id,
      mediaType: picked.type,
      title: picked.title,
      posterUrl: picked.poster,
      message: message.trim() || undefined,
    });

    setSending(false);

    if (ok) setSent(true);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recomendar-title"
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full max-w-md flex-col gap-4 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="recomendar-title" className="text-lg font-bold text-white">
            Recomendar a {toName}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/70 text-white"
          >
            ✕
          </button>
        </div>

        {sent ? (
          <p className="rounded-2xl bg-amber-300/10 px-4 py-6 text-center text-sm text-amber-200">
            Enviado. {toName} lo verá en sus notificaciones.
          </p>
        ) : (
          <>
            <input
              value={query}
              onChange={(event) => {
                setPicked(null);
                setQuery(event.target.value);
              }}
              placeholder="Busca una película o serie"
              autoFocus
              className="rounded-2xl border border-white/20 bg-black/25 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500"
            />

            {hits.length > 0 && (
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                {hits.map((hit) => (
                  <button
                    key={`${hit.type}-${hit.id}`}
                    onClick={() => pick(hit)}
                    className="flex items-center gap-2.5 rounded-xl p-1.5 text-left hover:bg-white/5"
                  >
                    <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded bg-zinc-800">
                      {hit.poster && (
                        <Image src={hit.poster} alt="" fill className="object-cover" />
                      )}
                    </div>
                    <span className="truncate text-sm text-white">
                      {hit.title} {hit.year ? `(${hit.year})` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {picked && (
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Mensaje opcional"
                rows={2}
                maxLength={200}
                className="rounded-2xl border border-white/20 bg-black/25 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500"
              />
            )}

            <button
              onClick={handleSend}
              disabled={!picked || sending}
              className="self-center rounded-full bg-amber-300 px-6 py-2.5 text-sm font-extrabold text-black disabled:opacity-40"
            >
              {sending ? "Enviando…" : "Enviar"}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
