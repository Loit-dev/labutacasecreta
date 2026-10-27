"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { fetchProfileByUsername, type ProfileRow } from "@/lib/supabase/profiles";
import ProfilePublicScreen from "@/components/account/ProfilePublicScreen";

type Props = {
  username: string;
};

export default function UsernamePageBody({ username }: Props) {
  const { session, loading: authLoading, available } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null | undefined>(undefined);

  useEffect(() => {
    if (!session) return;

    fetchProfileByUsername(username).then(setProfile);
  }, [username, session]);

  if (!available) {
    return (
      <p className="text-center text-sm text-zinc-300">
        El login no está disponible en este momento.
      </p>
    );
  }

  if (authLoading) {
    return <p className="text-center text-sm text-zinc-300">Cargando…</p>;
  }

  if (!session) {
    return (
      <div className="text-center">
        <p className="mb-4 text-sm text-zinc-300">
          Este perfil necesita una cuenta para verse.
        </p>
        <a
          href={`/entrar?volver=/u/${username}`}
          className="inline-block rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Entrar
        </a>
      </div>
    );
  }

  if (profile === undefined) {
    return <p className="text-center text-sm text-zinc-300">Cargando…</p>;
  }

  if (profile === null) {
    return (
      <p className="text-center text-sm text-zinc-300">
        No existe ningún perfil con ese nombre.
      </p>
    );
  }

  return <ProfilePublicScreen viewerId={session.user.id} profile={profile} />;
}
