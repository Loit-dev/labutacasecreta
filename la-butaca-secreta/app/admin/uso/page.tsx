import type { Metadata } from "next";

import UsageDashboard from "@/components/admin/UsageDashboard";
import PosterWall from "@/components/layout/PosterWall";
import TopBar from "@/components/layout/TopBar";

export const metadata: Metadata = {
  title: "Uso de la web",
  robots: { index: false, follow: false },
};

export default function AdminUsoPage() {
  return (
    <>
      <PosterWall />

      <TopBar />

      <main
        id="contenido"
        className="relative flex justify-center px-4 pb-4 pt-6 md:px-6 md:pb-4 md:pt-10"
      >
        <section className="relative z-30 w-full max-w-4xl overflow-hidden rounded-3xl border border-white/20 bg-black/30 px-5 py-5 shadow-2xl backdrop-blur-xl md:px-8 md:py-6">
          <UsageDashboard />
        </section>
      </main>
    </>
  );
}
