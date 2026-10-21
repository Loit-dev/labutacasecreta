/**
 * Pósters de repuesto cuando ni la ficha en español ni en inglés de
 * TMDb traen imagen (títulos muy poco conocidos). Fuentes gratuitas
 * y sin clave: TVmaze (para series) y Wikipedia.
 */

async function tvmazePoster(title: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`,
      { next: { revalidate: 60 * 60 * 24 * 7 } }
    );

    if (!response.ok) return null;

    const data: Array<{ show?: { image?: { original?: string } } }> =
      await response.json();

    return data[0]?.show?.image?.original ?? null;
  } catch {
    return null;
  }
}

async function wikipediaPoster(
  title: string,
  lang: "es" | "en"
): Promise<string | null> {
  try {
    const search = await fetch(
      `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch=${encodeURIComponent(title)}`,
      { next: { revalidate: 60 * 60 * 24 * 7 } }
    );

    if (!search.ok) return null;

    const searchData: {
      query?: { search?: Array<{ title?: string }> };
    } = await search.json();

    const page = searchData.query?.search?.[0]?.title;

    if (!page) return null;

    const summary = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page)}`,
      { next: { revalidate: 60 * 60 * 24 * 7 } }
    );

    if (!summary.ok) return null;

    const summaryData: {
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
    } = await summary.json();

    return (
      summaryData.originalimage?.source ??
      summaryData.thumbnail?.source ??
      null
    );
  } catch {
    return null;
  }
}

export async function getFallbackPoster(
  type: "movie" | "tv",
  title: string
): Promise<string | null> {
  if (type === "tv") {
    const fromTvmaze = await tvmazePoster(title);

    if (fromTvmaze) return fromTvmaze;
  }

  const fromWikipediaEs = await wikipediaPoster(title, "es");

  if (fromWikipediaEs) return fromWikipediaEs;

  return wikipediaPoster(title, "en");
}
