import type { Metadata } from "next";

import PosterWall from "@/components/layout/PosterWall";
import { SITE_NAME } from "@/lib/site";

import UsernamePageBody from "./UsernamePageBody";

export const metadata: Metadata = {
  title: "Perfil",
  description: `Perfil de usuario en ${SITE_NAME}.`,
  robots: { index: false },
};

export default async function UsernamePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <>
      <PosterWall />

      <main
        id="contenido-perfil"
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
          "
        >
          <UsernamePageBody username={username} />
        </section>
      </main>
    </>
  );
}
