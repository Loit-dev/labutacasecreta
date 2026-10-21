import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Manrope,
} from "next/font/google";

import Analytics from "@/components/layout/Analytics";
import Footer from "@/components/layout/Footer";
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

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
        ${geistMono.variable}
        ${manrope.variable}
        h-full
        antialiased
      `}
    >
      <body className="min-h-full flex flex-col">
        {children}

        <Footer />

        <Analytics />
      </body>
    </html>
  );
}