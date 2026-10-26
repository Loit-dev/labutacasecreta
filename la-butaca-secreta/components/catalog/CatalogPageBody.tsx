import Link from "next/link";

import CatalogGrid from "./CatalogGrid";
import { BoltIcon } from "@/components/icons/Icons";
import { CATALOG_GENRES, type CatalogPage } from "@/lib/catalog";
import { PLATFORMS } from "@/lib/platforms";

type Props = {
  basePath: "/pelis" | "/series";
  nounSingular: string; // "película" | "serie"
  nounPlural: string; // "películas" | "series"
  page: CatalogPage;
};

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function CatalogPageBody({
  basePath,
  nounSingular,
  nounPlural,
  page,
}: Props) {
  const { genre, platform, items } = page;

  return (
    <>
      <h1 className="text-2xl font-bold text-white md:text-3xl">
        Las mejores {nounPlural} de {genre.label} en {platform.label}
      </h1>

      <p className="mt-2 max-w-2xl text-sm text-zinc-300 md:text-base">
        {capitalize(nounPlural)} de {genre.label} disponibles ahora
        mismo en {platform.label}, ordenadas por lo que más se está
        viendo. Si prefieres que te eligamos nosotros según tu ánimo
        de hoy, prueba el cuestionario o Butaca Exprés.
      </p>

      {items.length > 0 ? (
        <div className="mt-6">
          <CatalogGrid
            items={items}
            detailBasePath={basePath === "/pelis" ? "/pelicula" : "/serie"}
          />
        </div>
      ) : (
        <p className="mt-6 text-sm text-zinc-400">
          No he encontrado {nounPlural} de {genre.label} en{" "}
          {platform.label} ahora mismo. Prueba otra combinación de
          género y plataforma.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/hoy"
          className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/60 transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <BoltIcon size={14} className="inline -translate-y-px" /> Prueba Butaca Exprés
        </Link>

        <Link
          href="/"
          className="rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Hacer el cuestionario completo
        </Link>
      </div>

      <nav
        aria-label={`Otras combinaciones de género y plataforma para ${nounPlural}`}
        className="mt-10 space-y-3 border-t border-zinc-800 pt-6 text-xs text-zinc-400"
      >
        <p>
          <span className="mr-2 text-zinc-500">
            Otros géneros en {platform.label}:
          </span>

          {CATALOG_GENRES.filter((other) => other.slug !== genre.slug).map(
            (other) => (
              <Link
                key={other.slug}
                href={`${basePath}/${other.slug}/${platform.key}`}
                className="mr-3 underline underline-offset-2 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {other.label}
              </Link>
            )
          )}
        </p>

        <p>
          <span className="mr-2 text-zinc-500">
            {capitalize(nounSingular)}s de {genre.label} en otras
            plataformas:
          </span>

          {PLATFORMS.filter((other) => other.key !== platform.key).map(
            (other) => (
              <Link
                key={other.key}
                href={`${basePath}/${genre.slug}/${other.key}`}
                className="mr-3 underline underline-offset-2 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {other.label}
              </Link>
            )
          )}
        </p>
      </nav>
    </>
  );
}
