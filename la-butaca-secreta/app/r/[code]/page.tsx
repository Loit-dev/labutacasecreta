import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PosterWall from "@/components/layout/PosterWall";
import MyListButton from "@/components/list/MyListButton";
import SharedRecommendations from "@/components/recommendations/SharedRecommendations";
import { audienceLabel } from "@/lib/group";
import { parseShareCode } from "@/lib/shareLink";
import { SITE_NAME } from "@/lib/site";
import { getSharedRecommendations } from "@/lib/tmdb/shared";

type Props = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { code } = await params;

  const set = parseShareCode(code);

  const what = set?.type === "tv" ? "series" : "películas";

  const audience = audienceLabel(set?.group) ?? null;

  const title = audience
    ? `Sugerencias para ${audience}`
    : "Mis sugerencias";

  const description = set?.group
    ? `${set.group.percent} % de coincidencia. Mira las ${what} que ${SITE_NAME} ha elegido para ${audience} y haz tu propio cuestionario.`
    : `Mira las ${what} que me han recomendado en ${SITE_NAME} y haz tu propio cuestionario.`;

  return {
    title,
    description,
    // Son enlaces personales: que no salgan en buscadores
    robots: { index: false, follow: true },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharedPage({ params }: Props) {
  const { code } = await params;

  const set = parseShareCode(code);

  if (!set) notFound();

  const items = await getSharedRecommendations(set);

  const audience = audienceLabel(set.group) ?? null;

  return (
    <>
      <PosterWall />

      <MyListButton />

      <main className="relative flex min-h-screen items-center justify-center px-6 py-10">
        <section className="relative z-30 w-full max-w-4xl overflow-hidden rounded-3xl border border-white/20 bg-black/20 px-6 py-8 shadow-2xl backdrop-blur-sm sm:px-8 sm:backdrop-blur-xl">
          <header className="mb-8 text-center">
            <h1
              className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
              style={{ fontFamily: "var(--font-manrope)" }}
            >
              {audience
                ? `Sugerencias para ${audience}`
                : "Te han compartido sus sugerencias"}
            </h1>

            <p className="mt-3 text-zinc-300">
              {set.group
                ? `${set.group.percent} % de coincidencia · ${
                    set.type === "tv" ? "Series" : "Películas"
                  } que ${SITE_NAME} ha elegido para ellos.`
                : `${
                    set.type === "tv" ? "Series" : "Películas"
                  } que ${SITE_NAME} le ha recomendado a alguien.`}
            </p>
          </header>

          {items.length > 0 ? (
            <SharedRecommendations
              items={items}
              type={set.type}
            />
          ) : (
            <div className="space-y-4 text-center">
              <p role="status" className="text-zinc-300">
                No he podido cargar estas recomendaciones ahora
                mismo. Inténtalo de nuevo en unos minutos, o
                haz tu propio cuestionario.
              </p>

              <Link
                href="/"
                className="inline-block rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Hacer el cuestionario
              </Link>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
