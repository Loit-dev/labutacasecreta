import type { MetadataRoute } from "next";

import { catalogParams } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Cuándo se generó este sitemap (el sitio se despliega en cada
  // cambio, así que coincide con la última vez que algo cambió de
  // verdad). No hace falta una fecha por página: no hay forma fiable
  // de saber cuándo cambió el contenido de cada una sin más
  // infraestructura, y una fecha inventada sería peor que ninguna.
  const lastModified = new Date();

  const pages = [
    { path: "", priority: 1, changeFrequency: "monthly" as const },
    { path: "/hoy", priority: 0.6, changeFrequency: "monthly" as const },
    {
      path: "/privacidad",
      priority: 0.2,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/aviso-legal",
      priority: 0.2,
      changeFrequency: "monthly" as const,
    },
  ];

  // Páginas SEO de género+plataforma (/pelis/terror/netflix,
  // /series/comedia/prime...): mismo número de combinaciones para
  // pelis y series. Su catálogo subyacente se mueve más que una
  // página legal, así que avisamos a los rastreadores con más
  // frecuencia.
  const catalogPages = catalogParams().flatMap(({ genero, plataforma }) => [
    {
      path: `/pelis/${genero}/${plataforma}`,
      priority: 0.5,
      changeFrequency: "weekly" as const,
    },
    {
      path: `/series/${genero}/${plataforma}`,
      priority: 0.5,
      changeFrequency: "weekly" as const,
    },
  ]);

  return [...pages, ...catalogPages].map(
    ({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency,
      priority,
    })
  );
}
