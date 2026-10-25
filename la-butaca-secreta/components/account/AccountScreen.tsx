"use client";

import { useState } from "react";
import Link from "next/link";

import MiResumenScreen from "@/components/summary/MiResumenScreen";

import DiaryTab from "./DiaryTab";
import ListsTab from "./ListsTab";
import PendingTab from "./PendingTab";
import RequireAccount from "./RequireAccount";

const TABS = [
  ["perfil", "👤", "Perfil"],
  ["diario", "📖", "Diario"],
  ["listas", "📝", "Listas"],
  ["pendientes", "⏳", "Pendientes"],
] as const;

type TabId = (typeof TABS)[number][0];

/** "Mi cuenta": perfil (Mi Resumen), diario, listas y pendientes, en pestañas. */
export default function AccountScreen() {
  const [tab, setTab] = useState<TabId>("perfil");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Secciones de tu cuenta"
        className="flex items-stretch border-b border-white/15"
      >
        {TABS.map(([id, emoji, label]) => {
          const active = tab === id;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`min-w-0 flex-1 border-b-[3px] px-1 pb-2.5 pt-3.5 text-center text-[10px] font-bold leading-tight transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white sm:px-2 sm:text-sm ${
                active
                  ? "border-red-500 bg-white/10 text-white"
                  : "border-transparent bg-black/30 text-zinc-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span aria-hidden="true" className="block">
                {emoji}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-5 px-5 py-6 md:px-8 md:py-10">
        <Link
          href="/"
          className="inline-block text-xs font-semibold text-zinc-300 underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          ← Volver
        </Link>

        <div role="tabpanel">
          {tab === "perfil" && <MiResumenScreen />}

          {tab === "diario" && (
            <RequireAccount what="El diario">
              {(session) => <DiaryTab session={session} />}
            </RequireAccount>
          )}

          {tab === "listas" && (
            <RequireAccount what="Las listas">
              {(session) => <ListsTab session={session} />}
            </RequireAccount>
          )}

          {tab === "pendientes" && <PendingTab />}
        </div>
      </div>
    </div>
  );
}
