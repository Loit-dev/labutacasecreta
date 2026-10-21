"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

/**
 * Botón «Instalar app». En Android y ordenador usa el aviso del
 * navegador; en iPhone (Safari) explica el gesto manual. Si la web ya
 * está instalada, o el navegador no puede instalarla, no se muestra.
 */
export default function InstallButton() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    if (standalone) return;

    const ua = navigator.userAgent;
    const isIos =
      /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIos(isIos);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };

    const onInstalled = () => setEvent(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!event && !ios) return null;

  const onClick = async () => {
    if (event) {
      await event.prompt();
      setEvent(null);
    } else {
      setHint((v) => !v);
    }
  };

  return (
    <div className="mb-3 mt-1">
      <button
        onClick={onClick}
        aria-expanded={event ? undefined : hint}
        className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:border-red-500/50 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span aria-hidden="true">📲</span> Instalar app
      </button>

      {hint && (
        <p role="status" className="mt-2 text-zinc-300">
          Pulsa <strong>Compartir</strong> y después{" "}
          <strong>Añadir a pantalla de inicio</strong>.
        </p>
      )}
    </div>
  );
}
