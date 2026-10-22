import Link from "next/link";
import type { Metadata } from "next";

import PosterWall from "@/components/layout/PosterWall";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: `No hemos encontrado esa página de ${SITE_NAME}.`,
  robots: { index: false, follow: true },
  alternates: { canonical: undefined },
  openGraph: {
    title: "Página no encontrada",
    description: `No hemos encontrado esa página de ${SITE_NAME}.`,
    url: undefined,
  },
};

export default function NotFound() {
  return (
    <main className="relative z-30 flex min-h-[90vh] flex-col items-center justify-center px-6 py-16 text-center">
      <PosterWall />

      <p className="text-7xl" aria-hidden="true">
        🎬
      </p>

      <h1
        className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
        style={{ fontFamily: "var(--font-manrope)" }}
      >
        Esta escena no existe
      </h1>

      <p className="mt-3 max-w-md text-sm text-zinc-400">
        No hemos encontrado la página que buscabas. Puede que el
        enlace esté roto o que la escena se haya cortado.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Pedir recomendaciones
        </Link>

        <Link
          href="/?tab=calendario"
          className="rounded-full border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Ver el calendario
        </Link>
      </div>
    </main>
  );
}
