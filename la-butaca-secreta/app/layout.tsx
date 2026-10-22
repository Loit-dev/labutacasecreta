import type { Metadata, Viewport } from "next";
import { Geist, Manrope } from "next/font/google";

import Analytics from "@/components/layout/Analytics";
import Footer from "@/components/layout/Footer";
import SpeedInsights from "@/components/layout/SpeedInsights";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
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

// Para que los buscadores (Google...) entiendan qué es la web sin
// tener que adivinarlo del HTML
const structuredData = {
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
            __html: JSON.stringify(structuredData),
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