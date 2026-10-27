"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { resolveInviteCode } from "@/lib/supabase/inviteCodes";
import { fetchMyProfile } from "@/lib/supabase/profiles";
import LoginForm from "@/app/entrar/LoginForm";

type Props = {
  codigo: string;
};

type Status = "cargando" | "resuelto" | "error";

export default function InvitarPageBody({ codigo }: Props) {
  const { session, loading, available } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("cargando");

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    (async () => {
      if (!supabase) return;

      const { data: invite } = await supabase
        .from("invite_codes")
        .select("kind, created_by, list_id")
        .eq("code", codigo)
        .maybeSingle();

      const result = await resolveInviteCode(codigo, session.user.id);

      if (cancelled) return;

      if (!result.ok || !invite) {
        setStatus("error");
        return;
      }

      setStatus("resuelto");

      if (invite.kind === "follow") {
        const profile = await fetchMyProfile(invite.created_by as string);
        router.replace(profile ? `/u/${profile.username}` : "/mi-cuenta");
      } else {
        router.replace("/mi-cuenta");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, codigo, router]);

  if (!available) {
    return (
      <p className="text-sm text-zinc-300">
        El login no está disponible en este momento.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-zinc-300">Cargando…</p>;
  }

  if (!session) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-lg font-extrabold text-white">
            Te han invitado a La Butaca Secreta
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Entra o crea tu cuenta para continuar — al volver desde el enlace
            de tu email, seguirás a quien te invitó automáticamente.
          </p>
        </div>
        <LoginForm redirectTo={typeof window !== "undefined" ? window.location.href : undefined} />
      </div>
    );
  }

  if (status === "error") {
    return (
      <p className="text-sm text-zinc-300">
        Este enlace de invitación ya no es válido.
      </p>
    );
  }

  return <p className="text-sm text-zinc-300">Un momento…</p>;
}
