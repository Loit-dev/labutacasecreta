"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

type AuthState = {
  session: Session | null;
  loading: boolean;
  // false si no hay Supabase configurado (faltan las variables de
  // entorno): el resto de la app lo usa para ocultar todo lo de
  // cuenta en vez de mostrar un login roto.
  available: boolean;
};

/** Sesión actual del usuario, si hay login configurado. */
export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      }
    );

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, loading, available: !!supabase };
}
