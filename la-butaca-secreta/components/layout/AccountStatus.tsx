"use client";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";

/**
 * Enlace a "Entrar" en el footer, o el email + "Salir" si ya hay
 * sesión. Si el login no está configurado en este despliegue (faltan
 * las variables de Supabase), no se muestra nada.
 */
export default function AccountStatus() {
  const { session, loading, available } = useAuth();

  if (!available || loading) return null;

  if (!session) {
    return (
      <p className="mt-2">
        <a
          href="/entrar"
          className="underline-offset-2 hover:text-zinc-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Entrar
        </a>
      </p>
    );
  }

  return (
    <p className="mt-2">
      {session.user.email}
      {" · "}
      <button
        type="button"
        onClick={() => supabase?.auth.signOut()}
        className="underline-offset-2 hover:text-zinc-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Salir
      </button>
    </p>
  );
}
