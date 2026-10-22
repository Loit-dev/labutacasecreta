import type { Metadata } from "next";
import Link from "next/link";

import PosterWall from "@/components/layout/PosterWall";
import QuickPicks from "@/components/recommendations/QuickPicks";
import { SITE_NAME } from "@/lib/site";

const title = "La carta de hoy";
const description = `Tres propuestas al momento, sin cuestionario: lo que ${SITE_NAME} te recomienda hoy.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/hoy" },
  openGraph: { title, description, url: "/hoy" },
  twitter: { title, description },
};

export default function TodayPage() {
  return (
    <>
      <a
        href="#contenido-hoy"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
      >
        Saltar al contenido
      </a>

      <PosterWall />

      <main
        id="contenido-hoy"
        className="relative flex justify-center px-4 py-4 md:px-6 md:pb-4 md:pt-10"
      >
        <section
          className="
            relative
            z-30
            w-full
            max-w-4xl

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

          <QuickPicks />
        </section>
      </main>
    </>
  );
}
