import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // TEMPORAL (solo para una prueba de recomendaciones): se permite
      // leer /api/tmdb al agente de Claude. Se revierte justo después.
      {
        userAgent: "Claude-User",
        allow: ["/", "/api/tmdb"],
      },
      {
        userAgent: "*",
        allow: "/",
        // La API no tiene contenido que indexar
        disallow: "/api/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
