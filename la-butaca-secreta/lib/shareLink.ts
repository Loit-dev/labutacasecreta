/**
 * Enlaces para compartir las mismas recomendaciones: /r/movie-101m-102m-103s
 *
 * El código lleva el tipo (movie o tv) y de 1 a 6 títulos con su papel:
 * «m» = recomendación principal, «s» = sorpresa. Solo se aceptan ids
 * numéricos, así que no se puede colar nada raro en la dirección.
 *
 * Si las recomendaciones salieron del modo acompañado, el código puede
 * llevar además el porcentaje de coincidencia («c63») y los nombres
 * («n» + letras y números en hexadecimal): /r/movie-101m-102m-103s-c63-n416e61...
 * Los nombres se leen siempre como texto, nunca como código.
 *
 * Si se compartió «sin nombres», en vez de «n...» lleva una «a» suelta
 * (anónimo) y no hay ningún nombre en el enlace.
 */

export type ShareKindCode = "movie" | "tv";

export type SharedEntry = {
  id: number;
  role: "main" | "surprise";
};

export type SharedGroup = {
  names: string[];
  percent: number;
  // Si se compartió con «sin nombres»: no hay que mostrar `names`
  anonymous?: boolean;
};

export type SharedSet = {
  type: ShareKindCode;
  entries: SharedEntry[];
  group?: SharedGroup;
};

export const MAX_SHARED = 6;

export const MAX_GROUP_NAMES = 6;

export const MAX_NAME_LENGTH = 14;

const ENTRY = /^(\d{1,9})([ms])$/;
const PERCENT = /^c(\d{1,3})$/;
const NAMES = /^n([0-9a-f]{2,400})$/;

const SEPARATOR = "|";

/** Deja un nombre en algo seguro: sin saltos, sin separador y corto. */
export function cleanGroupName(name: string): string {
  return name
    .replace(/[\p{C}|]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    .trim();
}

function toHex(text: string): string {
  return [...new TextEncoder().encode(text)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): string | null {
  if (hex.length % 2 !== 0) return null;

  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function buildShareCode(
  type: ShareKindCode,
  entries: SharedEntry[],
  group?: SharedGroup
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

  const extra: string[] = [];

  if (group) {
    const percent = Math.min(
      100,
      Math.max(0, Math.round(group.percent))
    );

    const names = group.names
      .map(cleanGroupName)
      .filter(Boolean)
      .slice(0, MAX_GROUP_NAMES);

    if (Number.isFinite(percent)) extra.push(`c${percent}`);

    // Sin nombres: ni siquiera se meten los de pega ("Persona 1"...)
    // en el enlace, para que no haya nada que mostrar en la página.
    if (group.anonymous) {
      extra.push("a");
    } else if (names.length > 0) {
      extra.push(`n${toHex(names.join(SEPARATOR))}`);
    }
  }

  return [type, ...parts, ...extra].join("-");
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

  if (rest.length === 0) return null;

  const entries: SharedEntry[] = [];

  let percent: number | null = null;
  let names: string[] | null = null;
  let anonymous = false;
  let tokens = 0;

  for (const part of rest) {
    if (part === "a") {
      anonymous = true;
      continue;
    }

    const percentMatch = PERCENT.exec(part);

    if (percentMatch) {
      const value = Number(percentMatch[1]);

      if (percent !== null || value > 100) return null;

      percent = value;
      continue;
    }

    const namesMatch = NAMES.exec(part);

    if (namesMatch) {
      if (names !== null) return null;

      const text = fromHex(namesMatch[1]);

      if (text === null) return null;

      names = text
        .split(SEPARATOR)
        .map(cleanGroupName)
        .filter(Boolean)
        .slice(0, MAX_GROUP_NAMES);

      continue;
    }

    tokens++;

    if (tokens > MAX_SHARED) return null;

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

  if (entries.length === 0) return null;

  const set: SharedSet = { type, entries };

  // Con nombres, o con porcentaje, es de un grupo
  if (percent !== null && (anonymous || (names && names.length > 0))) {
    set.group = anonymous
      ? { names: [], percent, anonymous: true }
      : { names: names ?? [], percent };
  }

  return set;
}

export function shareUrl(origin: string, code: string): string {
  return `${origin.replace(/\/$/, "")}/r/${code}`;
}
