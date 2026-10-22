/** Un resultado de /api/search, para el desplegable del buscador. */
export type SearchHit = {
  id: number;
  type: "movie" | "tv";
  title: string;
  year: number | null;
  poster: string | null;
};
