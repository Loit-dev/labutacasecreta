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
    <header className="relative z-40 mx-auto grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-4 md:px-6 md:pt-6">
      <div aria-hidden="true" />

      <Link
        href="/"
        className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:gap-3"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/butaca-icon.png"
          alt=""
          width={422}
          height={313}
          className="h-6 w-auto min-[400px]:h-7 sm:h-10"
        />
        <span className="marquee-font whitespace-nowrap text-lg leading-none text-white min-[400px]:text-xl sm:text-3xl">
          La Butaca <span className="text-red-500">Secreta</span>
        </span>
      </Link>

      <div className="flex justify-end">
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
    </header>
  );
}
