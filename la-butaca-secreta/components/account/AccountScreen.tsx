"use client";

import { useState } from "react";

import MiResumenScreen from "@/components/summary/MiResumenScreen";

import DiaryTab from "./DiaryTab";
import ListsTab from "./ListsTab";
import PendingTab from "./PendingTab";
import RequireAccount from "./RequireAccount";

const TABS = [
  { id: "perfil", label: "Perfil" },
  { id: "diario", label: "Diario" },
  { id: "listas", label: "Listas" },
  { id: "pendientes", label: "Pendientes" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** "Mi cuenta": perfil (Mi Resumen), diario, listas y pendientes, en pestañas. */
export default function AccountScreen() {
  const [tab, setTab] = useState<TabId>("perfil");

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Secciones de tu cuenta"
        className="flex gap-1 overflow-x-auto border-b border-white/10 pb-px"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              tab === t.id
                ? "border-red-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

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
  );
}
