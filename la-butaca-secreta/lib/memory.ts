/**
 * Memoria ligera entre visitas: qué suele pedir esta persona.
 *
 * Se guarda solo en su navegador (localStorage), igual que «Mi lista»
 * o «vistos». Sirve para dos cosas:
 * - Precargar (o saltarse) alguna pregunta del cuestionario cuando ya
 *   hay bastante seguridad sobre lo que suele elegir.
 * - Dar un perfil de partida al modo rápido («Butaca Exprés»), que
 *   no pregunta nada.
 *
 * No hay cuentas ni se envía nada a ningún servidor: solo cuenta,
 * dentro de este navegador, cuántas veces se ha terminado el
 * cuestionario con cada género, ánimo o tipo de contenido.
 */

import { ContentType, UserProfile } from "./conversation/types";

type CountMap = Partial<Record<string, number>>;

export type Memory = {
  genreCounts: CountMap;
  moodCounts: CountMap;
  contentTypeCounts: CountMap;
  completions: number;
  lastProfile: UserProfile | null;
  updatedAt: number;
};

const KEY = "lbs:memory";

// Tras tantas veces completado, dejamos de sumar (evita que una sola
// racha antigua pese para siempre y nunca se pueda «mover» el gusto)
const MAX_COMPLETIONS = 200;

function empty(): Memory {
  return {
    genreCounts: {},
    moodCounts: {},
    contentTypeCounts: {},
    completions: 0,
    lastProfile: null,
    updatedAt: 0,
  };
}

function isCountMap(value: unknown): value is CountMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.entries(value as Record<string, unknown>).every(
    ([key, count]) =>
      typeof key === "string" &&
      typeof count === "number" &&
      Number.isFinite(count) &&
      count >= 0
  );
}

function isProfileLike(value: unknown): value is UserProfile {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** Lee la memoria guardada, descartando lo que no tenga la forma esperada. */
export function readMemory(): Memory {
  try {
    const raw = window.localStorage.getItem(KEY);

    if (!raw) return empty();

    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") return empty();

    const p = parsed as Record<string, unknown>;

    return {
      genreCounts: isCountMap(p.genreCounts) ? p.genreCounts : {},
      moodCounts: isCountMap(p.moodCounts) ? p.moodCounts : {},
      contentTypeCounts: isCountMap(p.contentTypeCounts)
        ? p.contentTypeCounts
        : {},
      completions:
        Number.isInteger(p.completions) && (p.completions as number) >= 0
          ? (p.completions as number)
          : 0,
      lastProfile: isProfileLike(p.lastProfile) ? p.lastProfile : null,
      updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : 0,
    };
  } catch {
    return empty();
  }
}

function write(memory: Memory) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // Sin localStorage (modo privado, bloqueado...): no se guarda, pero
    // el cuestionario y el modo rápido siguen funcionando sin memoria.
  }
}

function bump(counts: CountMap, key: string | undefined): CountMap {
  if (!key) return counts;

  return { ...counts, [key]: (counts[key] ?? 0) + 1 };
}

/** Se llama al terminar el cuestionario (cuando ya hay recomendaciones). */
export function recordCompletion(profile: UserProfile) {
  const memory = readMemory();

  write({
    genreCounts: bump(memory.genreCounts, profile.preferredGenre),
    moodCounts: bump(memory.moodCounts, profile.mood),
    contentTypeCounts: bump(memory.contentTypeCounts, profile.contentType),
    completions: Math.min(memory.completions + 1, MAX_COMPLETIONS),
    lastProfile: profile,
    updatedAt: Date.now(),
  });
}

/** La clave más repetida, o nada si no llega a los mínimos pedidos. */
function topKey(
  counts: CountMap,
  { minCount = 1, minShare = 0 }: { minCount?: number; minShare?: number } = {}
): string | undefined {
  const entries = Object.entries(counts).filter(
    (entry): entry is [string, number] => typeof entry[1] === "number"
  );

  if (entries.length === 0) return undefined;

  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  const [key, count] = entries.sort((a, b) => b[1] - a[1])[0];

  if (count < minCount) return undefined;

  if (total > 0 && count / total < minShare) return undefined;

  return key;
}

export function hasMemory(): boolean {
  return readMemory().completions > 0;
}

/**
 * Lo que sabemos con bastante seguridad, para saltarnos la pregunta en
 * el cuestionario: hace falta que se haya repetido al menos dos veces
 * y que sea mayoría clara (si no, mejor preguntar y no dar por hecho).
 */
export function confidentDefaults(): Pick<
  UserProfile,
  "preferredGenre" | "mood"
> {
  const memory = readMemory();

  return {
    preferredGenre: topKey(memory.genreCounts, {
      minCount: 2,
      minShare: 0.6,
    }),
    mood: topKey(memory.moodCounts, { minCount: 2, minShare: 0.6 }),
  };
}

/**
 * Perfil de partida para el modo rápido: la mejor suposición aunque no
 * sea mayoría clara (aquí no hay pregunta que saltarse, así que algo
 * de margen es mejor que nada). `null` si todavía no hay historial.
 */
export function inferredProfile(): UserProfile | null {
  const memory = readMemory();

  if (memory.completions === 0) return null;

  const contentType =
    (topKey(memory.contentTypeCounts) as ContentType | undefined) ??
    memory.lastProfile?.contentType;

  return {
    contentType: contentType ?? "movie",
    preferredGenre: topKey(memory.genreCounts),
    mood: topKey(memory.moodCounts),
    company: "alone",
    platforms: memory.lastProfile?.platforms,
  };
}

export function clearMemory() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nada que borrar
  }
}
