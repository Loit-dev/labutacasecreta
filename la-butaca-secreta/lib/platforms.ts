/**
 * Plataformas entre las que el usuario puede elegir las que tiene.
 * Los ids son los de TMDb (incluyen los planes con anuncios).
 */

export type PlatformKey =
  | "netflix"
  | "prime"
  | "disney"
  | "max"
  | "filmin";

export const PLATFORMS: {
  key: PlatformKey;
  label: string;
  ids: number[];
}[] = [
  { key: "netflix", label: "Netflix", ids: [8, 1796] },
  { key: "prime", label: "Prime Video", ids: [119, 2100] },
  { key: "disney", label: "Disney+", ids: [337] },
  { key: "max", label: "Max", ids: [1899, 384] },
  { key: "filmin", label: "Filmin", ids: [63] },
];

export const ALL_PLATFORM_KEYS = PLATFORMS.map(
  (platform) => platform.key
);

/** Lee «netflix,prime» y devuelve solo claves válidas, sin repetidos. */
export function parsePlatforms(
  value: string | null | undefined
): PlatformKey[] {
  if (!value) return [];

  const wanted = new Set(value.split(","));

  return ALL_PLATFORM_KEYS.filter((key) => wanted.has(key));
}

/**
 * Ids de TMDb de las plataformas elegidas. Si no hay ninguna válida,
 * se usan todas (así nunca nos quedamos sin resultados por un valor raro).
 */
export function providerIdsFor(
  value: string | null | undefined
): number[] {
  const keys = parsePlatforms(value);

  return PLATFORMS.filter(
    (platform) =>
      keys.length === 0 || keys.includes(platform.key)
  ).flatMap((platform) => platform.ids);
}

/** Valor para la URL: vacío si están todas (es lo normal). */
export function serializePlatforms(
  keys: readonly PlatformKey[]
): string {
  const valid = parsePlatforms(keys.join(","));

  return valid.length === 0 ||
    valid.length === ALL_PLATFORM_KEYS.length
    ? ""
    : valid.join(",");
}

const STORAGE_KEY = "lbs:platforms";

export function readPlatforms(): PlatformKey[] {
  try {
    const parsed = parsePlatforms(
      window.localStorage.getItem(STORAGE_KEY)
    );

    return parsed.length > 0 ? parsed : [...ALL_PLATFORM_KEYS];
  } catch {
    return [...ALL_PLATFORM_KEYS];
  }
}

export function savePlatforms(keys: readonly PlatformKey[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, keys.join(","));
  } catch {
    // Sin almacenamiento, la elección vale solo para esta visita
  }
}
