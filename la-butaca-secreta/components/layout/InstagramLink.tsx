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
      className="flex flex-none items-center justify-center border-b-[3px] border-transparent bg-black/30 px-3 text-zinc-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    </a>
  );
}
