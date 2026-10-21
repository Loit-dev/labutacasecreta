import { SpeedInsights as VercelSpeedInsights } from '@vercel/speed-insights/next';

/**
 * Vercel Speed Insights: mide cuánto tarda la web en cargar en los
 * dispositivos reales (sin cookies ni datos personales).
 *
 * Usa el paquete oficial `@vercel/speed-insights` para Next.js.
 * Solo funciona si está activado en Vercel
 * (proyecto → Speed Insights → Enable); si no, no pasa nada.
 */
export default function SpeedInsights() {
  return <VercelSpeedInsights />;
}
