import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * JSON-LD para que los buscadores entiendan qué es la web sin tener
 * que adivinarlo del HTML. Vivía inline en app/layout.tsx; se separa
 * aquí para tener una única fuente del contenido (y su versión ya
 * serializada, `structuredDataScript`) en vez de reconstruirlo cada
 * vez que algo necesite referenciarlo.
 */
export const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Any",
  inLanguage: "es-ES",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
};

export const structuredDataScript = JSON.stringify(
  structuredData
);
