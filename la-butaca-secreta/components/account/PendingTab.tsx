"use client";

import Image from "next/image";
import Link from "next/link";

import { useWatchlist } from "@/hooks/useWatchlist";

export default function PendingTab() {
  const { items, remove } = useWatchlist();

  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-black/30 px-4 py-8 text-center text-sm text-zinc-300">
        Tu lista de pendientes está vacía. Pulsa «Guardar para ver
        luego» en cualquier recomendación o ficha.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const href = `/${item.type === "tv" ? "serie" : "pelicula"}/${item.id}`;

        return (
          <li
            key={`${item.type}-${item.id}`}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-2"
          >
            <Link
              href={href}
              className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {item.poster && (
                <Image
                  src={item.poster}
                  alt=""
                  fill
                  unoptimized={item.poster.endsWith(".svg")}
                  sizes="56px"
                  className="object-cover"
                />
              )}
            </Link>

            <Link href={href} className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">
                {item.title}
              </p>

              <p className="text-xs text-zinc-300">
                {item.type === "tv" ? "Serie" : "Película"}
                {item.year ? ` · ${item.year}` : ""}
                {item.rating ? ` · ★ ${item.rating}` : ""}
              </p>

              {item.platforms.length > 0 && (
                <p className="truncate text-xs text-zinc-400">
                  {item.platforms.join(" · ")}
                </p>
              )}
            </Link>

            <button
              onClick={() => remove(item.id, item.type)}
              aria-label={`Quitar de pendientes: ${item.title}`}
              className="marquee-font shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Quitar
            </button>
          </li>
        );
      })}
    </ul>
  );
}
