import type { Metadata } from "next";
import Link from "next/link";

import PosterWall from "@/components/layout/PosterWall";
import { ClapperIcon } from "@/components/icons/Icons";
import { SITE_NAME } from "@/lib/site";

import LoginForm from "./LoginForm";

const title = "Entrar";
const description = `Entra en ${SITE_NAME} para guardar tu lista, tus valoraciones y tu resumen en cualquier dispositivo.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/entrar" },
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <>
      <PosterWall />

      <main
        id="contenido-entrar"
        className="relative flex justify-center px-4 py-4 md:px-6 md:pb-4 md:pt-10"
      >
        <section
          className="
            relative
            z-30
            w-full
            max-w-md

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
            className="marquee-font mb-6 inline-block text-sm text-zinc-300 underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            ← Seguir sin cuenta
          </Link>

          <div className="mb-6 text-center">
            <div className="flex justify-center text-zinc-300" aria-hidden="true">
              <ClapperIcon size={40} />
            </div>

            <h1 className="marquee-font mt-2 text-2xl text-white">
              {SITE_NAME}
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Entra para guardar tu lista, tus valoraciones y tu
              resumen en cualquier dispositivo
            </p>
          </div>

          <LoginForm />
        </section>
      </main>
    </>
  );
}
