"use client";

import Link from "next/link";

import { AccountIcon } from "@/components/conversation/TabIcons";
import { useAuth } from "@/hooks/useAuth";

/**
 * Barra superior de la portada: logo + nombre centrados y, a la
 * derecha, el botón de "Entrar" (o "Mi cuenta" si ya hay sesión).
 * Sustituye al acceso a la cuenta que antes ocupaba la última pestaña
 * de la tarjeta (ahora esa pestaña es "Listas").
 */
export default function TopBar() {
  const { session, loading, available } = useAuth();

  const showButton = available && !loading;
  const href = session ? "/mi-cuenta" : "/entrar";
  const label = session ? "Mi cuenta" : "Entrar";

  return (
    <header className="relative z-40 w-full px-4 pt-4 md:px-6 md:pt-6">
      <div className="mx-auto flex w-full max-w-4xl items-center gap-3 md:gap-5">
      {/* Logo + nombre: ocupan todo el ancho desde el borde de la
          tarjeta hasta el botón, con el mismo margen a cada lado (pl-3
          a la izquierda = gap-3 hasta el botón). Es un SVG con
          textLength para que el texto se estire justo a ese ancho. */}
      <Link
        href="/"
        aria-label="La Butaca Secreta"
        className="block min-w-0 flex-1 pl-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:pl-5"
      >
        <svg
          viewBox="0 0 955 100"
          className="block h-auto w-full"
          aria-hidden="true"
        >
          <image href="/butaca-icon.png" x="0" y="0" width="135" height="100" />
          <text
            x="155"
            y="92"
            textLength="800"
            lengthAdjust="spacingAndGlyphs"
            fontSize="120"
            style={{ fontFamily: "var(--font-marquee)" }}
            fill="#ffffff"
          >
            LA BUTACA <tspan fill="#ef4444">SECRETA</tspan>
          </text>
        </svg>
      </Link>

      <div className="flex shrink-0 justify-end">
        {showButton && (
          <a
            href={href}
            aria-label={label}
            className="flex items-center gap-1.5 rounded-full border border-white/25 bg-black/40 px-2 py-1.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-4"
          >
            <AccountIcon />
            <span className="text-xs sm:text-sm">{label}</span>
          </a>
        )}
      </div>
      </div>
    </header>
  );
}
