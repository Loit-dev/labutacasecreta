import type { Metadata } from "next";

import PosterWall from "@/components/layout/PosterWall";
import { SITE_NAME } from "@/lib/site";

import InvitarPageBody from "./InvitarPageBody";

export const metadata: Metadata = {
  title: "Invitación",
  description: `Te han invitado a ${SITE_NAME}.`,
  robots: { index: false },
};

export default async function InvitarPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  return (
    <>
      <PosterWall />

      <main
        id="contenido-invitar"
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
            py-8
            md:px-8
            md:py-10

            text-center

            shadow-2xl
          "
        >
          <InvitarPageBody codigo={codigo} />
        </section>
      </main>
    </>
  );
}
