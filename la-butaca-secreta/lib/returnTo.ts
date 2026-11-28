// Volver a la página desde la que se entró a iniciar sesión.
//
// Google (y el enlace del correo) siempre devuelven a la portada: así
// no hay que dar de alta cada dirección en Supabase. Antes de salir se
// apunta aquí a dónde volver, y al llegar con la sesión iniciada
// (components/layout/ReturnAfterLogin.tsx) se lleva allí. Se guarda en
// localStorage (el enlace del correo puede abrirse en otra pestaña) y
// caduca a los 15 minutos.

const KEY = "lbs:volver";
const TTL = 15 * 60 * 1000;

/** Solo rutas de esta web: "/algo", nunca "//otra-web.com" ni URLs. */
export function safePath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/entrar")) return null;

  return value;
}

/** /entrar?volver=<ruta actual> */
export function loginHref(path: string | null | undefined): string {
  const safe = safePath(path);

  return safe && safe !== "/"
    ? `/entrar?volver=${encodeURIComponent(safe)}`
    : "/entrar";
}

export function saveReturnTo(path: string | null | undefined): void {
  const safe = safePath(path);

  try {
    if (safe && safe !== "/") {
      localStorage.setItem(KEY, JSON.stringify({ path: safe, at: Date.now() }));
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {
    // Sin almacenamiento: se vuelve a la portada, como antes.
  }
}

/** Devuelve (y borra) la ruta pendiente, si la hay y no ha caducado. */
export function takeReturnTo(): string | null {
  try {
    const raw = localStorage.getItem(KEY);

    if (!raw) return null;

    localStorage.removeItem(KEY);

    const { path, at } = JSON.parse(raw) as { path?: string; at?: number };

    if (typeof at !== "number" || Date.now() - at > TTL) return null;

    return safePath(path);
  } catch {
    return null;
  }
}
