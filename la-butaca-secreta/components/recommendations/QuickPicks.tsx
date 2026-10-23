"use client";

import { useEffect, useMemo, useState, type TouchEvent } from "react";
import Link from "next/link";

import DetailsModal from "./DetailsModal";
import RecommendationCard from "./RecommendationCard";
import RecommendationSkeleton from "./RecommendationSkeleton";
import ShareDialog from "./ShareDialog";
import { badgeFor } from "./badges";

import { useWatchlist } from "@/hooks/useWatchlist";
import { track } from "@/lib/analytics";
import { UserProfile } from "@/lib/conversation/types";
import { inferredProfile } from "@/lib/memory";
import { posterSource, type ShareItem } from "@/lib/share";
import { addShown, readRecentlyShown } from "@/lib/shown";
import type { Recommendation } from "@/lib/tmdb/mapper";
import { readSeen } from "@/lib/viewed";

type Phase = "loading" | "ready" | "empty" | "error";

const CACHE_KEY = "lbs:today";

type Cache = {
  date: string;
  profileKey: string;
  items: Recommendation[];
};

// Mismo día + mismo perfil => misma carta, aunque se recargue la
// página varias veces (no tiene sentido que cambie a media tarde).
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function profileKey(profile: UserProfile) {
  return [
    profile.contentType,
    profile.preferredGenre,
    profile.mood,
    profile.platforms,
  ]
    .map((value) => value ?? "")
    .join("|");
}

function readCache(): Cache | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);

    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as Cache).items)
    ) {
      return null;
    }

    return parsed as Cache;
  } catch {
    return null;
  }
}

function writeCache(cache: Cache) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Sin localStorage: simplemente se vuelve a calcular cada vez
  }
}

function buildMainQuery(profile: UserProfile, exclude: string) {
  const params = new URLSearchParams();

  params.set("type", profile.contentType ?? "movie");
  params.set("quick", "1");
  params.set("company", "alone");

  if (profile.preferredGenre) {
    params.set("preferredGenre", profile.preferredGenre);
  }

  if (profile.mood) {
    params.set("mood", profile.mood);
  }

  if (profile.platforms) {
    params.set("platforms", profile.platforms);
  }

  if (exclude) {
    params.set("exclude", exclude);
  }

  return params.toString();
}

// Perfil de partida: lo que recordamos de visitas anteriores, o uno
// neutro (sin género ni ánimo) la primera vez que no sabemos nada.
function startingProfile(): UserProfile {
  return (
    inferredProfile() ?? {
      contentType: "movie",
      company: "alone",
    }
  );
}

export default function QuickPicks() {
  const profile = useMemo(startingProfile, []);

  const [items, setItems] = useState<Recommendation[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [shareItems, setShareItems] = useState<ShareItem[] | null>(null);

  // En el móvil se ve una tarjeta cada vez, como en el cuestionario
  // completo (mismo patrón de carrusel con puntos y deslizar)
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const watchlist = useWatchlist();

  const type = profile.contentType ?? "movie";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const key = profileKey(profile);
      const cached = readCache();

      if (cached && cached.date === todayKey() && cached.profileKey === key) {
        setItems(cached.items);
        setPhase(cached.items.length > 0 ? "ready" : "empty");
        return;
      }

      setPhase("loading");

      try {
        // Lo que ya dijo que vio + lo que ya le enseñamos como «hoy»
        // hace poco, para no repetirle la misma tanda varios días seguidos.
        const excluded = Array.from(
          new Set([...readSeen(type), ...readRecentlyShown(type)])
        );

        const mainResponse = await fetch(
          `/api/tmdb?${buildMainQuery(profile, excluded.join(","))}`
        );

        if (!mainResponse.ok) {
          throw new Error(`tmdb ${mainResponse.status}`);
        }

        const mainData: unknown = await mainResponse.json();
        const main = Array.isArray(mainData)
          ? (mainData as Recommendation[])
          : [];

        const paraTi = main.find((item) => item.role !== "surprise");
        const sorpresa = main.find((item) => item.role === "surprise");

        const alreadyPicked = [paraTi, sorpresa]
          .filter((item): item is Recommendation => !!item)
          .map((item) => item.id);

        const trendingParams = new URLSearchParams();

        trendingParams.set("type", type);

        if (profile.platforms) {
          trendingParams.set("platforms", profile.platforms);
        }

        trendingParams.set(
          "exclude",
          [...excluded, ...alreadyPicked].join(",")
        );

        const trendingResponse = await fetch(
          `/api/trending?${trendingParams.toString()}`
        );

        const trendingData: unknown = trendingResponse.ok
          ? await trendingResponse.json()
          : [];

        const trending = Array.isArray(trendingData)
          ? (trendingData as Recommendation[])[0]
          : undefined;

        const result = [paraTi, trending, sorpresa].filter(
          (item): item is Recommendation => !!item
        );

        if (cancelled) return;

        writeCache({ date: todayKey(), profileKey: key, items: result });
        addShown(
          type,
          result.map((item) => item.id),
          todayKey()
        );

        setItems(result);
        setPhase(result.length > 0 ? "ready" : "empty");

        track("today_shown", { count: result.length });
      } catch (error) {
        if (cancelled) return;

        console.error(error);
        setPhase("error");
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, type]);

  const toggleSaved = (movie: Recommendation) => {
    const added = watchlist.toggle({
      id: movie.id,
      type,
      title: movie.title,
      year: movie.year || undefined,
      rating: movie.rating,
      poster: movie.poster,
      platforms: (movie.platforms ?? []).map((platform) => platform.name),
    });

    track(added ? "list_add" : "list_remove", {
      type,
      id: movie.id,
      role: movie.role,
      source: "today",
    });
  };

  const openShare = () => {
    const shared: ShareItem[] = items.map((movie) => ({
      id: movie.id,
      title: movie.title,
      year: movie.year,
      rating: movie.rating,
      role: movie.role,
      posterUrl: posterSource(movie.poster),
    }));

    track("share_open", { type, count: shared.length, source: "today" });

    setShareItems(shared);
  };

  const current = Math.min(activeIndex, Math.max(items.length - 1, 0));

  const nextMovie = () => {
    setActiveIndex(current >= items.length - 1 ? 0 : current + 1);
  };

  const prevMovie = () => {
    setActiveIndex(current <= 0 ? items.length - 1 : current - 1);
  };

  const minSwipeDistance = 50;

  const handleTouchStart = (event: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(event.targetTouches[0].clientX);
  };

  const handleTouchMove = (event: TouchEvent) => {
    setTouchEnd(event.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;

    const distance = touchStart - touchEnd;

    if (distance > minSwipeDistance) nextMovie();
    if (distance < -minSwipeDistance) prevMovie();
  };

  const renderCard = (
    movie: Recommendation,
    index: number,
    dots?: { total: number; current: number }
  ) => {
    const { badge, badgeTitle } = badgeFor(movie, index, items);

    return (
      <RecommendationCard
        key={movie.id}
        badge={badge}
        badgeTitle={badgeTitle}
        title={movie.title}
        year={movie.year}
        rating={movie.rating}
        runtime={movie.runtime}
        genres={movie.genres}
        overview={movie.overview}
        poster={movie.poster}
        providers={movie.providers}
        reason={movie.reason}
        dots={dots}
        saved={watchlist.has(movie.id, type)}
        onToggleSave={() => toggleSaved(movie)}
        onDetails={() => {
          track("details_open", {
            id: movie.id,
            role: movie.role,
            source: "today",
          });

          setDetailsId(movie.id);
        }}
      />
    );
  };

  if (phase === "loading") {
    return <RecommendationSkeleton compact />;
  }

  if (phase === "error") {
    return (
      <p className="text-center text-sm text-red-400" role="alert">
        No he podido preparar la Butaca Exprés. Prueba otra vez en un rato.
      </p>
    );
  }

  if (phase === "empty" || items.length === 0) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-zinc-300">
          Hoy no he encontrado nada que encaje del todo. El cuestionario
          completo tiene más donde elegir.
        </p>

        <Link
          href="/"
          className="inline-block rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Ir al cuestionario
        </Link>
      </div>
    );
  }

  const detailsMovie = items.find((item) => item.id === detailsId) ?? null;

  const detailsBadge = detailsMovie
    ? badgeFor(detailsMovie, items.indexOf(detailsMovie), items)
    : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-white md:text-2xl">
          <span aria-hidden="true">⚡</span> Butaca Exprés
        </h1>

        <p className="mt-1 text-xs text-zinc-400 md:text-sm">
          Sin preguntas: esto es lo que te propongo para hoy. Mañana hay
          otras tres.
        </p>
      </div>

      {/* MOBILE: una tarjeta cada vez, como el cuestionario completo */}
      <div
        role="region"
        aria-roledescription="carrusel"
        aria-label="Butaca Exprés"
        className="md:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {items[current] && (
          <div
            key={items[current].id}
            className="animate-fade-in relative"
          >
            {renderCard(items[current], current, {
              total: items.length,
              current,
            })}

            {items.length > 1 && (
              <>
                <button
                  onClick={prevMovie}
                  aria-label="Anterior"
                  className="absolute left-2 top-[8.25rem] z-20 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/65 text-3xl font-bold text-white shadow-xl shadow-black/60 backdrop-blur-sm transition-transform active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span aria-hidden="true">←</span>
                </button>

                <button
                  onClick={nextMovie}
                  aria-label="Siguiente"
                  className="absolute right-2 top-[8.25rem] z-20 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/65 text-3xl font-bold text-white shadow-xl shadow-black/60 backdrop-blur-sm transition-transform active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* DESKTOP */}
      <div className="hidden gap-6 md:grid md:grid-cols-3">
        {items.map((movie, index) => renderCard(movie, index))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={openShare}
          className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/60 transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:rounded-xl md:px-5 md:py-3 md:text-sm"
        >
          <span aria-hidden="true">📤</span> Compartir mis
          sugerencias
        </button>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          ¿Prefieres contestar el cuestionario completo?
        </Link>
      </div>

      {shareItems && (
        <ShareDialog
          items={shareItems}
          kind={type}
          headline="Butaca Exprés recomienda"
          onClose={() => setShareItems(null)}
        />
      )}

      {detailsMovie && detailsBadge && (
        <DetailsModal
          movie={detailsMovie}
          badge={detailsBadge.badge}
          badgeTitle={detailsBadge.badgeTitle}
          saved={watchlist.has(detailsMovie.id, type)}
          onToggleSave={() => toggleSaved(detailsMovie)}
          onClose={() => setDetailsId(null)}
        />
      )}
    </div>
  );
}
