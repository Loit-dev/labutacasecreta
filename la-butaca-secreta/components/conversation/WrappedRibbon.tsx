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
        h-[145px]
        w-[145px]
        overflow-hidden
        sm:h-[280px]
        sm:w-[280px]
        md:h-[320px]
        md:w-[320px]
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

        "TU RESUMEN" lleva su propio -webkit-text-stroke (no
        font-bold: Bebas Neue solo tiene un peso real y el navegador
        la "engorda" sintéticamente, dejándola borrosa — ver
        app/globals.css). El stroke es la forma correcta de hacerla
        ver más gruesa sin ese efecto.

        Texto en español, sin "Wrapped" (nombre interno en inglés que
        no se usa en ningún otro sitio de la app: el resto siempre
        dice "Mi Resumen"/"Resumen Anual") — antes decía "WRAPPED
        2026" / "NO TE LO PIERDAS".

        Antes todo el texto era negro sobre el degradado naranja: con
        el stroke también negro (mismo color que el relleno) quedaba
        totalmente plano, sin ningún contraste real. Después se probó
        blanco+contorno para "TU RESUMEN" y dorado para "ANUAL 2026",
        pero seguía sin verse como un cartel de verdad.

        Ahora es rojo/granate con filo dorado (ring-amber), como un
        cartel de cine — a juego con el sillón rojo del logo — y "TU
        RESUMEN" lleva relleno degradado dorado (bg-clip-text,
        text-transparent) con contorno granate oscuro y un resplandor
        cálido además de la sombra, como letras de neón/foil de título
        de peli. "ANUAL 2026" se queda en crema, de subtítulo, sin
        resplandor, para no competir con el titular.
      */}
      <Link
        href="/mi-resumen"
        aria-label="Ver tu Resumen Anual 2026"
        className="
          marquee-font
          pointer-events-auto
          absolute
          right-[-44px]
          top-[22px]
          flex
          w-[185px]
          rotate-45
          flex-col
          items-center
          gap-[4px]
          whitespace-nowrap
          bg-gradient-to-br from-red-500 via-red-700 to-red-950
          py-[9px]
          text-center
          leading-none
          shadow-[0_3px_14px_rgba(0,0,0,0.6)]
          ring-[1.5px]
          ring-inset
          ring-amber-300/70
          transition-transform
          hover:scale-105
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-white
          sm:right-[-36px]
          sm:top-[60px]
          sm:w-[280px]
          sm:gap-1.5
          sm:py-[18px]
          md:right-[-40px]
          md:top-[70px]
          md:w-[320px]
          md:gap-2
          md:py-[22px]
        "
      >
        <span
          className="
            bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-600
            bg-clip-text
            text-[19px]
            tracking-wide
            text-transparent
            sm:text-[26px]
            md:text-[30px]
          "
          style={{
            WebkitTextStroke: "1.1px #450a0a",
            textShadow:
              "0 1px 0 rgba(0,0,0,0.4), 0 3px 6px rgba(0,0,0,0.55), 0 0 10px rgba(255,200,120,0.45)",
          }}
        >
          TU RESUMEN
        </span>
        <span
          className="text-[13px] tracking-[0.06em] text-amber-50 sm:text-[18px] md:text-[20px]"
          style={{
            WebkitTextStroke: "0.6px #450a0a",
            textShadow: "0 1px 3px rgba(0,0,0,0.55)",
          }}
        >
          ANUAL 2026
        </span>
      </Link>
    </div>
  );
}
