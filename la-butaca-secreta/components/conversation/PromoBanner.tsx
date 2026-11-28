"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Se puede cerrar y, una vez cerrado, no vuelve a salir en ese
// navegador — igual que el resto de avisos ligeros de la web (no hay
// nada que sincronizar con la cuenta, así que basta con localStorage).
const DISMISS_KEY = "promo_wrapped_invitar_v1";

/**
 * Aviso de portada con dos ganchos de crecimiento orgánico: el
 * Resumen Anual (contenido que la propia gente comparte) e invitar a
 * un amigo (el canal con mejor conversión, porque viene de alguien de
 * confianza). Solo se ve antes de elegir modo en el Recomendador —
 * una vez empieza el cuestionario, estorbaría.
 */
export default function PromoBanner() {
  // Empieza oculto hasta leer localStorage, para no parpadear ni
  // desajustar el render de servidor y cliente.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(localStorage.getItem(DISMISS_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setVisible(false);

    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Si localStorage no está disponible, simplemente no se recuerda
      // entre visitas — no es motivo para romper nada.
    }
  }

  if (!visible) return null;

  return (
    <div
      className="
        flex flex-col gap-3 rounded-2xl border border-amber-300/25
        bg-gradient-to-r from-amber-500/10 via-red-500/10 to-transparent
        p-4
        sm:flex-row sm:items-center sm:justify-between
      "
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Link
          href="/mi-resumen"
          className="rounded-full bg-amber-300 px-4 py-2 text-center text-xs font-extrabold text-black transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          🎬 Ver tu Resumen Anual
        </Link>

        <Link
          href="/mi-cuenta?tab=amigos"
          className="rounded-full border border-white/20 px-4 py-2 text-center text-xs font-extrabold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Invita a un amigo
        </Link>
      </div>

      <button
        onClick={dismiss}
        aria-label="Cerrar aviso"
        className="self-end rounded-full p-1 text-zinc-400 transition-colors hover:text-white sm:self-auto"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
