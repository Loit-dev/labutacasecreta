import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // TEMPORAL (solo para una prueba de recomendaciones): se permite
      // leer /api/tmdb. Se revierte justo después.
      allow: ["/", "/api/tmdb"],
      // La API no tiene contenido que indexar
      disallow: "/api/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
