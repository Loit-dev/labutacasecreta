"use client";

import { useEffect, useRef, useState } from "react";

import { supabase } from "@/lib/supabase/client";

/**
 * "Continuar con Google" con el botón oficial de Google (Google Identity
 * Services) en vez de redirigir a Supabase.
 *
 * Con la redirección, la ventana de Google decía "Ir a
 * nepeafrkulgncsoeuhxv.supabase.co". Así el inicio de sesión ocurre en
 * esta misma página: Google enseña nuestro dominio, devuelve un token y
 * se lo pasamos a Supabase (signInWithIdToken). Sin salir de la web, así
 * que tampoco hace falta volver a la página de origen.
 *
 * Requisitos (una vez):
 *   - Google Cloud → Credenciales → el cliente OAuth web → "Orígenes de
 *     JavaScript autorizados": https://www.labutacasecreta.es
 *   - El mismo client ID que ya usa Supabase en Authentication →
 *     Providers → Google.
 *
 * Si el script de Google no carga, `onUnavailable` deja que el
 * formulario enseñe el botón de antes (redirección).
 */

export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
  "764095954662-g7mfm30gi5lu1k8rvr18kkc7kf3mp5lr.apps.googleusercontent.com";

const SCRIPT = "https://accounts.google.com/gsi/client?hl=es";

type CredentialResponse = { credential?: string };

type GoogleId = {
  initialize: (options: Record<string, unknown>) => void;
  renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();

  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("No se pudo cargar Google"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));

  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));

  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function GoogleButton({
  onSignedIn,
  onUnavailable,
  onError,
}: {
  onSignedIn: () => void;
  onUnavailable: () => void;
  onError: (message: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  // Las funciones de quien lo usa pueden cambiar en cada render; Google
  // guarda el callback una sola vez, así que se leen de una ref.
  const handlers = useRef({ onSignedIn, onUnavailable, onError });

  useEffect(() => {
    handlers.current = { onSignedIn, onUnavailable, onError };
  });

  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!window.google?.accounts?.id) handlers.current.onUnavailable();
    }, 6000);

    (async () => {
      try {
        await loadScript();

        const id = window.google?.accounts?.id;

        if (cancelled || !id || !container.current || !supabase) {
          if (!cancelled) handlers.current.onUnavailable();
          return;
        }

        // Google firma el token con el nonce cifrado; Supabase recibe el
        // original y comprueba que coinciden (evita reutilizar tokens).
        const nonce = randomNonce();
        const hashedNonce = await sha256(nonce);

        id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce: hashedNonce,
          ux_mode: "popup",
          use_fedcm_for_button: true,
          callback: async (response: CredentialResponse) => {
            if (!response.credential || !supabase) return;

            setBusy(true);

            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
              nonce,
            });

            setBusy(false);

            if (error) handlers.current.onError(error.message);
            else handlers.current.onSignedIn();
          },
        });

        id.renderButton(container.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "center",
          locale: "es",
          width: Math.min(400, container.current.offsetWidth || 320),
        });

        clearTimeout(timeout);
      } catch {
        if (!cancelled) handlers.current.onUnavailable();
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="flex min-h-[44px] flex-col items-center justify-center">
      <div ref={container} className="flex w-full justify-center" />
      {busy && <p className="mt-2 text-xs text-zinc-400">Entrando…</p>}
    </div>
  );
}
