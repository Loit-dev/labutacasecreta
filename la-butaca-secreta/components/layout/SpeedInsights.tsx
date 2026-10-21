import Script from "next/script";

/**
 * Vercel Speed Insights: mide cuánto tarda la web en cargar en los
 * dispositivos reales (sin cookies ni datos personales).
 *
 * Es lo mismo que hace el paquete oficial `@vercel/speed-insights`,
 * sin dependencia nueva. Solo funciona si está activado en Vercel
 * (proyecto → Speed Insights → Enable); si no, no pasa nada.
 */
export default function SpeedInsights() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <Script
      id="vercel-speed-insights"
      src="/_vercel/speed-insights/script.js"
      strategy="afterInteractive"
    />
  );
}
