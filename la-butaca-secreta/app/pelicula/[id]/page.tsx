import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PosterWall from "@/components/layout/PosterWall";
import TitlePageBody from "@/components/title/TitlePageBody";
import { SITE_NAME } from "@/lib/site";
import { getTitleDetails } from "@/lib/tmdb/shared";

// No se pre-generan en el build (no hay una lista cerrada de ids):
// se generan a demanda en la primera visita y se cachean 6h (21600 s,
// literal: Next.js analiza este export de forma estática y una
// expresión calculada rompe el build con "Invalid segment
// configuration export detected").
export const revalidate = 21600;

type Params = { id: string };

async function loadMovie(idParam: string) {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) return null;

  return getTitleDetails("movie", id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const movie = await loadMovie(id);

  if (!movie) return {};

  const title = `${movie.title}${movie.year ? ` (${movie.year})` : ""} — dónde verla, sinopsis y reparto`;
  const description =
    movie.overview ||
    `Dónde ver ${movie.title}, nota, reparto y más, en ${SITE_NAME}.`;
  const url = `/pelicula/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: movie.poster ? [movie.poster] : undefined,
    },
    twitter: { title, description },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const movie = await loadMovie(id);

  if (!movie) notFound();

  return (
    <>
      <PosterWall />

      <main
        id="contenido-ficha"
        className="relative flex justify-center px-4 py-4 md:px-6 md:pb-4 md:pt-10"
      >
        <section
          className="
            relative
            z-30
            w-full
            max-w-3xl

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

          <TitlePageBody type="movie" title={movie} />
        </section>
      </main>
    </>
  );
}
