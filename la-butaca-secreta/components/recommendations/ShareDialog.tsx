"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useDialog } from "@/hooks/useDialog";
import { track } from "@/lib/analytics";
import { formatNames } from "@/lib/group";
import {
  SHARE_FILE_NAME,
  buildShareText,
  type ShareItem,
  type ShareKind,
} from "@/lib/share";
import { createShareImage } from "@/lib/shareImage";
import { buildShareCode, shareUrl } from "@/lib/shareLink";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type Props = {
  items: ShareItem[];
  kind: ShareKind;
  // Quiénes han elegido y cuánto han coincidido (modo acompañado)
  group?: { names: string[]; percent: number };
  onClose: () => void;
};

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; file: File; url: string };

// Tipografía de la web (la expone next/font como variable CSS)
function siteFont() {
  try {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--font-manrope")
      .trim();
  } catch {
    return "";
  }
}

export default function ShareDialog({
  items,
  kind,
  group,
  onClose,
}: Props) {
  const audience = group ? formatNames(group.names) : undefined;
  const percent = group?.percent;

  const dialogRef = useDialog<HTMLDivElement>(onClose);

  const [state, setState] = useState<State>({
    status: "loading",
  });

  const [message, setMessage] = useState("");

  // Enlace que abre exactamente estas recomendaciones (si hay ids)
  const [link, setLink] = useState("");

  useEffect(() => {
    const entries = items
      .filter((item) => item.id)
      .map((item) => ({
        id: item.id as number,
        role: item.role === "surprise" ? ("surprise" as const) : ("main" as const),
      }));

    if (entries.length === items.length && entries.length > 0) {
      setLink(
        shareUrl(
          window.location.origin,
          buildShareCode(kind, entries, group)
        )
      );
    }
  }, [items, kind, group]);

  // Crea la imagen al abrirse
  useEffect(() => {
    let cancelled = false;

    let objectUrl = "";

    createShareImage(items, {
      kind,
      siteName: SITE_NAME,
      siteUrl: SITE_URL,
      fontFamily: siteFont(),
      audience,
      compatibility: percent,
    })
      .then((blob) => {
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);

        setState({
          status: "ready",
          url: objectUrl,
          file: new File([blob], SHARE_FILE_NAME, {
            type: "image/png",
          }),
        });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;

      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [items, kind, audience, percent]);

  const file =
    state.status === "ready" ? state.file : null;

  const text = buildShareText(
    items.map((item) => item.title),
    kind,
    link || SITE_URL,
    audience,
    percent
  );

  const canShare =
    !!file &&
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  async function share() {
    if (!file) return;

    try {
      await navigator.share({
        files: [file],
        title: `${SITE_NAME} · ${
          audience ? `Sugerencias para ${audience}` : "Mis sugerencias"
        }`,
        text,
      });

      track("share_done", { method: "native", type: kind });
    } catch (error) {
      // Cerrar el menú de compartir sin elegir nada no es un error
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      setMessage(
        "No he podido abrir el menú de compartir. Descarga la imagen y envíala tú."
      );
    }
  }

  async function copyLink() {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);

      setMessage("Enlace copiado. Pégalo donde quieras.");

      track("share_link_copy", { type: kind });
    } catch {
      setMessage(
        "No he podido copiarlo solo: selecciona el enlace y cópialo."
      );
    }
  }

  function download() {
    if (state.status !== "ready") return;

    const link = document.createElement("a");

    link.href = state.url;
    link.download = SHARE_FILE_NAME;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setMessage("Imagen descargada. Ya puedes enviarla o subirla.");

    track("share_done", { method: "download", type: kind });
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
        aria-labelledby="share-title"
        tabIndex={-1}
        className="relative flex max-h-[96dvh] w-full max-w-md flex-col gap-4 overflow-y-auto overscroll-contain rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="share-title"
            className="text-lg font-bold text-white"
          >
            Comparte tus sugerencias
          </h2>

          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div
          className="flex min-h-48 items-center justify-center overflow-hidden rounded-2xl bg-black"
          aria-live="polite"
        >
          {state.status === "loading" && (
            <p className="px-4 text-center text-sm text-zinc-300">
              Preparando tu imagen…
            </p>
          )}

          {state.status === "error" && (
            <p
              role="alert"
              className="px-4 text-center text-sm text-red-300"
            >
              No he podido crear la imagen. Inténtalo de
              nuevo en unos segundos.
            </p>
          )}

          {state.status === "ready" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.url}
              alt={`Imagen con tus sugerencias: ${items
                .map((item) => item.title)
                .join(", ")}`}
              className="max-h-[55dvh] w-auto max-w-full"
            />
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {canShare && (
            <button
              onClick={share}
              className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Compartir…
            </button>
          )}

          <button
            onClick={download}
            disabled={state.status !== "ready"}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50 ${
              canShare
                ? "border border-zinc-600 hover:bg-zinc-800"
                : "bg-red-600 hover:bg-red-500"
            }`}
          >
            Descargar imagen
          </button>
        </div>

        {link && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={link}
              aria-label="Enlace para compartir estas recomendaciones"
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-black/40 px-3 py-2.5 text-xs text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            />

            <button
              onClick={copyLink}
              className="rounded-xl border border-zinc-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Copiar enlace
            </button>
          </div>
        )}

        <p
          role="status"
          className="min-h-4 text-center text-xs text-zinc-300"
        >
          {message}
        </p>
      </div>
    </div>,
    document.body
  );
}
