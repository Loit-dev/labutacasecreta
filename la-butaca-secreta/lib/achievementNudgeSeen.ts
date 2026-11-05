/**
 * Marca de "último aviso de logros mostrado", para el límite de 1 al
 * día (ver lib/achievements/nudge.ts). Por dispositivo, igual patrón
 * que notificationsSeen.ts.
 */

const KEY = "lbs:achievements:lastNudgeAt";
const MIN_GAP_MS = 20 * 60 * 60 * 1000; // ~20h, para no depender de la hora exacta del día anterior

export function canShowAchievementNudgeNow(): boolean {
  try {
    const raw = window.localStorage.getItem(KEY);
    const last = raw ? Number(raw) : 0;

    return !Number.isFinite(last) || Date.now() - last > MIN_GAP_MS;
  } catch {
    return true;
  }
}

export function markAchievementNudgeShownNow(): void {
  try {
    window.localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // localStorage bloqueado: no pasa nada, solo se pierde el límite de frecuencia.
  }
}
