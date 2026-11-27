"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { AccountIcon } from "@/components/conversation/TabIcons";
import { useAuth } from "@/hooks/useAuth";
import { countBadge, fetchNotifications } from "@/lib/supabase/notifications";

/**
 * Barra superior de la portada: logo + nombre centrados y, a la
 * derecha, el botón de "Entrar" (o "Mi cuenta" si ya hay sesión).
 * Sustituye al acceso a la cuenta que antes ocupaba la última pestaña
 * de la tarjeta (ahora esa pestaña es "Listas").
 */
export default function TopBar() {
  const { session, loading, available } = useAuth();

  const userId = session?.user.id ?? null;

  // Avisos pendientes (solicitudes, "me gusta" en tus listas…): se
  // marca el botón con una bolita y lleva directo a Notificaciones.
  const [badge, setBadge] = useState(0);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    fetchNotifications(userId).then((items) => {
      if (!cancelled) setBadge(countBadge(items));
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const showButton = available && !loading;
  const pending = userId ? badge : 0;
  const href = !session
    ? "/entrar"
    : pending > 0
      ? "/mi-cuenta?tab=amigos&notificaciones=1"
      : "/mi-cuenta";
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
          {/* Mismo degradado que "empieza aquí." del titular
              (from-amber-300 via-red-500 to-red-700), solo sobre
              "SECRETA" (x ≈ 607 → 955 dentro del viewBox). */}
          <defs>
            <linearGradient
              id="topbar-secreta"
              gradientUnits="userSpaceOnUse"
              x1="607"
              y1="0"
              x2="955"
              y2="0"
            >
              <stop offset="0%" style={{ stopColor: "var(--color-amber-300)" }} />
              <stop offset="50%" style={{ stopColor: "var(--color-red-500)" }} />
              <stop offset="100%" style={{ stopColor: "var(--color-red-700)" }} />
            </linearGradient>
          </defs>
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
            LA BUTACA <tspan fill="url(#topbar-secreta)">SECRETA</tspan>
          </text>
        </svg>
      </Link>

      <div className="flex shrink-0 justify-end">
        {showButton && (
          <a
            href={href}
            aria-label={pending > 0 ? `${label}, ${pending} notificaciones` : label}
            className="relative flex items-center gap-1.5 rounded-full border border-white/25 bg-black/40 px-2 py-1.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-4"
          >
            <AccountIcon />
            <span className="text-xs sm:text-sm">{label}</span>
            {pending > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white">
                {pending > 9 ? "9+" : pending}
              </span>
            )}
          </a>
        )}
      </div>
      </div>
    </header>
  );
}
