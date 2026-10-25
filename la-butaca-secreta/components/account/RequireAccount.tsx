"use client";

import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { useAuth } from "@/hooks/useAuth";

type Props = {
  what: string;
  children: (session: Session) => ReactNode;
};

/**
 * Envoltorio para las pestañas de "Mi cuenta" que necesitan sesión
 * (Diario, Listas): mismos tres estados de guarda que ya usaba Mi
 * Resumen (sin Supabase configurado / cargando / sin sesión), para no
 * repetirlos en cada pestaña.
 */
export default function RequireAccount({ what, children }: Props) {
  const { session, loading, available } = useAuth();

  if (!available) {
    return (
      <p className="text-center text-sm text-zinc-300">
        El login no está disponible en este momento, así que {what}{" "}
        tampoco. Prueba más tarde.
      </p>
    );
  }

  if (loading) {
    return <p className="text-center text-sm text-zinc-300">Cargando…</p>;
  }

  if (!session) {
    return (
      <div className="text-center">
        <p className="mb-4 text-sm text-zinc-300">
          {what} necesita una cuenta: así puede guardar tus datos entre
          dispositivos y mostrártelos aquí.
        </p>

        <a
          href="/entrar"
          className="inline-block rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Entrar
        </a>
      </div>
    );
  }

  return <>{children(session)}</>;
}
