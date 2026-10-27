"use client";

import { useState } from "react";

import { createProfile, type ProfileRow } from "@/lib/supabase/profiles";

type Props = {
  userId: string;
  onCreated: (profile: ProfileRow) => void;
};

/** Paso previo a usar "Amigos": elegir el @usuario público, una sola vez. */
export default function UsernameSetup({ userId, onCreated }: Props) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await createProfile(userId, value);

    setSaving(false);

    if (result.ok) {
      onCreated(result.profile);
      return;
    }

    setError(
      result.reason === "formato"
        ? "Solo letras, números y guión bajo, entre 3 y 20 caracteres."
        : result.reason === "prohibido"
          ? "Ese nombre no está permitido. Prueba otro."
          : result.reason === "en_uso"
            ? "Ese nombre ya lo tiene otra cuenta."
            : "No se pudo guardar. Inténtalo de nuevo."
    );
  }

  return (
    <div className="mx-auto max-w-sm text-center">
      <p className="mb-1 text-lg font-bold text-white">Elige tu @usuario</p>
      <p className="mb-5 text-sm text-zinc-400">
        Es lo único que verán otras personas — nunca tu email. Podrás
        cambiarlo más adelante.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-black/25 px-4 py-3">
          <span className="text-zinc-500">@</span>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value.toLowerCase())}
            placeholder="tu_nombre"
            autoFocus
            maxLength={20}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving || value.trim().length < 3}
          className="rounded-full bg-amber-300 px-5 py-2.5 text-sm font-extrabold text-black disabled:opacity-40"
        >
          {saving ? "Guardando…" : "Continuar"}
        </button>
      </form>
    </div>
  );
}
