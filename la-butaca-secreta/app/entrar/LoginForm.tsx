"use client";

import { useState, type FormEvent } from "react";

import { supabase } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [googleError, setGoogleError] = useState<string | null>(null);

  if (!supabase) {
    return (
      <p className="rounded-2xl border border-zinc-700/80 bg-zinc-900/60 px-4 py-4 text-center text-sm text-zinc-400">
        El login todavía no está configurado en este despliegue.
      </p>
    );
  }

  async function withGoogle() {
    setGoogleError(null);

    track("mode_selected", { mode: "login_google" });

    const { error } = await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

    if (error) {
      setGoogleError(
        "Google no está disponible todavía en este login. Prueba con tu email."
      );
    }
  }

  async function withEmail(event: FormEvent) {
    event.preventDefault();

    const clean = email.trim();
    if (!clean) return;

    setStatus("sending");

    track("mode_selected", { mode: "login_email" });

    const { error } = await supabase!.auth.signInWithOtp({
      email: clean,
      options: { emailRedirectTo: window.location.origin },
    });

    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-zinc-700/80 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 px-5 py-6 text-center shadow-[0_8px_20px_rgba(0,0,0,0.45)]">
        <p className="text-lg font-semibold text-white">
          <span aria-hidden="true">📬</span> Revisa tu correo
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Te hemos mandado un enlace a <strong className="text-white">{email}</strong>.
          Ábrelo desde este mismo dispositivo para entrar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={withGoogle}
        className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-700/80 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span aria-hidden="true" className="text-red-500 font-bold">
          G
        </span>
        Continuar con Google
      </button>

      {googleError && (
        <p className="text-center text-xs text-amber-400" role="alert">
          {googleError}
        </p>
      )}

      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-zinc-500">o con tu email</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={withEmail} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          autoComplete="email"
          className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        />

        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {status === "sending"
            ? "Enviando…"
            : "Enviarme el enlace mágico"}
        </button>

        {status === "error" && (
          <p className="text-center text-xs text-red-400" role="alert">
            No he podido enviar el enlace. Prueba otra vez en un momento.
          </p>
        )}

        <p className="text-center text-xs text-zinc-500">
          Sin contraseñas. Te mandamos un enlace para entrar.
        </p>
      </form>
    </div>
  );
}
