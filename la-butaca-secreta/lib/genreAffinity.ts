/**
 * Fase 3: lo que valoras o rechazas deja huella duradera en los
 * géneros, no solo durante la sesión (antes, "No me apetece" se
 * olvidaba al cerrar la pestaña).
 *
 * Dos listas por tipo (película/serie), cada una con el id de género
 * repetido una vez por cada vez que ha pesado — así una penalización o
 * un empujón repetidos cuentan más que uno aislado (lib/recommendation/
 * scoring/feedback.ts y affinity.ts funcionan igual: cuentan apariciones).
 *
 * Se guardan solo en este navegador (igual que lib/viewed.ts y
 * lib/rating.ts); si hay cuenta, Supabase guarda además el detalle de
 * cada valoración y rechazo (lib/supabase/watched.ts,
 * lib/supabase/rejections.ts), pero el cálculo de recomendaciones usa
 * siempre esta copia local, que es inmediata y no depende de red.
 */

const MAX_ENTRIES = 300;

function avoidKey(type: string) {
  return `lbs:avoidGenres:${type}`;
}

function boostKey(type: string) {
  return `lbs:boostGenres:${type}`;
}

function readList(key: string): number[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? parsed.filter(
          (id): id is number => Number.isInteger(id) && id > 0
        )
      : [];
  } catch {
    return [];
  }
}

function appendList(key: string, ids: number[]) {
  if (ids.length === 0) return;

  try {
    const next = [...readList(key), ...ids].slice(-MAX_ENTRIES);

    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Si no se puede guardar, solo se pierde el aprendizaje de este género
  }
}

// "No me apetece", o valorar con 1-2 estrellas: ese género pesa menos
// en próximas búsquedas (ver scoreFeedback).
export function recordAvoid(type: string, genreIds: number[]) {
  appendList(avoidKey(type), genreIds);
}

// Valorar con 4-5 estrellas: ese género pesa un poco más (ver
// scoreAffinity).
export function recordBoost(type: string, genreIds: number[]) {
  appendList(boostKey(type), genreIds);
}

export function readAvoidGenres(type: string): number[] {
  return readList(avoidKey(type));
}

export function readBoostGenres(type: string): number[] {
  return readList(boostKey(type));
}

// "Olvidar lo que he aprendido de tus gustos", reversible desde el
// perfil: vuelve a puntuar como si no se hubiera valorado ni
// rechazado nada todavía (las vistas y valoraciones en sí no se
// tocan, solo su efecto en el género).
export function resetGenreAffinity(type: string) {
  try {
    window.localStorage.removeItem(avoidKey(type));
    window.localStorage.removeItem(boostKey(type));
  } catch {
    // Nada que borrar
  }
}
