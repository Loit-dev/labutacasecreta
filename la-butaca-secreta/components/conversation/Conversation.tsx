"use client";

import { useEffect, useState } from "react";

import GroupQuiz from "@/components/group/GroupQuiz";
import PosterWall from "@/components/layout/PosterWall";
import CalendarView from "@/components/calendar/CalendarView";
import MyListButton from "@/components/list/MyListButton";
import { track } from "@/lib/analytics";
import {
  ALL_PLATFORM_KEYS,
  readPlatforms,
  savePlatforms,
  serializePlatforms,
  type PlatformKey,
} from "@/lib/platforms";

import Header from "./Header";
import ModeSelect, { type Mode } from "./ModeSelect";
import SoloChat from "./SoloChat";

export default function Conversation() {
  const [mode, setMode] = useState<Mode | null>(null);

  // Pestañas: el Recomendador no se desmonta al ir al Calendario, así
  // que al volver todo sigue como estaba
  const [tab, setTab] = useState<"recommender" | "calendar">(
    "recommender"
  );

  const [calendarOpened, setCalendarOpened] = useState(false);

  const [platforms, setPlatforms] = useState<PlatformKey[]>([
    ...ALL_PLATFORM_KEYS,
  ]);

  // Las plataformas elegidas se recuerdan entre visitas
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatforms(readPlatforms());
  }, []);

  function changePlatforms(next: PlatformKey[]) {
    setPlatforms(next);
    savePlatforms(next);
  }

  const platformsValue = serializePlatforms(platforms);

  function chooseMode(next: Mode) {
    track("mode_selected", { mode: next });
    setMode(next);
  }

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
      >
        Saltar al contenido
      </a>

      <PosterWall />

      <MyListButton />

      <main
        id="contenido"
        className="relative flex min-h-screen items-center justify-center px-6 py-10"
      >
        <section
          className="
            relative
            z-30
            w-full
            max-w-4xl
            overflow-hidden

            rounded-3xl

            border
            border-white/20

            bg-black/5
            md:bg-black/15
            lg:bg-black/30

            shadow-2xl

            backdrop-blur-sm
            md:backdrop-blur-xl
            lg:backdrop-blur-2xl
          "
        >
          <img
  src="/Logo.png"
  alt="La Butaca Secreta"
  className="absolute left-4 top-16 hidden md:block md:h-12 lg:h-14 w-auto opacity-90"
/>
          <div
            role="tablist"
            aria-label="Secciones"
            className="flex border-b border-white/15"
          >
            {(
              [
                ["recommender", "🎬", "Recomendador"],
                ["calendar", "📅", "Calendario"],
              ] as const
            ).map(([id, emoji, label]) => {
              const active = tab === id;

              return (
                <button
                  key={id}
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={active}
                  aria-controls={`panel-${id}`}
                  onClick={() => {
                    if (id === "calendar") {
                      track("calendar_open");
                      setCalendarOpened(true);
                    }

                    setTab(id);
                  }}
                  className={`flex-1 border-b-[3px] px-2 pb-2.5 pt-3.5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white ${
                    active
                      ? "border-red-500 bg-white/10 text-white"
                      : "border-transparent bg-black/30 text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span aria-hidden="true">{emoji}</span> {label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id="panel-recommender"
            aria-labelledby="tab-recommender"
            hidden={tab !== "recommender"}
          >
            <div className="border-b border-white/10 px-8 pt-8 pb-8">
              <Header />
            </div>

            {mode === null && (
              <div className="px-8 py-6">
                <ModeSelect
                  onSelect={chooseMode}
                  platforms={platforms}
                  onPlatformsChange={changePlatforms}
                />
              </div>
            )}

            {mode === "solo" && (
              <SoloChat platforms={platformsValue} />
            )}

            {mode === "group" && (
              <div className="px-8 py-6">
                <GroupQuiz platforms={platformsValue} />
              </div>
            )}
          </div>

          <div
            role="tabpanel"
            id="panel-calendar"
            aria-labelledby="tab-calendar"
            hidden={tab !== "calendar"}
            className="px-5 py-5 md:px-8"
          >
            {calendarOpened && (
              <CalendarView platforms={platforms} />
            )}
          </div>
        </section>
      </main>
    </>
  );
}