"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";

import { createList, fetchLists, type ListRow } from "@/lib/supabase/lists";

import ListDetailDialog from "./ListDetailDialog";

function ListCollage({ list }: { list: ListRow }) {
  const posters = list.items.slice(0, 2).map((item) => item.posterUrl);

  if (posters.length === 0) {
    return (
      <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-xl">
        🎬
      </div>
    );
  }

  return (
    <div className="flex h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
      {posters.map((src, i) => (
        <div key={i} className="relative h-full flex-1">
          {src ? (
            <Image src={src} alt="" fill sizes="48px" className="object-cover" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function ListsTab({ session }: { session: Session }) {
  const [lists, setLists] = useState<ListRow[] | null>(null);
  const [open, setOpen] = useState<ListRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchLists(session.user.id).then((data) => {
      if (!cancelled) setLists(data);
    });

    return () => {
      cancelled = true;
    };
  }, [session.user.id]);

  const updateList = (updated: ListRow) => {
    setLists((prev) =>
      prev?.map((list) => (list.id === updated.id ? updated : list)) ?? null
    );
    setOpen(updated);
  };

  const removeListFromState = (id: string) => {
    setLists((prev) => prev?.filter((list) => list.id !== id) ?? null);
    setOpen(null);
  };

  const submitCreate = async () => {
    const trimmed = newName.trim();

    if (!trimmed) {
      setCreating(false);
      return;
    }

    const created = await createList(session.user.id, trimmed);

    setCreating(false);
    setNewName("");

    if (created) {
      setLists((prev) => [created, ...(prev ?? [])]);
    }
  };

  if (lists === null) {
    return <p className="text-center text-sm text-zinc-300">Cargando…</p>;
  }

  return (
    <div className="relative min-h-[50vh]">
      {lists.length === 0 ? (
        <p className="rounded-2xl bg-black/30 px-4 py-8 text-center text-sm text-zinc-300">
          Todavía no tienes listas. Crea una con el botón «+» para
          empezar a agrupar títulos (por ejemplo, «Terror» o «Pelis de
          Navidad»).
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lists.map((list) => (
            <li key={list.id}>
              <button
                type="button"
                onClick={() => setOpen(list)}
                className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-left transition-colors hover:bg-black/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <ListCollage list={list} />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-white">{list.name}</p>
                  <p className="text-xs text-zinc-400">
                    {list.items.length}{" "}
                    {list.items.length === 1 ? "título" : "títulos"}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {creating ? (
        <div className="fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-sm items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 p-2 shadow-2xl sm:absolute sm:inset-x-0 sm:bottom-0">
          <input
            autoFocus
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitCreate();
              if (event.key === "Escape") {
                setCreating(false);
                setNewName("");
              }
            }}
            placeholder="Nombre de la lista…"
            className="w-full rounded-xl border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          />

          <button
            onClick={submitCreate}
            className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Crear
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          aria-label="Crear una lista nueva"
          title="Crear una lista nueva"
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-2xl font-bold text-white shadow-2xl hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:absolute sm:bottom-0 sm:right-0"
        >
          +
        </button>
      )}

      {open && (
        <ListDetailDialog
          list={open}
          onClose={() => setOpen(null)}
          onChange={updateList}
          onDeleted={() => removeListFromState(open.id)}
        />
      )}
    </div>
  );
}
