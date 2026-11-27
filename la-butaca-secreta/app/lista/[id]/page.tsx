import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ListPage from "@/components/lists/ListPage";
import PosterWall from "@/components/layout/PosterWall";
import TopBar from "@/components/layout/TopBar";
import { fetchUserListPage } from "@/lib/lists/server";
import {
  OFFICIAL_LISTS,
  fromListItems,
  isListKey,
  isOfficialKey,
  itemsLabel,
} from "@/lib/lists/shared";
import { SITE_NAME } from "@/lib/site";

type Params = { params: Promise<{ id: string }> };

// Literal (Next.js lo analiza de forma estática): igual que
// LIST_REVALIDATE en lib/lists/server.ts.
export const revalidate = 60;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;

  if (isOfficialKey(id)) {
    const official = OFFICIAL_LISTS[id];

    return {
      title: official.title,
      description: official.description,
      alternates: { canonical: `/lista/${id}` },
    };
  }

  if (!isListKey(id)) return { title: "Lista" };

  const list = await fetchUserListPage(id);

  if (!list) return { title: "Lista", robots: { index: false } };

  const author = list.username ? ` de @${list.username}` : "";

  return {
    title: list.name,
    description: `«${list.name}»${author}: ${itemsLabel(list.items.length)} en ${SITE_NAME}.`,
    alternates: { canonical: `/lista/${id}` },
    openGraph: {
      title: `${list.name} · ${SITE_NAME}`,
      description: `Lista${author} en ${SITE_NAME}.`,
      url: `/lista/${id}`,
    },
  };
}

export default async function ListaPage({ params }: Params) {
  const { id } = await params;

  if (!isListKey(id)) notFound();

  let body: React.ReactNode;

  if (isOfficialKey(id)) {
    const official = OFFICIAL_LISTS[id];

    body = (
      <ListPage
        listKey={id}
        title={official.title}
        author="Oficial"
        official
        description={official.description}
        initialPosters={null}
      />
    );
  } else {
    const list = await fetchUserListPage(id);

    if (!list) notFound();

    body = (
      <ListPage
        listKey={list.id}
        title={list.name}
        author={list.username ? `@${list.username}` : "Anónimo"}
        authorHref={list.username ? `/u/${list.username}` : undefined}
        official={false}
        description={itemsLabel(list.items.length)}
        initialPosters={fromListItems(list.items)}
        likesTotal={list.likesTotal}
      />
    );
  }

  return (
    <>
      <PosterWall />

      <TopBar />

      <main
        id="contenido"
        className="relative flex justify-center px-4 pb-4 pt-6 md:px-6 md:pb-4 md:pt-10"
      >
        <section className="relative z-30 w-full max-w-4xl overflow-hidden rounded-3xl border border-white/20 bg-black/5 px-5 py-5 shadow-2xl backdrop-blur-sm md:bg-black/15 md:px-8 md:py-6 md:backdrop-blur-xl lg:bg-black/30 lg:backdrop-blur-2xl">
          {body}
        </section>
      </main>
    </>
  );
}
