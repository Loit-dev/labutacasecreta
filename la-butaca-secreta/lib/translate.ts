/**
 * Traducción de repuesto para sinopsis que TMDb solo trae en inglés
 * (títulos poco conocidos sin traducción al español). Usa la API
 * gratuita de MyMemory, sin clave; si falla se deja el texto en inglés.
 */
export async function translateToSpanish(text: string): Promise<string> {
  if (!text) return text;

  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=en|es`,
      { next: { revalidate: 60 * 60 * 24 * 7 } }
    );

    if (!response.ok) return text;

    const data: {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    } = await response.json();

    const translated = data.responseData?.translatedText;

    return translated && data.responseStatus === 200 ? translated : text;
  } catch {
    return text;
  }
}
