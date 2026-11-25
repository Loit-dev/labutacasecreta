/**
 * "Curiosidades de ficha": datos de rodaje/producción reales para la
 * ficha de película (app/pelicula/[id]).
 *
 * No existe ninguna API gratuita de "trivia" curada para cine (la de
 * IMDb es propia y no se puede reutilizar sin permiso; TMDb no trae
 * ese dato). La única fuente libre, documentada y sin clave es la API
 * pública de Wikipedia (MediaWiki Action API, CC BY-SA): se busca el
 * artículo del título en es.wikipedia y, si existe, se saca el texto
 * de su sección de "Producción"/"Rodaje" (algunos artículos, sobre
 * todo de anime o series menores, la llaman "Curiosidades"; en
 * Wikipedia en español esa sección no siempre existe — su propia
 * política desaconseja listas sueltas de curiosidades sin fuente), y
 * se enlaza al artículo para que quien quiera pueda leer más.
 *
 * Si el artículo no existe, no tiene esa sección, o la API falla,
 * se devuelve null: la ficha simplemente no muestra el bloque, en vez
 * de inventar o rellenar con algo genérico.
 */

const WIKI_API = "https://es.wikipedia.org/w/api.php";

// Cabeceras de sección que de verdad traen dato de rodaje/producción
// o curiosidades, en vez de reparto, taquilla o recepción.
const SECTION_NEEDLES = [
  "curiosidades",
  "datos curiosos",
  "trivia",
  "producción",
  "rodaje",
];

// Para no colarnos con un artículo que no es el de la película (un
// libro, una serie homónima...), o con una sección casi vacía.
const MIN_TEXT_LENGTH = 60;
const MAX_TEXT_LENGTH = 650;

export type ProductionTrivia = {
  heading: string;
  text: string;
  sourceUrl: string;
};

type WikiSearchResponse = {
  query?: { search?: { title: string; pageid: number }[] };
};

type WikiSectionsResponse = {
  parse?: { sections?: { index: string; line: string }[] };
};

type WikiTextResponse = {
  parse?: { text?: string | { "*": string } };
};

async function wikiFetch<T>(params: Record<string, string>): Promise<T> {
  const url = `${WIKI_API}?${new URLSearchParams({
    format: "json",
    formatversion: "2",
    origin: "*",
    ...params,
  }).toString()}`;

  const response = await fetch(url, {
    // Mismo horizonte de caché que el resto de la ficha: no hace
    // falta pedir esto en cada visita.
    next: { revalidate: 21600 },
    headers: {
      // La propia Wikimedia pide identificarse con un user-agent
      // descriptivo en vez del genérico por defecto.
      "User-Agent": "LaButacaSecreta/1.0 (labutacasecreta.vercel.app)",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikipedia respondió ${response.status}`);
  }

  return response.json();
}

function stripMarkup(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<table[\s\S]*?<\/table>/gi, "")
    .replace(/<sup[\s\S]*?<\/sup>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\s*editar\s*\]/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function findArticle(
  title: string,
  year?: number
): Promise<{ title: string; pageid: number } | null> {
  // Primero con el año (desambigua remakes/homónimos), si no hay
  // resultado se prueba sin él.
  const queries = year
    ? [`${title} película ${year}`, `${title} película`]
    : [`${title} película`];

  for (const query of queries) {
    const data = await wikiFetch<WikiSearchResponse>({
      action: "query",
      list: "search",
      srsearch: query,
      srlimit: "1",
    });

    const hit = data?.query?.search?.[0];

    if (hit?.pageid) {
      return { title: hit.title, pageid: hit.pageid };
    }
  }

  return null;
}

export async function getProductionTrivia(
  title: string,
  year?: number
): Promise<ProductionTrivia | null> {
  try {
    const article = await findArticle(title, year);

    if (!article) return null;

    const sectionsData = await wikiFetch<WikiSectionsResponse>({
      action: "parse",
      pageid: String(article.pageid),
      prop: "sections",
    });

    const sections: { index: string; line: string }[] =
      sectionsData?.parse?.sections ?? [];

    const match = sections.find((section) =>
      SECTION_NEEDLES.some((needle) =>
        section.line.toLowerCase().includes(needle)
      )
    );

    if (!match) return null;

    const textData = await wikiFetch<WikiTextResponse>({
      action: "parse",
      pageid: String(article.pageid),
      prop: "text",
      section: match.index,
    });

    const html = textData?.parse?.text;
    const rawHtml = typeof html === "string" ? html : html?.["*"];

    if (!rawHtml) return null;

    const text = stripMarkup(rawHtml).slice(0, MAX_TEXT_LENGTH).trim();

    if (text.length < MIN_TEXT_LENGTH) return null;

    return {
      heading: match.line,
      text,
      sourceUrl: `https://es.wikipedia.org/wiki/${encodeURIComponent(
        article.title.replace(/ /g, "_")
      )}`,
    };
  } catch (error) {
    console.error("No se pudo obtener curiosidades de Wikipedia:", error);

    return null;
  }
}
