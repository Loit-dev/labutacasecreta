"use client";

import { supabase } from "@/lib/supabase/client";

import { VAPID_PUBLIC_KEY } from "./config";

/**
 * Avisos push en el navegador: activarlos/desactivarlos en este
 * dispositivo (guardando la suscripción en push_subscriptions) y pedir
 * al servidor que avise al dueño de una lista (/api/push/notify).
 */

export type PushState =
  | "unsupported" // el navegador no tiene avisos
  | "ios-install" // iPhone/iPad: solo con la web añadida a inicio
  | "denied" // la persona los bloqueó en el navegador
  | "off"
  | "on";

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function supported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));

  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

  return bytes;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function getPushState(): Promise<PushState> {
  if (!supported()) {
    return typeof navigator !== "undefined" && isIos() ? "ios-install" : "unsupported";
  }

  if (Notification.permission === "denied") return "denied";

  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();

    return sub ? "on" : "off";
  } catch {
    return "off";
  }
}

export async function enablePush(userId: string): Promise<PushState> {
  if (!supported() || !supabase) return getPushState();

  const permission = await Notification.requestPermission();

  if (permission !== "granted") return getPushState();

  try {
    const reg = await registration();
    await navigator.serviceWorker.ready;

    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    const json = sub.toJSON();

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: sub.endpoint,
        user_id: userId,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      await sub.unsubscribe();
      return "off";
    }

    return "on";
  } catch (error) {
    console.error("No se pudieron activar los avisos:", error);

    return getPushState();
  }
}

export async function disablePush(): Promise<PushState> {
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();

    if (sub) {
      await supabase?.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
  } catch {
    // Si falla, como mucho queda una suscripción que el servidor
    // borrará la próxima vez que el servicio de avisos la rechace.
  }

  return getPushState();
}

/**
 * Tras dar "me gusta" o comentar en una lista de otra persona: pide al
 * servidor que le avise. No espera ni falla en voz alta: si no sale,
 * la notificación sigue estando dentro de la web.
 */
export function notifyListOwner(kind: "like" | "comment", listId: string): void {
  if (!supabase) return;

  supabase.auth
    .getSession()
    .then(({ data }) => {
      const token = data.session?.access_token;

      if (!token) return;

      return fetch("/api/push/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ kind, listId }),
        keepalive: true,
      });
    })
    .catch(() => {});
}
