"use client";

import { track } from "@/lib/analytics";

/**
 * Icono (sin texto) a @labutacashhh, junto al logo de TMDb en el pie
 * de página. Antes vivía como pestaña fija en la barra de inicio,
 * pero ese hueco ahora lo usa el acceso a la cuenta (AccountTabLink).
 */
export default function InstagramIconLink() {
  return (
    <a
      href="https://www.instagram.com/labutacashhh/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Síguenos en Instagram (@labutacashhh)"
      onClick={() => track("instagram_click")}
      className="inline-flex shrink-0 opacity-80 transition-opacity hover:opacity-100"
    >
      <span
        aria-hidden="true"
        className="flex h-4 w-4 items-center justify-center rounded-[5px] bg-gradient-to-tr from-amber-400 via-pink-600 to-purple-600"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-[11px] w-[11px]"
          fill="none"
          stroke="white"
          strokeWidth={2.5}
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="1" fill="white" stroke="none" />
        </svg>
      </span>
    </a>
  );
}
