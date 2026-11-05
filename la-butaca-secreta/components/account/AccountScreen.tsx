"use client";

import { useEffect, useState, type TouchEvent } from "react";
import Link from "next/link";

import {
  AccountIcon,
  DiaryIcon,
  FriendsIcon,
  ListsIcon,
  PendingIcon,
} from "@/components/conversation/TabIcons";
import MiResumenScreen from "@/components/summary/MiResumenScreen";
import AchievementsScreen from "@/components/achievements/AchievementsScreen";
import { useAchievementsContext } from "@/components/achievements/AchievementsProvider";

import DiaryTab from "./DiaryTab";
import FriendsTab from "./FriendsTab";
import ListsTab from "./ListsTab";
import PendingTab from "./PendingTab";
import RequireAccount from "./RequireAccount";

// "Logros" no tiene pestaña propia a propósito: solo se llega desde
// el enlace "Ver todos" del perfil (Mi Resumen → ProfileAchievementsRow),
// no desde esta barra.
const TABS = [
  ["perfil", AccountIcon, "Perfil"],
  ["diario", DiaryIcon, "Diario"],
  ["listas", ListsIcon, "Listas"],
  ["pendientes", PendingIcon, "Pendientes"],
  ["amigos", FriendsIcon, "Amigos"],
] as const;

type TabId = (typeof TABS)[number][0] | "logros";

// Deslizar con el dedo para cambiar de pestaña (izquierda → siguiente,
// derecha → anterior), igual que el resto de carruseles de la web.
// Umbral algo más alto que en esos carruseles porque aquí dentro
// suele haber listas largas que se recorren verticalmente.
const MIN_SWIPE_DISTANCE = 70;

/** "Mi cuenta": perfil (Mi Resumen), diario, listas y pendientes, en pestañas. */
export default function AccountScreen() {
  const [tab, setTab] = useState<TabId>("perfil");
  const { state: achievementsState, betaTesterUnlocked } = useAchievementsContext();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Permite enlazar directamente a una pestaña (p. ej. desde el
  // perfil público: "Seguir" sin @usuario te manda aquí, a Amigos,
  // para crearlo). Se lee en un efecto en vez de en el estado inicial
  // para no desajustar el render de servidor y cliente.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");

    if (requested && (TABS.some(([id]) => id === requested) || requested === "logros")) {
      setTab(requested as TabId);
    }
  }, []);

  function handleTouchStart(event: TouchEvent) {
    setTouchEnd(null);
    setTouchStart(event.targetTouches[0].clientX);
  }

  function handleTouchMove(event: TouchEvent) {
    setTouchEnd(event.targetTouches[0].clientX);
  }

  function handleTouchEnd() {
    if (touchStart === null || touchEnd === null) return;

    const distance = touchStart - touchEnd;

    // "Logros" no está en la barra de pestañas (solo se llega por
    // enlace), así que ahí deslizar no hace nada.
    const index = TABS.findIndex(([id]) => id === tab);
    if (index === -1) return;

    if (distance > MIN_SWIPE_DISTANCE && index < TABS.length - 1) {
      setTab(TABS[index + 1][0]);
    } else if (distance < -MIN_SWIPE_DISTANCE && index > 0) {
      setTab(TABS[index - 1][0]);
    }
  }

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

      <div
        className="flex flex-col gap-5 px-5 py-6 md:px-8 md:py-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Link
          href="/"
          className="marquee-font inline-block text-sm text-zinc-300 underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          ← Volver
        </Link>

        <div role="tabpanel">
          {tab === "perfil" && <MiResumenScreen onNavigateTab={setTab} />}

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

          {tab === "amigos" && (
            <RequireAccount what="Amigos">
              {(session) => <FriendsTab session={session} />}
            </RequireAccount>
          )}

          {tab === "logros" && (
            <RequireAccount what="Los logros">
              {() =>
                achievementsState ? (
                  <AchievementsScreen state={achievementsState} betaTesterUnlocked={betaTesterUnlocked} />
                ) : (
                  <p className="text-sm text-zinc-400">Calculando tus logros…</p>
                )
              }
            </RequireAccount>
          )}
        </div>
      </div>
    </div>
  );
}
