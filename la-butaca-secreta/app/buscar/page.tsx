import type { Metadata } from "next";
import Link from "next/link";

import PosterWall from "@/components/layout/PosterWall";
import SearchBox from "@/components/search/SearchBox";
import { SearchIcon } from "@/components/icons/Icons";
import { SITE_NAME } from "@/lib/site";

const title = "Buscar una película o serie";
const description = `Escribe un título y te digo en qué plataforma está (Netflix, Prime Video, Disney+, Max o Filmin), la sinopsis, la nota y el reparto, con ${SITE_NAME}.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/buscar" },
  openGraph: { title, description, url: "/buscar" },
  twitter: { title, description },
};

export default function BuscarPage() {
  return (
    <>
      <PosterWall />

      <main
        id="contenido-buscar"
        className="relative flex justify-center px-4 py-4 md:px-6 md:pb-4 md:pt-10"
      >
        <section
          className="
            relative
            z-30
            w-full
            max-w-2xl

            rounded-3xl

            border
            border-white/20

            bg-black/5
            md:bg-black/15
            lg:bg-black/30

            px-5
            py-6
            md:px-8
            md:py-10

            shadow-2xl

            backdrop-blur-sm
            md:backdrop-blur-xl
            lg:backdrop-blur-2xl
          "
        >
          <Link
            href="/"
            className="mb-6 inline-block text-xs font-semibold text-zinc-300 underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            ← Volver
          </Link>

          <h1 className="flex items-center gap-1.5 text-xl font-bold text-white md:text-2xl">
            <SearchIcon size={18} /> Buscar una película o
            serie
          </h1>

          <p className="mt-1 text-xs text-zinc-400 md:text-sm">
            Escribe un título: te digo dónde verla, la sinopsis, la
            nota y el reparto.
          </p>

          <div className="mt-5">
            <SearchBox />
          </div>
        </section>
      </main>
    </>
  );
}
