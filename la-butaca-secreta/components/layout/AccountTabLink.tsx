"use client";

import { useAuth } from "@/hooks/useAuth";

import { AccountIcon } from "@/components/conversation/TabIcons";

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
      className="marquee-font flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 border-b-[3px] border-transparent bg-black/30 px-1 pb-2.5 pt-3.5 text-center text-xs leading-tight text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white sm:px-2 sm:text-base"
    >
      <AccountIcon />
      {label}
    </a>
  );
}
