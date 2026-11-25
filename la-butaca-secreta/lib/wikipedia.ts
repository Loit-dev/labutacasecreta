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

type WikiWikitextResponse = {
  parse?: { wikitext?: string | { "*": string } };
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

/**
 * Se pide el wikitext (fuente en bruto) en vez del HTML ya renderizado:
 * así es mucho más fácil quedarse solo con el párrafo introductorio
 * de la sección, sin arrastrar el índice que Wikipedia antepone a
 * secciones con subsecciones, ni los pies de foto o tablas, que en el
 * HTML renderizado quedan todos mezclados como texto plano.
 */
function leadParagraphOf(wikitext: string): string {
  // Quita la línea de cabecera ("== Producción ==") si viene incluida.
  let body = wikitext.replace(/^\s*=+[^=\n]+=+[ \t]*\n/, "");

  // Corta justo antes de la primera subsección (p. ej. "=== Guion
  // ==="), para quedarnos solo con el párrafo introductorio y no con
  // toda la sección entera (que puede ser larguísima).
  const subsectionAt = body.search(/\n[ \t]*=+[^=\n]+=+[ \t]*\n/);

  if (subsectionAt !== -1) {
    body = body.slice(0, subsectionAt);
  }

  return body;
}

function stripWikitext(wikitext: string): string {
  return (
    wikitext
      // Comentarios y referencias (<ref>texto</ref> o <ref .../>).
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<ref[^>]*\/>/gi, "")
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
      // Plantillas {{cita|...}}, {{esd|...}}, etc. Dos pasadas para
      // resolver una plantilla anidada dentro de otra (dos niveles
      // bastan para el caso normal; lo que quede más anidado se
      // limpia igualmente al quitar las llaves sueltas al final).
      .replace(/\{\{[^{}]*\}\}/g, "")
      .replace(/\{\{[^{}]*\}\}/g, "")
      // Archivos/imágenes incrustados, con su pie de foto. El pie
      // suele llevar enlaces anidados (p. ej. "[[Archivo:Foo.jpg|thumb|
      // [[Christopher Nolan|Nolan]] dirigiendo...]]"), así que hace
      // falta admitir un nivel de corchetes dentro antes de cerrar,
      // si no el "]]" del enlace interno corta el emparejamiento
      // demasiado pronto y deja el resto del pie de foto como texto
      // suelto.
      .replace(
        /\[\[(?:Archivo|File|Imagen|Image):(?:[^[\]]|\[\[[^\]]*\]\])*\]\]/gi,
        ""
      )
      // Enlaces internos [[A|B]] → B, [[A]] → A.
      .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")
      .replace(/\[\[([^\]]*)\]\]/g, "$1")
      // Negrita/cursiva wiki.
      .replace(/'{2,5}/g, "")
      // Cualquier resto de etiqueta HTML o llave/corchete suelto.
      .replace(/<[^>]+>/g, " ")
      .replace(/[{}[\]]/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
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

    const wikitextData = await wikiFetch<WikiWikitextResponse>({
      action: "parse",
      pageid: String(article.pageid),
      prop: "wikitext",
      section: match.index,
    });

    const raw = wikitextData?.parse?.wikitext;
    const rawWikitext = typeof raw === "string" ? raw : raw?.["*"];

    if (!rawWikitext) return null;

    const text = stripWikitext(leadParagraphOf(rawWikitext)).slice(
      0,
      MAX_TEXT_LENGTH
    );

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
