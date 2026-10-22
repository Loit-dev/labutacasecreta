/**
 * Límite de peticiones sencillo, por IP, en memoria.
 *
 * Nota: Vercel ejecuta cada función en instancias que pueden arrancar en
 * frío o repartirse entre varias, así que este límite es "por instancia"
 * y no uno estricto y global. Aun así, frena los abusos más evidentes
 * (bucles, scraping) sin tener que montar un almacén externo (Redis/KV).
 * Si el tráfico crece y hace falta un límite exacto entre instancias,
 * la vía recomendada es Vercel KV o Upstash Ratelimit.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

// Evita que el mapa crezca sin límite en una instancia de larga vida
const MAX_TRACKED_KEYS = 5000;

/**
 * true si `key` ha superado `limit` peticiones en los últimos
 * `windowMs` milisegundos (y registra esta petición).
 */
export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();

    buckets.set(key, { count: 1, resetAt: now + windowMs });

    return false;
  }

  bucket.count += 1;

  return bucket.count > limit;
}

/** IP del cliente a partir de las cabeceras que pone Vercel. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");

  return forwarded?.split(",")[0]?.trim() || "anon";
}
