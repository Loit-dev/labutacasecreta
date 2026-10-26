"use client";

import { useState } from "react";
import Link from "next/link";

import {
  AccountIcon,
  DiaryIcon,
  ListsIcon,
  PendingIcon,
} from "@/components/conversation/TabIcons";
import MiResumenScreen from "@/components/summary/MiResumenScreen";

import DiaryTab from "./DiaryTab";
import ListsTab from "./ListsTab";
import PendingTab from "./PendingTab";
import RequireAccount from "./RequireAccount";

const TABS = [
  ["perfil", AccountIcon, "Perfil"],
  ["diario", DiaryIcon, "Diario"],
  ["listas", ListsIcon, "Listas"],
  ["pendientes", PendingIcon, "Pendientes"],
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
        className="flex items-stretch border-b border-dashed border-amber-200/20"
      >
        {TABS.map(([id, Icon, label]) => {
          const active = tab === id;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`marquee-font flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 border-b-[3px] px-1 pb-2.5 pt-3.5 text-center text-xs leading-tight transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white sm:px-2 sm:text-base ${
                active
                  ? "border-amber-300 bg-white/10 text-white"
                  : "border-transparent bg-black/30 text-zinc-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon />
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-5 px-5 py-6 md:px-8 md:py-10">
        <Link
          href="/"
          className="marquee-font inline-block text-sm text-zinc-300 underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
