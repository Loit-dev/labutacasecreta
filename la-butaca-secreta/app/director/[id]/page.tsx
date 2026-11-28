import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DirectorPageBody from "@/components/director/DirectorPageBody";
import BackLink from "@/components/layout/BackLink";
import PosterWall from "@/components/layout/PosterWall";
import { SITE_NAME } from "@/lib/site";
import { getDirectorDetails } from "@/lib/tmdb/shared";

// No se pre-generan en el build (no hay una lista cerrada de ids):
// se generan a demanda en la primera visita y se cachean 6h (21600 s,
// literal: Next.js analiza este export de forma estática y una
// expresión calculada rompe el build con "Invalid segment
// configuration export detected").
export const revalidate = 21600;

type Params = { id: string };

async function loadDirector(idParam: string) {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) return null;

  return getDirectorDetails(id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const director = await loadDirector(id);

  if (!director) return {};

  const title = `${director.name} — Modo Director: su filmografía`;
  const description = `Las películas y series que ha dirigido ${director.name}, y dónde verlas, en ${SITE_NAME}.`;
  const url = `/director/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: director.photo ? [director.photo] : undefined,
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
  const director = await loadDirector(id);

  if (!director) notFound();

  return (
    <>
      <PosterWall />

      <main
        id="contenido-director"
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
          <BackLink />

          <DirectorPageBody director={director} />
        </section>
      </main>
    </>
  );
}
