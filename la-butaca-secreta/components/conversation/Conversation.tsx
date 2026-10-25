"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import GroupQuiz from "@/components/group/GroupQuiz";
import InstagramLink from "@/components/layout/InstagramLink";
import PosterWall from "@/components/layout/PosterWall";
import CalendarView from "@/components/calendar/CalendarView";
import MyListButton from "@/components/list/MyListButton";
import SearchBox from "@/components/search/SearchBox";
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

const TABS = [
  ["recommender", "🎬", "Recomendador"],
  ["calendar", "📅", "Calendario"],
  ["search", "🔎", "Buscar"],
] as const;

export default function Conversation() {
  const [mode, setMode] = useState<Mode | null>(null);

  // Pestañas: el Recomendador no se desmonta al ir al Calendario, así
  // que al volver todo sigue como estaba
  const [tab, setTab] = useState<"recommender" | "calendar" | "search">(
    "recommender"
  );

  const [calendarOpened, setCalendarOpened] = useState(false);

  // Para el foco con teclado (flechas/Home/End) entre pestañas
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [platforms, setPlatforms] = useState<PlatformKey[]>([
    ...ALL_PLATFORM_KEYS,
  ]);

  // Las plataformas elegidas se recuerdan entre visitas
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatforms(readPlatforms());
  }, []);

  // Enlaces como /?tab=calendario (p. ej. desde la página 404) abren
  // directamente la pestaña del calendario
  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get("tab") ===
      "calendario"
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab("calendar");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCalendarOpened(true);
    }
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

  function selectTab(id: (typeof TABS)[number][0]) {
    if (id === "calendar") {
      track("calendar_open");
      setCalendarOpened(true);
    }

    if (id === "search") {
      track("search_open");
    }

    setTab(id);
  }

  // Patrón ARIA de pestañas: flechas para moverse, Home/End para ir
  // a la primera/última, y activación automática al mover el foco.
  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TABS.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();

    selectTab(TABS[nextIndex][0]);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <>
      <PosterWall />

      <MyListButton />

      <main
        id="contenido"
        className="relative flex justify-center px-4 py-4 md:px-6 md:pb-4 md:pt-10"
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
          {tab === "recommender" && (
            <img
              src="/Logo.png"
              alt="La Butaca Secreta"
              className="absolute left-4 top-16 hidden md:block md:h-12 lg:h-14 w-auto opacity-90"
            />
          )}
          <div
            role="tablist"
            aria-label="Secciones"
            className="flex items-stretch border-b border-white/15"
          >
            {TABS.map(([id, emoji, label], index) => {
              const active = tab === id;

              return (
                <button
                  key={id}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  role="tab"
                  id={`tab-${id}`}
                  tabIndex={active ? 0 : -1}
                  aria-selected={active}
                  aria-controls={`panel-${id}`}
                  onClick={() => selectTab(id)}
                  onKeyDown={(event) =>
                    handleTabKeyDown(event, index)
                  }
                  className={`flex-1 whitespace-nowrap border-b-[3px] px-1 pb-2.5 pt-3.5 text-[11px] font-bold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white sm:px-2 sm:text-sm ${
                    active
                      ? "border-red-500 bg-white/10 text-white"
                      : "border-transparent bg-black/30 text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span aria-hidden="true">{emoji}</span> {label}
                </button>
              );
            })}

            <InstagramLink />
          </div>

          <div
            role="tabpanel"
            id="panel-recommender"
            aria-labelledby="tab-recommender"
            hidden={tab !== "recommender"}
          >
            <div className="border-b border-white/10 px-5 pt-5 pb-5 md:px-8 md:pt-8 md:pb-8">
              <Header />
            </div>

            {mode === null && (
              <div className="px-5 py-4 md:px-8 md:py-6">
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
              <div className="px-5 py-4 md:px-8 md:py-6">
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

          <div
            role="tabpanel"
            id="panel-search"
            aria-labelledby="tab-search"
            hidden={tab !== "search"}
            className="px-5 py-5 md:px-8"
          >
            <p className="text-sm text-zinc-400">
              Escribe un título: te digo dónde verla, la sinopsis, la
              nota y el reparto.
            </p>

            <div className="mt-4">
              <SearchBox />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}