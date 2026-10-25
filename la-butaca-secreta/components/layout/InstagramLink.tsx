"use client";

import { track } from "@/lib/analytics";

/**
 * Enlace fijo a @labutacashhh, visible en las 3 pestañas (no solo en el
 * Recomendador, como el logo decorativo). La bio de Instagram ya enlaza
 * a la web; esto cierra el círculo en el otro sentido.
 */
export default function InstagramLink() {
  return (
    <a
      href="https://www.instagram.com/labutacashhh/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Síguenos en Instagram (@labutacashhh)"
      onClick={() => track("instagram_click")}
      className="flex flex-none items-center justify-center gap-1.5 border-b-[3px] border-transparent bg-black/30 px-3 text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-400 via-pink-600 to-purple-600"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-[15px] w-[15px]"
          fill="none"
          stroke="white"
          strokeWidth={2}
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="1" fill="white" stroke="none" />
        </svg>
      </span>
      <span className="hidden text-[11px] font-bold sm:inline">
        Síguenos
      </span>
    </a>
  );
}
