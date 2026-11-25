/**
 * Igual que Promise.all(items.map(task)), pero sin lanzar más de
 * `limit` peticiones a la vez. Útil contra TMDb u otras APIs con
 * límite de peticiones simultáneas (el calendario y El Canon resuelven
 * decenas/cientos de títulos cada uno).
 */
export async function mapLimited<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;

      out[index] = await task(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );

  return out;
}
