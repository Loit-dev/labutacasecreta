"use client";

import { useEffect } from "react";

import { supabase } from "@/lib/supabase/client";
import { takeReturnTo } from "@/lib/returnTo";

/**
 * Al volver de iniciar sesión (Google o enlace del correo), lleva a la
 * página desde la que se fue a entrar (lib/returnTo.ts). Va en el
 * layout, así funciona llegue a la página que llegue.
 */
export default function ReturnAfterLogin() {
  useEffect(() => {
    if (!supabase) return;

    const go = () => {
      const path = takeReturnTo();
      const here = window.location.pathname + window.location.search;

      if (path && path !== here) window.location.replace(path);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) go();
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}
