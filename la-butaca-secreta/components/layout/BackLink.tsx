"use client";

import { useRouter } from "next/navigation";

/**
 * "← Volver" de las fichas y páginas secundarias (película, serie,
 * director, actor, Hoy, Buscar, Mi Resumen, catálogo por género...).
 *
 * Antes era un <Link href="/"> fijo: daba igual desde dónde hubieras
 * entrado (buscador, una lista, el perfil de un amigo, otra ficha
 * encadenada...), siempre te mandaba a la portada en vez de a la
 * página anterior real — perdías el sitio exacto en el que estabas.
 *
 * router.back() usa el historial del navegador de verdad, así que
 * vuelve adonde estuvieras. Solo cae a "/" cuando no hay nada atrás
 * en este historial (p. ej. se abrió el enlace directo en una pestaña
 * nueva, desde Google o compartido por alguien) — si no, "volver" no
 * tendría a dónde ir.
 */
export default function BackLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
      className="mb-6 inline-block text-xs font-semibold text-zinc-300 underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      ← Volver
    </button>
  );
}
