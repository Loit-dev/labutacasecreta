/**
 * Datos generales del sitio, en un solo lugar.
 *
 * Variables de entorno opcionales (Vercel → Settings → Environment Variables):
 * - NEXT_PUBLIC_SITE_URL      dirección pública (si usas dominio propio)
 * - NEXT_PUBLIC_CONTACT_EMAIL correo de contacto que se muestra en las
 *                             páginas de privacidad y aviso legal
 */

export const SITE_NAME = "La Butaca Secreta";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://labutacasecreta.vercel.app";

export const SITE_TAGLINE =
  "Tres películas o series para decidir qué ver";

export const SITE_DESCRIPTION =
  "Cuéntame qué te apetece y te recomiendo solo tres películas o series disponibles en Netflix, Prime Video, Disney+, Max y Filmin. Sin listas infinitas: te ayudo a decidir.";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL;

// Fecha de la última revisión de los textos legales
export const LEGAL_UPDATED = "26 de octubre de 2026";
