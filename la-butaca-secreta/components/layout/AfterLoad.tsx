"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Pinta `children` solo cuando la página ya ha cargado (y el navegador
 * está libre), con un fundido. Para decoración que no debe retrasar lo
 * importante: p. ej. los pósters del fondo de la portada, que eran el
 * "elemento más grande" para Lighthouse y retrasaban la carga ~4 s en
 * móvil.
 */
export default function AfterLoad({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const show = () => {
      const run = () => setReady(true);

      if ("requestIdleCallback" in window) {
        idle = window.requestIdleCallback(run, { timeout: 2000 });
      } else {
        timer = setTimeout(run, 200);
      }
    };

    if (document.readyState === "complete") show();
    else window.addEventListener("load", show, { once: true });

    return () => {
      window.removeEventListener("load", show);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!ready) return null;

  return <div className="animate-[fadeIn_1.2s_ease-out]">{children}</div>;
}
