"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para el navegador (login + lectura/escritura con
 * las políticas de RLS del usuario autenticado).
 *
 * Las dos variables son públicas por diseño (se exponen en el bundle
 * del navegador): la URL del proyecto y la clave "anon/publishable".
 * La seguridad real la ponen las políticas de Row Level Security en
 * Supabase, no el secreto de esta clave.
 *
 * Si no están configuradas (p. ej. en un despliegue que aún no las
 * tiene en Vercel → Settings → Environment Variables), `supabase` es
 * `null` y el resto de la app lo trata como "sin login disponible"
 * en vez de romper el build o la página.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
