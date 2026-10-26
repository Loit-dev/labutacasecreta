import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Geist, Manrope } from "next/font/google";

import Analytics from "@/components/layout/Analytics";
import Footer from "@/components/layout/Footer";
import SpeedInsights from "@/components/layout/SpeedInsights";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";
import { structuredDataScript } from "@/lib/structuredData";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

// Tipografía de marquesina (titulares "entrada de cine"): solo para
// titulares grandes y rótulos cortos, nunca para texto de lectura. Ver
// DECISIONS.md, "Entrada de cine: tipografía de marquesina" y
// docs/BRAND.md.
const bebasNeue = Bebas_Neue({
  variable: "--font-marquee",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${SITE_NAME} · ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },

  description: SITE_DESCRIPTION,

  applicationName: SITE_NAME,

  keywords: [
    "qué ver hoy",
    "recomendaciones de películas",
    "recomendaciones de series",
    "Netflix",
    "Prime Video",
    "Disney+",
    "Max",
    "Filmin",
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: SITE_NAME,
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: "/",
  },

  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },

  robots: {
    index: true,
    follow: true,
  },

  // Icono al «Añadir a pantalla de inicio» (iPhone)
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },

  appleWebApp: {
    capable: true,
    title: "Butaca Secreta",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`
        ${geistSans.variable}
        ${manrope.variable}
        ${bebasNeue.variable}
        h-full
        antialiased
      `}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          // Datos fijos y de confianza (sin nada que venga del
          // usuario), así que no hay riesgo de inyección aquí.
          dangerouslySetInnerHTML={{
            __html: structuredDataScript,
          }}
        />

        {children}

        <Footer />

        <Analytics />

        <SpeedInsights />
      </body>
    </html>
  );
}