/**
 * Marca de "hasta cuándo ya se han visto" los avisos de nuevo
 * seguidor (lo único no accionable, así que no tiene fila propia que
 * borrar: las solicitudes y recomendaciones se "consumen" al
 * aceptar/rechazar o descartar, pero un seguidor nuevo no se puede
 * "aceptar"). Por dispositivo, igual que watchlist.ts/rejected.ts.
 */

const KEY = "lbs:notifications:lastSeenAt";

export function getNotificationsLastSeenAt(): number {
  try {
    const raw = window.localStorage.getItem(KEY);
    const n = raw ? Number(raw) : 0;

    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function markNotificationsSeenNow(): void {
  try {
    window.localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // localStorage bloqueado: no pasa nada, solo se pierde la marca.
  }
}
