import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import CatalogPageBody from "@/components/catalog/CatalogPageBody";
import PosterWall from "@/components/layout/PosterWall";
import { fetchCatalogPage } from "@/lib/catalog";
import { SITE_NAME } from "@/lib/site";

// No se pre-generan en el build (requeriría TMDB_API_TOKEN y red ahí
// mismo): se generan a demanda en la primera visita a cada URL y se
// cachean 12h (43200 s), que es de sobra para contenido editorial que
// no necesita estar al minuto.
//
// Tiene que ser un literal (nada de "60 * 60 * 12"): Next.js analiza
// este export de forma estática, sin ejecutar el módulo, y una
// expresión calculada rompe el build con "Invalid segment
// configuration export detected".
export const revalidate = 43200;

type Params = { genero: string; plataforma: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { genero, plataforma } = await params;
  const page = await fetchCatalogPage("movie", genero, plataforma);

  if (!page) return {};

  const title = `Las mejores películas de ${page.genre.label} en ${page.platform.label}`;
  const description = `${SITE_NAME} te propone películas de ${page.genre.label} disponibles ahora en ${page.platform.label}, ordenadas por lo que más se está viendo.`;
  const url = `/pelis/${genero}/${plataforma}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    twitter: { title, description },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { genero, plataforma } = await params;
  const page = await fetchCatalogPage("movie", genero, plataforma);

  if (!page) notFound();

  return (
    <>
      <PosterWall />

      <main
        id="contenido-catalogo"
        className="relative flex justify-center px-4 py-4 md:px-6 md:pb-4 md:pt-10"
      >
        <section
          className="
            relative
            z-30
            w-full
            max-w-5xl

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

          <CatalogPageBody
            basePath="/pelis"
            nounSingular="película"
            nounPlural="películas"
            page={page}
          />
        </section>
      </main>
    </>
  );
}
