import Script from "next/script";

/**
 * Vercel Web Analytics: cuenta visitas sin cookies ni datos personales.
 *
 * Es lo mismo que hace el paquete oficial `@vercel/analytics`, pero sin
 * dependencia nueva. Solo funciona si está activado en Vercel
 * (proyecto → Analytics → Enable); si no, la petición del script
 * simplemente no encuentra nada y no pasa nada.
 */
export default function Analytics() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <Script
      id="vercel-analytics"
      src="/_vercel/insights/script.js"
      strategy="afterInteractive"
    />
  );
}
