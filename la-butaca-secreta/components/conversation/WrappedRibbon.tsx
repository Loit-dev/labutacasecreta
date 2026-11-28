"use client";

import Link from "next/link";

/**
 * Cinta diagonal en la esquina de la tarjeta, anunciando el Resumen
 * Anual mientras dure la temporada (diciembre). Es solo un gancho
 * visual, no un CTA que compita con el resto de la portada — por eso
 * no se puede cerrar ni hay una segunda opción al lado.
 *
 * El contenedor exterior (este componente lo coloca un padre con
 * `relative`) solo reserva una esquina cuadrada con `overflow-hidden`:
 * es una "máscara" pensada únicamente para recortar la cinta en la
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
        h-[135px]
        w-[135px]
        overflow-hidden
        sm:h-[260px]
        sm:w-[260px]
        md:h-[300px]
        md:w-[300px]
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
        tarjeta). El grosor (padding vertical + tamaño de letra) se
        subió a petición explícita ("hazla más gruesa"), así que al
        tocarlo hay que volver a comprobar que las puntas sigan sin
        tocar esos dos bordes.
      */}
      <Link
        href="/mi-resumen"
        aria-label="Ver tu Resumen Anual 2026"
        className="
          marquee-font
          pointer-events-auto
          absolute
          right-[-14px]
          top-[27px]
          flex
          w-[168px]
          rotate-45
          flex-col
          items-center
          whitespace-nowrap
          bg-gradient-to-r from-amber-400 via-orange-500 to-red-600
          py-[7px]
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
          sm:right-[-30px]
          sm:top-[55px]
          sm:w-[260px]
          sm:py-4
          md:right-[-34px]
          md:top-[65px]
          md:w-[300px]
          md:py-5
        "
      >
        <span className="text-[11px] font-bold tracking-wide sm:text-[19px] md:text-[23px]">
          WRAPPED 2026
        </span>
        <span className="text-[8px] tracking-wide sm:text-[13px] md:text-[15px]">
          NO TE LO PIERDAS
        </span>
      </Link>
    </div>
  );
}
