import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad (Lighthouse → Best Practices → Trust and
 * Safety).
 *
 * La CSP se queda deliberadamente permisiva en `script-src`
 * ('unsafe-inline'), no restrictiva por nonce/hash: el App Router de
 * Next.js inyecta datos de cada página como <script> inline para la
 * hidratación (RSC streaming) con contenido distinto en cada petición,
 * así que una CSP estricta sin nonce los bloquearía y rompería la
 * interactividad del sitio entero; y un nonce por petición obligaría a
 * renderizar cada página de forma dinámica, perdiendo el HTML estático
 * servido desde CDN que hoy nos da el rendimiento.
 *
 * Con esto no se cierra del todo el aviso "Ensure CSP is effective
 * against XSS" de Lighthouse (pide no usar 'unsafe-inline'), pero sí
 * se gana lo demás sin ningún riesgo: aislamiento de origen (COOP),
 * protección contra clickjacking (frame-ancestors + X-Frame-Options),
 * y bloqueo de vectores como <base> o formularios hacia otro origen.
 */
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data:`,
  `font-src 'self'`,
  `connect-src 'self'`,
  // El botón "Ver tráiler" embebe un <iframe> de YouTube
  // (DetailsModal.tsx); sin esto, default-src 'self' lo bloquearía.
  `frame-src https://www.youtube-nocookie.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
