"use client";

import { createPortal } from "react-dom";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { useDialog } from "@/hooks/useDialog";

type Props = {
  username: string;
  onClose: () => void;
};

export default function ShareProfileDialog({ username, onClose }: Props) {
  const dialogRef = useDialog<HTMLDivElement>(onClose);
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/u/${username}`
      : `/u/${username}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard bloqueado: no pasa nada, el enlace sigue visible para copiarlo a mano.
    }
  }

  const text = `Sígueme en La Butaca Secreta: ${url}`;

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
        className="relative flex max-h-[92dvh] w-full max-w-sm flex-col items-center gap-5 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-5 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex w-full items-center justify-between">
          <span className="w-7" />
          <h2 id="compartir-perfil-title" className="text-sm font-extrabold text-white">
            Compartir mi perfil
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm text-zinc-300"
          >
            ✕
          </button>
        </div>

        <div className="rounded-2xl bg-white p-3.5">
          <QRCodeSVG value={url} size={180} />
        </div>

        <p className="text-xs text-zinc-400">
          Escanéalo con la cámara para abrir tu perfil en La Butaca Secreta
        </p>

        <div className="flex w-full items-center gap-2 rounded-2xl border border-white/15 bg-black/25 px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate text-left text-xs text-zinc-300">
            {url}
          </span>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white"
          >
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>

        <div className="flex w-full gap-2.5">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3 text-sm font-extrabold text-black"
          >
            WhatsApp
          </a>
          <button
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/25 py-3 text-sm font-extrabold text-white"
          >
            Instagram
          </button>
        </div>

        <p className="text-[11px] text-zinc-500">
          Para Instagram, descarga la imagen del QR y pégala como sticker de
          enlace en tu story.
        </p>
      </div>
    </div>,
    document.body
  );
}
