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
        Números afinados a mano (ver scratchpad de la sesión), para que
        los DOS extremos de la cinta se corten limpios por un borde
        real de la máscara (arriba y a la derecha, que coinciden con
        la esquina real de la tarjeta) y ninguno quede flotando como
        una punta suelta en mitad de la nada, ni se corte por el borde
        inferior o izquierdo (que no son una esquina real).

        Comprobado con getBoundingClientRect() del propio <Link> ya
        rotado, comparado con el de la máscara: hay que verificar
        rTop < maskTop y rRight > maskRight (ambos extremos
        recortados, con margen) y rLeft > maskLeft y rBottom <
        maskBottom (ninguno de los otros dos tocando el borde). Si se
        retoca el ancho, el padding o la letra, hay que repetir esta
        comprobación — a ojo en una captura es fácil que un extremo
        quede a 1-2px del borde sin llegar a recortarse de verdad.
      */}
      <Link
        href="/mi-resumen"
        aria-label="Ver tu Resumen Anual 2026"
        className="
          marquee-font
          pointer-events-auto
          absolute
          right-[-36px]
          top-[27px]
          flex
          w-[168px]
          rotate-45
          flex-col
          items-center
          gap-[3px]
          whitespace-nowrap
          bg-gradient-to-r from-amber-400 via-orange-500 to-red-600
          py-[7px]
          text-center
          leading-none
          sm:gap-1
          md:gap-1.5
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
        <span className="text-[13px] tracking-wide sm:text-[20px] md:text-[24px]">
          WRAPPED 2026
        </span>
        <span className="text-[8px] tracking-[0.08em] sm:text-[12px] md:text-[14px]">
          NO TE LO PIERDAS
        </span>
      </Link>
    </div>
  );
}
