"use client";

import Link from "next/link";

/**
 * Cinta diagonal en la esquina de la tarjeta principal, anunciando el
 * Resumen Anual mientras dure la temporada (diciembre). Reemplaza al
 * aviso anterior (dos botones + cerrar): esto es solo un gancho
 * visual, no un CTA que compita con el resto de la portada — por eso
 * no se puede cerrar ni hay una segunda opción al lado.
 *
 * Se apoya en que la tarjeta que lo envuelve tiene `overflow-hidden` y
 * `relative` (ver Conversation.tsx), así la cinta queda recortada en
 * la esquina en vez de sobresalir.
 */
export default function WrappedRibbon() {
  return (
    <Link
      href="/mi-resumen"
      aria-label="Ver tu Resumen Anual 2026"
      className="
        marquee-font
        absolute
        right-[-62px]
        top-[22px]
        z-40
        w-[230px]
        rotate-45
        whitespace-nowrap
        bg-gradient-to-r from-amber-400 via-orange-500 to-red-600
        py-1.5
        text-center
        text-[13px]
        tracking-wide
        text-black
        shadow-[0_2px_10px_rgba(0,0,0,0.45)]
        transition-transform
        hover:scale-105
        focus-visible:outline-2
        focus-visible:outline-offset-2
        focus-visible:outline-white
      "
    >
      WRAPPED 2026 · NO TE LO PIERDAS
    </Link>
  );
}
