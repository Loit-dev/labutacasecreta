"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";

import { useDialog } from "@/hooks/useDialog";

export type TitleGridItem = {
  key: string;
  id: number;
  type: "movie" | "tv";
  title: string;
  poster?: string | null;
};

type Props = {
  title: string;
  subtitle?: string;
  items: TitleGridItem[];
  emptyText: string;
  onClose: () => void;
};

/**
 * Rejilla de pósters de solo lectura (sin botón de quitar), para ver
 * el detalle de un cuadro de estadísticas (Totales, Pendientes…) en
 * el perfil de otra persona. Mismo diseño que DiscardedDialog, sin la
 * parte de edición porque esos títulos no son nuestros.
 */
export default function TitleGridDialog({
  title,
  subtitle,
  items,
  emptyText,
  onClose,
}: Props) {
  const dialogRef = useDialog<HTMLDivElement>(onClose);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="title-grid-dialog-title"
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="title-grid-dialog-title" className="text-lg font-bold text-white">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {items.length === 0 ? (
          <p
            role="status"
            className="rounded-2xl bg-black/40 px-4 py-8 text-center text-sm text-zinc-300"
          >
            {emptyText}
          </p>
        ) : (
          <div className="-mr-1 grid grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
            {items.map((item) => {
              const href = `/${item.type === "tv" ? "serie" : "pelicula"}/${item.id}`;

              return (
                <Link
                  key={item.key}
                  href={href}
                  className="block overflow-hidden rounded-xl bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <div className="relative aspect-[2/3] w-full">
                    {item.poster ? (
                      <Image
                        src={item.poster}
                        alt=""
                        fill
                        unoptimized={item.poster.endsWith(".svg")}
                        sizes="150px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-2 text-center text-[11px] text-zinc-400">
                        {item.title}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
