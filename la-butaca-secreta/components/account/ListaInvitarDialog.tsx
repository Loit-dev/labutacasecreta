"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

import { useDialog } from "@/hooks/useDialog";
import { searchProfiles, type ProfileRow } from "@/lib/supabase/profiles";
import { inviteCollaborator } from "@/lib/supabase/listInvites";

type Props = {
  listId: string;
  listName: string;
  invitedBy: string;
  alreadyInvitedIds: string[];
  onClose: () => void;
  onInvited: (userId: string) => void;
};

export default function ListaInvitarDialog({
  listId,
  listName,
  invitedBy,
  alreadyInvitedIds,
  onClose,
  onInvited,
}: Props) {
  const dialogRef = useDialog<HTMLDivElement>(onClose);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileRow[]>([]);
  const [sentIds, setSentIds] = useState<string[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    searchProfiles(query, invitedBy).then((profiles) => {
      if (!cancelled) setResults(profiles);
    });

    return () => {
      cancelled = true;
    };
  }, [query, invitedBy]);

  async function handleInvite(profile: ProfileRow) {
    const ok = await inviteCollaborator(listId, profile.userId, invitedBy);
    if (ok) {
      setSentIds((prev) => [...prev, profile.userId]);
      onInvited(profile.userId);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invitar-colaboradores-title"
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full max-w-md flex-col gap-4 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="invitar-colaboradores-title" className="text-sm font-extrabold text-white">
              Invitar colaboradores
            </h2>
            <p className="text-xs text-zinc-500">{listName}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/70 text-white"
          >
            ✕
          </button>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar entre tus amigos"
          autoFocus
          className="rounded-2xl border border-white/20 bg-black/25 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500"
        />

        <div className="flex flex-col gap-2 overflow-y-auto">
          {results.map((profile) => {
            const already = alreadyInvitedIds.includes(profile.userId);
            const justSent = sentIds.includes(profile.userId);

            return (
              <div
                key={profile.userId}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-[11px] font-extrabold text-black">
                  {profile.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">
                  @{profile.username}
                </span>
                {already || justSent ? (
                  <span className="text-xs font-bold text-amber-300">
                    {already ? "Colaborador/a" : "Invitación enviada"}
                  </span>
                ) : (
                  <button
                    onClick={() => handleInvite(profile)}
                    className="rounded-full border border-amber-300 px-3 py-1.5 text-xs font-extrabold text-amber-300"
                  >
                    Invitar
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-zinc-500">
          Un colaborador puede añadir y quitar títulos. Solo tú puedes borrar
          la lista o quitar colaboradores.
        </p>
      </div>
    </div>,
    document.body
  );
}
