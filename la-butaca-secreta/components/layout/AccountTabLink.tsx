"use client";

import { useAuth } from "@/hooks/useAuth";

/**
 * Icono de cuenta en la barra de pestañas de inicio (antes era el
 * acceso directo a Instagram): lleva a "Mi cuenta" si hay sesión, o a
 * "Entrar" si no. Oculto si el login no está configurado en este
 * despliegue, igual que AccountStatus.
 */
export default function AccountTabLink() {
  const { session, loading, available } = useAuth();

  if (!available || loading) return null;

  const href = session ? "/mi-cuenta" : "/entrar";
  const label = session ? "Mi cuenta" : "Entrar";

  return (
    <a
      href={href}
      aria-label={label}
      className="marquee-font flex min-w-0 flex-1 flex-col items-center justify-center border-b-[3px] border-transparent bg-black/30 px-1 pb-2.5 pt-3.5 text-center text-xs leading-tight text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white sm:px-2 sm:text-base"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
      </svg>
      {label}
    </a>
  );
}
