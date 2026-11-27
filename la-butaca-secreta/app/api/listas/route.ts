import { NextResponse } from "next/server";

import { fetchListsFeed } from "@/lib/lists/server";

// Literal (ver app/api/canon/route.ts): Next.js lo analiza de forma
// estática. Igual que FEED_REVALIDATE en lib/lists/server.ts.
export const revalidate = 300;

/**
 * Pestaña Listas: listas públicas populares/recientes y el Top de La
 * Butaca, iguales para todo el mundo y cacheados 5 minutos. Los "me
 * gusta" propios se piden aparte desde el navegador.
 */
export async function GET() {
  const data = await fetchListsFeed();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
