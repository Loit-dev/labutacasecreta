import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Cuándo se generó este sitemap (el sitio se despliega en cada
  // cambio, así que coincide con la última vez que algo cambió de
  // verdad). No hace falta una fecha por página: no hay forma fiable
  // de saber cuándo cambió el contenido de cada una sin más
  // infraestructura, y una fecha inventada sería peor que ninguna.
  const lastModified = new Date();

  const pages = [
    { path: "", priority: 1 },
    { path: "/hoy", priority: 0.6 },
    { path: "/privacidad", priority: 0.2 },
    { path: "/aviso-legal", priority: 0.2 },
  ];

  return pages.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority,
  }));
}
