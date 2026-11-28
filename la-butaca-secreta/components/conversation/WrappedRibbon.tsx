"use client";

import Link from "next/link";

/**
 * Cinta diagonal en la esquina de la tarjeta, anunciando el Resumen
 * Anual mientras dure la temporada (diciembre). Es solo un gancho
 * visual, no un CTA que compita con el resto de la portada — por eso
 * no se puede cerrar ni hay una segunda opción al lado.
 *
 * El contenedor exterior (este componente lo coloca un padre con
 * `relative`) solo reserva una esquina cuadrada (`h-28 w-28` en
 * móvil, más grande en pantallas mayores) con `overflow-hidden`: es
 * una "máscara" pensada únicamente para recortar la cinta en la
 * esquina sin tocar el resto del contenido (p. ej. el título de
 * Header), que vive fuera de esta máscara y no se ve afectado.
 */
export default function WrappedRibbon() {
  return (
    <div
      className="
        pointer-events-none
        absolute
        right-0
        top-0
        z-40
        h-[130px]
        w-[130px]
        overflow-hidden
        sm:h-[230px]
        sm:w-[230px]
        md:h-[260px]
        md:w-[260px]
      "
    >
      {/*
        Números afinados a mano (ver scratchpad de la sesión): para que
        la cinta no se vea "mal puesta", las dos puntas del rectángulo
        rotado deben quedar DENTRO de esta caja (nunca recortadas por
        su borde inferior o izquierdo, que no son una esquina real de
        la tarjeta) y solo los lados largos deben asomar por el borde
        superior y derecho (que sí son la esquina real, así que ahí
        el corte queda natural, como si la cinta siguiera fuera de la
        tarjeta).
      */}
      <Link
        href="/mi-resumen"
        aria-label="Ver tu Resumen Anual 2026"
        className="
          marquee-font
          pointer-events-auto
          absolute
          right-[-14px]
          top-[35px]
          flex
          w-[175px]
          rotate-45
          flex-col
          items-center
          whitespace-nowrap
          bg-gradient-to-r from-amber-400 via-orange-500 to-red-600
          py-1
          text-center
          leading-none
          text-black
          shadow-[0_3px_14px_rgba(0,0,0,0.5)]
          ring-1
          ring-inset
          ring-white/40
          transition-transform
          hover:scale-105
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-white
          sm:right-[-26px]
          sm:top-[62px]
          sm:w-[300px]
          sm:py-2.5
          md:right-[-30px]
          md:top-[70px]
          md:w-[340px]
          md:py-3
        "
      >
        <span className="text-[10px] font-bold tracking-wide sm:text-[17px] md:text-[19px]">
          WRAPPED 2026
        </span>
        <span className="text-[7px] tracking-wide sm:text-[11px] md:text-[12px]">
          NO TE LO PIERDAS
        </span>
      </Link>
    </div>
  );
}
