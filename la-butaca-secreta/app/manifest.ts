import type { MetadataRoute } from "next";

import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/site";

// Permite «Instalar» la web como una app (Android, escritorio) o
// «Añadir a pantalla de inicio» (iPhone), con su icono y sin barra del navegador.
//
// El contenido es 100% estático (no depende de la petición), así que lo
// forzamos a generarse en build time: Vercel lo sirve desde la CDN en vez
// de invocar una función en cada carga (evitaba un cold start de ~2,5s).
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} · ${SITE_TAGLINE}`,
    short_name: "Butaca Secreta",
    description: SITE_DESCRIPTION,
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    categories: ["entertainment", "lifestyle"],
    // Acceso directo al mantener pulsado el icono, una vez instalada
    // (Android/escritorio); salta el cuestionario y va a 3 propuestas.
    shortcuts: [
      {
        name: "La carta de hoy",
        short_name: "Hoy",
        description: "3 propuestas al momento, sin cuestionario",
        url: "/hoy",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
