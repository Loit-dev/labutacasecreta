"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";

import { useDialog } from "@/hooks/useDialog";
import {
  addListItem,
  deleteList,
  removeListItem,
  renameList,
  type ListRow,
} from "@/lib/supabase/lists";
import {
  fetchCollaborators,
  removeListInvite,
  setListPublic,
  type ListInviteRow,
} from "@/lib/supabase/listInvites";
import type { ProfileRow } from "@/lib/supabase/profiles";
import type { SearchHit } from "@/lib/search";

import TitlePickerDialog from "./TitlePickerDialog";
import ListaInvitarDialog from "./ListaInvitarDialog";

type Props = {
  list: ListRow;
  userId: string;
  onClose: () => void;
  onChange: (list: ListRow) => void;
  onDeleted: () => void;
};

/** Ver, renombrar, añadir/quitar títulos y borrar una lista. */
export default function ListDetailDialog({
  list,
  userId,
  onClose,
  onChange,
  onDeleted,
}: Props) {
  const dialogRef = useDialog<HTMLDivElement>(onClose);

  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(list.name);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isPublic, setIsPublic] = useState(list.isPublic);
  const [collaborators, setCollaborators] = useState<
    (ListInviteRow & { profile: ProfileRow | null })[]
  >([]);
  const [invitando, setInvitando] = useState(false);

  useEffect(() => {
    fetchCollaborators(list.id).then(setCollaborators);
  }, [list.id]);

  async function togglePublic() {
    const next = !isPublic;
    const ok = await setListPublic(list.id, next);
    if (ok) {
      setIsPublic(next);
      onChange({ ...list, isPublic: next });
    }
  }

  async function handleRemoveCollaborator(inviteId: string) {
    const ok = await removeListInvite(inviteId);
    if (ok) {
      setCollaborators((prev) => prev.filter((c) => c.id !== inviteId));
    }
  }

  const saveName = async () => {
    const trimmed = name.trim();

    setRenaming(false);

    if (!trimmed || trimmed === list.name) {
      setName(list.name);
      return;
    }

    const ok = await renameList(list.id, trimmed);

    if (ok) {
      onChange({ ...list, name: trimmed });
    } else {
      setName(list.name);
    }
  };

  const pickTitle = async (hit: SearchHit) => {
    const item = await addListItem({
      listId: list.id,
      tmdbId: hit.id,
      mediaType: hit.type,
      title: hit.title,
      posterUrl: hit.poster,
    });

    if (item) {
      onChange({
        ...list,
        items: [
          item,
          ...list.items.filter(
            (existing) =>
              !(existing.tmdbId === item.tmdbId && existing.mediaType === item.mediaType)
          ),
        ],
      });
    }
  };

  const removeTitle = async (itemId: string) => {
    const ok = await removeListItem(itemId);

    if (ok) {
      onChange({
        ...list,
        items: list.items.filter((item) => item.id !== itemId),
      });
    }
  };

  const deleteThisList = async () => {
    if (!window.confirm(`¿Borrar la lista "${list.name}"?`)) return;

    setBusy(true);

    const ok = await deleteList(list.id);

    setBusy(false);

    if (ok) onDeleted();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="list-detail-title"
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          {renaming ? (
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={saveName}
              onKeyDown={(event) => {
                if (event.key === "Enter") saveName();
                if (event.key === "Escape") {
                  setName(list.name);
                  setRenaming(false);
                }
              }}
              className="w-full rounded-xl border border-zinc-700 bg-black/40 px-3 py-1.5 text-lg font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            />
          ) : (
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="text-left"
              title="Renombrar lista"
            >
              <h2
                id="list-detail-title"
                className="text-lg font-bold text-white underline decoration-dotted underline-offset-4"
              >
                {list.name}
              </h2>
              <p className="text-xs text-zinc-400">
                {list.items.length}{" "}
                {list.items.length === 1 ? "título" : "títulos"}
              </p>
            </button>
          )}

          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/[0.06] p-3">
          <div className="flex-1">
            <p className="text-xs font-extrabold text-white">Lista pública</p>
            <p className="text-[11px] text-zinc-400">
              Quien te siga podrá verla en tu perfil
            </p>
          </div>
          <button
            type="button"
            onClick={togglePublic}
            role="switch"
            aria-checked={isPublic}
            aria-label="Lista pública"
            className={`flex h-6 w-[42px] items-center rounded-full p-0.5 transition-colors ${
              isPublic ? "justify-end bg-amber-300" : "justify-start bg-white/15"
            }`}
          >
            <span className="h-[18px] w-[18px] rounded-full bg-zinc-900" />
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/14 bg-white/[0.03] p-3">
          <div className="flex -space-x-2.5">
            {collaborators.slice(0, 3).map((c) => (
              <div
                key={c.id}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-900 bg-gradient-to-br from-emerald-400 to-sky-500 text-[10px] font-extrabold text-black"
              >
                {(c.profile?.username ?? "??").slice(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
          <div className="flex-1 text-xs">
            <p className="font-extrabold text-white">Lista compartida</p>
            <p className="text-[11px] text-zinc-400">
              {collaborators.length === 0
                ? "Sin colaboradores todavía"
                : collaborators
                    .map((c) => c.profile?.username ?? "alguien")
                    .join(", ") + " pueden editarla"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInvitando(true)}
            aria-label="Añadir colaborador"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-white/35 text-zinc-300"
          >
            +
          </button>
        </div>

        {collaborators.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {collaborators.map((c) => (
              <button
                key={c.id}
                onClick={() => handleRemoveCollaborator(c.id)}
                className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-zinc-300"
                title="Echar de la lista"
              >
                @{c.profile?.username ?? "??"} ✕
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setPicking(true)}
          className="self-start rounded-xl border border-zinc-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          + Añadir título
        </button>

        {list.items.length === 0 ? (
          <p
            role="status"
            className="rounded-2xl bg-black/40 px-4 py-8 text-center text-sm text-zinc-300"
          >
            Esta lista está vacía. Pulsa «+ Añadir título» para empezar.
          </p>
        ) : (
          <div className="-mr-1 grid grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
            {list.items.map((item) => {
              const href = `/${item.mediaType === "tv" ? "serie" : "pelicula"}/${item.tmdbId}`;
              const poster = item.posterUrl;

              return (
                <div key={item.id} className="group relative">
                  <Link
                    href={href}
                    className="block overflow-hidden rounded-xl bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <div className="relative aspect-[2/3] w-full">
                      {poster ? (
                        <Image
                          src={poster}
                          alt=""
                          fill
                          sizes="150px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-2 text-center text-[11px] text-zinc-400">
                          {item.title}
                        </div>
                      )}
                    </div>
                  </Link>

                  <button
                    onClick={() => removeTitle(item.id)}
                    aria-label={`Quitar de la lista: ${item.title}`}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-sm text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={deleteThisList}
          disabled={busy}
          className="self-center text-xs text-zinc-400 underline underline-offset-2 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
        >
          Borrar esta lista
        </button>
      </div>

      {picking && (
        <TitlePickerDialog
          heading={`Añadir a "${list.name}"`}
          addedKey={(hit) =>
            list.items.some(
              (item) => item.tmdbId === hit.id && item.mediaType === hit.type
            )
          }
          onPick={pickTitle}
          onClose={() => setPicking(false)}
        />
      )}

      {invitando && (
        <ListaInvitarDialog
          listId={list.id}
          listName={list.name}
          invitedBy={userId}
          alreadyInvitedIds={collaborators.map((c) => c.invitedUserId)}
          onClose={() => setInvitando(false)}
          onInvited={() => {
            fetchCollaborators(list.id).then(setCollaborators);
          }}
        />
      )}
    </div>,
    document.body
  );
}
