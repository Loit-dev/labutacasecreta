import type { Metadata } from "next";

import AccountScreen from "@/components/account/AccountScreen";
import PosterWall from "@/components/layout/PosterWall";
import { SITE_NAME } from "@/lib/site";

const title = "Mi cuenta";
const description = `Tu perfil en ${SITE_NAME}: tu resumen, tu diario de pelis y series vistas, tus listas y tus pendientes.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/mi-cuenta" },
  robots: { index: false },
};

export default function MiCuentaPage() {
  return (
    <>
      <PosterWall />

      <main
        id="contenido-cuenta"
        className="relative flex justify-center px-4 py-4 md:px-6 md:pb-4 md:pt-10"
      >
        <section
          className="
            relative
            z-30
            w-full
            max-w-4xl
            overflow-hidden

            rounded-3xl

            border
            border-white/20

            bg-black/5
            md:bg-black/15
            lg:bg-black/30

            shadow-2xl

            backdrop-blur-sm
            md:backdrop-blur-xl
            lg:backdrop-blur-2xl
          "
        >
          <AccountScreen />
        </section>
      </main>
    </>
  );
}
