// Tipo compartido entre app/api/canon/route.ts (que lo produce,
// resolviendo data/canon/canon250.ts contra TMDb) y CanonScreen.tsx
// (que lo consume) — en un sitio aparte para no importar un route
// handler del servidor desde un componente cliente.
export type CanonResult = {
  title: string;
  year: number;
  decade: number;
  director: string;
  // null cuando TMDb no encuentra nada para ese título (no debería
  // pasar con la lista ya contrastada, pero por si acaso).
  tmdbId: number | null;
  poster: string | null;
  rating: number;
};
