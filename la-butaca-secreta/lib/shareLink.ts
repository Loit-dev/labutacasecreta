/**
 * Enlaces para compartir las mismas recomendaciones: /r/movie-101m-102m-103s
 *
 * El código lleva el tipo (movie o tv) y de 1 a 6 títulos con su papel:
 * «m» = recomendación principal, «s» = sorpresa. Solo se aceptan ids
 * numéricos, así que no se puede colar nada raro en la dirección.
 */

export type ShareKindCode = "movie" | "tv";

export type SharedEntry = {
  id: number;
  role: "main" | "surprise";
};

export type SharedSet = {
  type: ShareKindCode;
  entries: SharedEntry[];
};

export const MAX_SHARED = 6;

const ENTRY = /^(\d{1,9})([ms])$/;

export function buildShareCode(
  type: ShareKindCode,
  entries: SharedEntry[]
): string {
  const parts = entries
    .filter(
      (entry) => Number.isInteger(entry.id) && entry.id > 0
    )
    .slice(0, MAX_SHARED)
    .map(
      (entry) =>
        `${entry.id}${entry.role === "surprise" ? "s" : "m"}`
    );

  return [type, ...parts].join("-");
}

export function parseShareCode(code: string): SharedSet | null {
  let decoded = code;

  try {
    decoded = decodeURIComponent(code);
  } catch {
    return null;
  }

  const [type, ...rest] = decoded.split("-");

  if (type !== "movie" && type !== "tv") return null;

  if (rest.length === 0 || rest.length > MAX_SHARED) return null;

  const entries: SharedEntry[] = [];

  for (const part of rest) {
    const match = ENTRY.exec(part);

    if (!match) return null;

    const id = Number(match[1]);

    if (id <= 0) return null;

    // Sin repetir
    if (entries.some((entry) => entry.id === id)) continue;

    entries.push({
      id,
      role: match[2] === "s" ? "surprise" : "main",
    });
  }

  return { type, entries };
}

export function shareUrl(origin: string, code: string): string {
  return `${origin.replace(/\/$/, "")}/r/${code}`;
}
