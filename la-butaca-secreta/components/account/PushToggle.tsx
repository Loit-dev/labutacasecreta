"use client";

import { useEffect, useState } from "react";

import {
  disablePush,
  enablePush,
  getPushState,
  type PushState,
} from "@/lib/push/client";

/**
 * "Avisos en este dispositivo": activa los avisos push ("me gusta" y
 * comentarios en tus listas) en el móvil u ordenador desde el que se
 * pulsa. Va en la ventana de Notificaciones.
 */
export default function PushToggle({ userId }: { userId: string }) {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPushState().then(setState);
  }, []);

  if (state === null || state === "unsupported") return null;

  async function toggle() {
    setBusy(true);
    setState(state === "on" ? await disablePush() : await enablePush(userId));
    setBusy(false);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">
          Avisos en este dispositivo
        </p>
        <p className="text-xs text-zinc-400">
          {state === "on" &&
            "Te avisamos cuando den me gusta o comenten en tus listas."}
          {state === "off" &&
            "Recibe un aviso cuando den me gusta o comenten en tus listas."}
          {state === "denied" &&
            "Los tienes bloqueados: actívalos en los ajustes del navegador para esta web."}
          {state === "ios-install" &&
            "En iPhone: comparte → «Añadir a pantalla de inicio», abre la web desde ese icono y actívalos aquí."}
        </p>
      </div>

      {(state === "on" || state === "off") && (
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          aria-pressed={state === "on"}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold transition-opacity disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
            state === "on"
              ? "border border-white/25 text-zinc-200"
              : "bg-amber-300 text-black"
          }`}
        >
          {busy ? "…" : state === "on" ? "Desactivar" : "Activar"}
        </button>
      )}
    </div>
  );
}
