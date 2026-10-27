"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { useDialog } from "@/hooks/useDialog";
import { track } from "@/lib/analytics";
import { createFollowInviteCode } from "@/lib/supabase/inviteCodes";
import { createProfileShareImage } from "@/lib/profileShareImage";
import { SITE_NAME } from "@/lib/site";

type Props = {
  userId: string;
  username: string;
  onClose: () => void;
};

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; file: File; url: string };

const FILE_NAME = "mi-perfil-la-butaca-secreta.png";

// Tipografía de la web (la expone next/font como variable CSS), igual
// que en ShareDialog.tsx / ShareSummaryDialog.tsx.
function siteFont() {
  try {
    return getComputedStyle(document.documentElement)
      .getPropertyValue("--font-manrope")
      .trim();
  } catch {
    return "";
  }
}

export default function ShareProfileDialog({ userId, username, onClose }: Props) {
  const dialogRef = useDialog<HTMLDivElement>(onClose);
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<State>({ status: "loading" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    (async () => {
      // El código de invitación hace que, si quien lo abre aún no tiene
      // cuenta, el "seguir" se resuelva solo justo después del registro.
      const code = await createFollowInviteCode(userId);

      if (cancelled) return;

      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}${code ? `/invitar/${code}` : `/u/${username}`}`;
      const displayUrl = url.replace(/^https?:\/\//, "");

      try {
        const qrDataUrl = await QRCode.toDataURL(url, {
          margin: 0,
          width: 1000,
          color: { dark: "#111111", light: "#ffffff" },
        });

        const blob = await createProfileShareImage({
          siteName: SITE_NAME,
          qrUrl: url,
          displayUrl,
          username,
          fontFamily: siteFont(),
          qrDataUrl,
        });

        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);

        setState({
          status: "ready",
          url: objectUrl,
          file: new File([blob], FILE_NAME, { type: "image/png" }),
        });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();

    return () => {
      cancelled = true;

      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, username]);

  const file = state.status === "ready" ? state.file : null;

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
        title: `${SITE_NAME} · @${username}`,
        text: `Sígueme en ${SITE_NAME}`,
      });

      track("share_done", { method: "native", screen: "profile" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setMessage(
        "No he podido abrir el menú de compartir. Descarga la imagen y envíala tú."
      );
    }
  }

  function download() {
    if (state.status !== "ready") return;

    const link = document.createElement("a");

    link.href = state.url;
    link.download = FILE_NAME;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setMessage("Imagen descargada. Ya puedes enviarla o subirla como story.");

    track("share_done", { method: "download", screen: "profile" });
  }

  async function handleCopyLink() {
    if (state.status !== "ready") return;

    // El enlace está incrustado en la imagen (vía QR); para copiarlo
    // como texto, lo reconstruimos igual que arriba.
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";

      await navigator.clipboard.writeText(`${origin}/u/${username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard bloqueado: no pasa nada, puede copiarlo a mano.
    }
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
        aria-labelledby="compartir-perfil-title"
        tabIndex={-1}
        className="relative flex max-h-[96dvh] w-full max-w-md flex-col gap-4 overflow-y-auto overscroll-contain rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="compartir-perfil-title" className="text-lg font-bold text-white">
            Compartir mi perfil
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
              Preparando tu código…
            </p>
          )}

          {state.status === "error" && (
            <p role="alert" className="px-4 text-center text-sm text-red-300">
              No he podido crear la imagen. Inténtalo de nuevo en unos
              segundos.
            </p>
          )}

          {state.status === "ready" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.url}
              alt={`Código QR para seguirme en ${SITE_NAME} como @${username}`}
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

        {canShare && (
          <p className="text-center text-[11px] text-zinc-500">
            "Compartir…" abre el menú del móvil: ahí puedes mandarla a
            Instagram (como story), WhatsApp o donde quieras.
          </p>
        )}

        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate text-left text-xs text-zinc-300">
            {typeof window !== "undefined"
              ? `${window.location.host}/u/${username}`
              : `/u/${username}`}
          </span>
          <button
            onClick={handleCopyLink}
            className="shrink-0 rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white"
          >
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>

        <p role="status" className="min-h-4 text-center text-xs text-zinc-300">
          {message}
        </p>
      </div>
    </div>,
    document.body
  );
}
