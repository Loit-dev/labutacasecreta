import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // La API no tiene contenido que indexar
      disallow: ["/api/", "/admin/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
