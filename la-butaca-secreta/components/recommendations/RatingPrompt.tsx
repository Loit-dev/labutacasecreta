"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { useAuth } from "@/hooks/useAuth";
import { useDialog } from "@/hooks/useDialog";
import { track } from "@/lib/analytics";
import { todayDateInput } from "@/lib/dateInput";
import type { Rating } from "@/lib/rating";
import { posterSource } from "@/lib/share";
import { recordShareEvent } from "@/lib/supabase/achievements";
import { SITE_NAME } from "@/lib/site";
import { createWatchedShareImage, pickSeenVerb } from "@/lib/watchedShareImage";

export type RatingPromptShareContext = {
  type: "movie" | "tv";
  tmdbId: number;
  posterUrl?: string;
  username?: string;
};

type Props = {
  title: string;
  /** Para editar una valoración ya puesta: empieza con esa nota marcada. */
  initial?: Rating;
  /** true cuando se abre para cambiar una nota ya puesta (diario), no al marcar como vista por primera vez. */
  editing?: boolean;
  /**
   * `seenAt` es la fecha elegida (YYYY-MM-DD, huso horario local), hoy
   * por defecto; se omite al editar una nota ya puesta, porque ahí no
   * se toca la fecha (ver lib/supabase/watched.ts). Se llama como
   * mucho una vez por apertura del diálogo, sea cual sea la acción
   * que lo dispare (guardar, compartir, descargar...).
   */
  onConfirm: (rating: Rating | undefined, seenAt?: string) => void;
  /** Cierra y desmonta el diálogo (botón "Guardar", la X, Escape o click fuera). */
  onClose: () => void;
  /**
   * Datos para generar y ofrecer la imagen de "ya la he visto" en el
   * mismo diálogo, justo debajo del botón de guardar — sin un paso
   * aparte. Se omite al editar (editing=true), donde no aplica.
   */
  share?: RatingPromptShareContext;
};

/**
 * "¿Qué te pareció?" al marcar "Ya la vi", con el paso de compartir
 * (imagen + botones) integrado debajo del botón de guardar en el
 * mismo diálogo — antes era un segundo diálogo aparte que se abría
 * siempre, incluso sin querer compartir nada. Guardar la valoración
 * ocurre una sola vez, la dispare lo que la dispare: el botón
 * "Guardar valoración", cualquier botón de compartir/descargar, o
 * cerrar el diálogo sin más.
 */
// Icono de estrella (Material Symbols), en un viewBox cuadrado para
// poder recortarlo con precisión a la mitad exacta con un clipPath.
const STAR_PATH =
  "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

const FILE_NAME = "ya-la-he-visto-la-butaca-secreta.png";

// Tipografía de la web (la expone next/font como variable CSS), igual
// que en ShareDialog.tsx / ShareProfileDialog.tsx.
function siteFont() {
  try {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--font-manrope")
      .trim();
  } catch {
    return "";
  }
}

type ImageState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; file: File; url: string };

export default function RatingPrompt({
  title,
  initial,
  editing = false,
  onConfirm,
  onClose,
  share,
}: Props) {
  const { session } = useAuth();
  const [selected, setSelected] = useState<Rating | null>(initial ?? null);

  const [seenAt, setSeenAt] = useState(todayDateInput);
  const [confirmed, setConfirmed] = useState(false);

  const [copied, setCopied] = useState(false);
  const [imageState, setImageState] = useState<ImageState>({ status: "loading" });
  const [shareMessage, setShareMessage] = useState("");

  const uid = useId();

  const showShare = !editing && !!share;

  // Guarda la valoración exactamente una vez por apertura del diálogo,
  // la dispare la acción que la dispare.
  const ensureConfirmed = useCallback(() => {
    if (confirmed) return;

    setConfirmed(true);
    onConfirm(selected ?? undefined, editing ? undefined : seenAt);
  }, [confirmed, onConfirm, selected, editing, seenAt]);

  const finish = useCallback(() => {
    ensureConfirmed();
    onClose();
  }, [ensureConfirmed, onClose]);

  const dialogRef = useDialog<HTMLDivElement>(finish);

  function recordShare() {
    if (session) recordShareEvent(session.user.id, "watched");
  }

  const seenVerb = useMemo(() => pickSeenVerb(selected ?? undefined), [selected]);

  const link =
    showShare && share && typeof window !== "undefined"
      ? `${window.location.origin}/${share.type === "tv" ? "serie" : "pelicula"}/${share.tmdbId}`
      : "";

  // "4 de noviembre de 2026", a partir de YYYY-MM-DD (mediodía local,
  // como en lib/dateInput.ts, para que no se desplace de día).
  const seenAtLabel = (() => {
    const [year, month, day] = seenAt.split("-").map(Number);

    if (!year || !month || !day) return "";

    return new Date(year, month - 1, day, 12, 0, 0).toLocaleDateString(
      "es-ES",
      { day: "numeric", month: "long", year: "numeric" }
    );
  })();

  useEffect(() => {
    if (!showShare || !share) return;

    let cancelled = false;
    let objectUrl = "";

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageState({ status: "loading" });

    createWatchedShareImage({
      siteName: SITE_NAME,
      siteUrl: typeof window !== "undefined" ? window.location.origin : "",
      fontFamily: siteFont(),
      title,
      kind: share.type,
      rating: selected ?? undefined,
      username: share.username,
      seenAtLabel,
      seenVerb,
      // Los pósters de TMDb se piden a través de nuestro servidor (ver
      // lib/share.ts) para que el navegador pueda dibujarlos en un
      // canvas sin que CORS lo bloquee.
      posterUrl: posterSource(share.posterUrl),
    })
      .then((blob) => {
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);

        setImageState({
          status: "ready",
          url: objectUrl,
          file: new File([blob], FILE_NAME, { type: "image/png" }),
        });
      })
      .catch(() => {
        if (!cancelled) setImageState({ status: "error" });
      });

    return () => {
      cancelled = true;

      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showShare, share?.type, share?.tmdbId, share?.username, share?.posterUrl, title, selected, seenAtLabel, seenVerb]);

  const file = imageState.status === "ready" ? imageState.file : null;

  const shareText = `He visto ${title}${
    selected ? ` y le pongo ${String(selected).replace(".", ",")} ★` : ""
  }. ¿Tú qué le pondrías?${link ? ` ${link}` : ""}`;

  const canNativeShare =
    !!file &&
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  async function nativeShare() {
    if (!file || !share) return;

    ensureConfirmed();

    try {
      await navigator.share({
        files: [file],
        title: `${SITE_NAME} · ${title}`,
        text: shareText,
      });

      track("share_done", { method: "native", screen: "watched", type: share.type });
      recordShare();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setShareMessage(
        "No he podido abrir el menú de compartir. Descarga la imagen y envíala tú."
      );
    }
  }

  function downloadImage() {
    if (imageState.status !== "ready" || !share) return;

    ensureConfirmed();

    const anchor = document.createElement("a");

    anchor.href = imageState.url;
    anchor.download = FILE_NAME;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setShareMessage("Imagen descargada. Ya puedes enviarla o subirla como story.");

    track("share_done", { method: "download", screen: "watched", type: share.type });
    recordShare();
  }

  async function copyLink() {
    if (!link) return;

    ensureConfirmed();

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      track("share_link_copy", { screen: "watched", type: share?.type });
    } catch {
      // Clipboard bloqueado: no pasa nada, puede copiarlo a mano.
    }
  }

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={finish}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Valorar ${title}`}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[96dvh] w-full max-w-sm overflow-y-auto overscroll-contain rounded-2xl border border-zinc-700/80 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 px-6 py-6 text-center shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
      >
        {showShare && (
          <button
            type="button"
            onClick={finish}
            aria-label="Cerrar"
            className="float-right -mr-2 -mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}

        <p className="marquee-font text-xl text-white">
          ¿Qué te pareció <span className="text-zinc-300">{title}</span>?
        </p>

        <div
          role="radiogroup"
          aria-label="Valoración de 1 a 5 estrellas, con medias estrellas"
          className="mt-4 flex justify-center gap-1"
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const fill = Math.max(0, Math.min(1, (selected ?? 0) - (star - 1)));
            // La primera estrella no admite "media", el mínimo es 1.
            const halfValue = (star === 1 ? 1 : star - 0.5) as Rating;
            const clipId = `${uid}-star-${star}`;

            return (
              <div
                key={star}
                className="relative inline-block h-10 w-10 select-none sm:h-11 sm:w-11"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full"
                >
                  <path d={STAR_PATH} fill="#52525b" />

                  {fill > 0 && (
                    <>
                      <clipPath id={clipId}>
                        <rect x="0" y="0" width={fill * 24} height="24" />
                      </clipPath>
                      <path
                        d={STAR_PATH}
                        fill="#facc15"
                        clipPath={`url(#${clipId})`}
                      />
                    </>
                  )}
                </svg>

                <button
                  type="button"
                  role="radio"
                  aria-checked={selected === halfValue}
                  aria-label={`${halfValue} estrella${halfValue !== 1 ? "s" : ""}`}
                  onClick={() => setSelected(halfValue)}
                  className="absolute inset-y-0 left-0 w-1/2 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                />
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected === star}
                  aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
                  onClick={() => setSelected(star as Rating)}
                  className="absolute inset-y-0 right-0 w-1/2 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                />
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Toca la mitad izquierda de una estrella para media estrella.
          {editing
            ? " Deja todas las estrellas vacías para quitar la nota."
            : " Puedes marcarla como vista sin puntuar."}
        </p>

        {!editing && (
          <label className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-300">
            ¿Cuándo la viste?
            <input
              type="date"
              value={seenAt}
              max={todayDateInput()}
              onChange={(event) => setSeenAt(event.target.value)}
              className="rounded-lg border border-zinc-700/80 bg-black/40 px-2 py-1 text-white [color-scheme:dark] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            />
          </label>
        )}

        <button
          type="button"
          onClick={finish}
          className="marquee-font mt-4 w-full rounded-2xl bg-white px-5 py-3 text-base text-black transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {editing ? "Guardar" : selected ? "Guardar valoración" : "Marcar como vista"}
        </button>

        {showShare && (
          <div className="mt-5 flex flex-col gap-3 border-t border-dashed border-white/10 pt-5 text-left">
            <p className="text-center text-sm font-bold text-white">
              Compartir que la he visto
            </p>

            <div
              className="relative h-24 w-full overflow-hidden rounded-2xl bg-black"
              aria-live="polite"
            >
              {imageState.status === "loading" && (
                <p className="flex h-full items-center justify-center px-4 text-center text-sm text-zinc-300">
                  Preparando tu imagen…
                </p>
              )}

              {imageState.status === "error" && (
                <p
                  role="alert"
                  className="flex h-full items-center justify-center px-4 text-center text-sm text-red-300"
                >
                  No he podido crear la imagen. Inténtalo de nuevo en unos
                  segundos.
                </p>
              )}

              {imageState.status === "ready" && (
                // Vista previa recortada a propósito (arriba y abajo): la
                // imagen real es vertical (9:16) y completa, solo esta
                // miniatura se enseña como una franja ancha para que el
                // diálogo entero quepa sin scroll, sobre todo en móvil.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageState.url}
                  alt={`Imagen de que has visto ${title}`}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {canNativeShare && (
                <button
                  type="button"
                  onClick={nativeShare}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Compartir…
                </button>
              )}

              <button
                type="button"
                onClick={downloadImage}
                disabled={imageState.status !== "ready"}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  canNativeShare
                    ? "border border-zinc-600 hover:bg-zinc-800"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                Descargar imagen
              </button>
            </div>

            {canNativeShare && (
              <p className="text-center text-[11px] text-zinc-500">
                &quot;Compartir…&quot; abre el menú del móvil con la imagen adjunta: ahí
                puedes mandarla a Instagram (como story), WhatsApp o donde
                quieras.
              </p>
            )}

            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                ensureConfirmed();
                track("share_done", { method: "whatsapp_link", screen: "watched", type: share?.type });
                recordShare();
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Enviar enlace por WhatsApp (sin imagen)
            </a>
            <p className="text-center text-[11px] text-zinc-500">
              WhatsApp no deja adjuntar imágenes desde un enlace directo: esto
              manda solo el texto con el enlace. Para mandar también la
              imagen, usa &quot;Compartir…&quot; y elige WhatsApp ahí.
            </p>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-left text-xs text-zinc-300">
                {link ? link.replace(/^https?:\/\//, "") : "Preparando enlace…"}
              </span>
              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white"
              >
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>

            <p role="status" className="min-h-4 text-center text-xs text-zinc-300">
              {shareMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
