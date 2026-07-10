"use client";

import { useEffect, useState } from "react";

import RecommendationCard from "./RecommendationCard";

import { UserProfile } from "@/lib/conversation/types";

type Recommendation = {
  id: number;
  title: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
  overview: string;
  poster: string;
};

type Props = {
  profile: UserProfile;
};

export default function Recommendations({
  profile,
}: Props) {
  const [movies, setMovies] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  const [page, setPage] = useState(0);
  const visibleMovies = movies.slice(page*3, page*3+3);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const nextMovie = () => {
    setActiveIndex((current) =>
      current >= visibleMovies.length - 1
        ? 0
        : current + 1
    );
  };

  const prevMovie = () => {
    setActiveIndex((current) =>
      current <= 0
        ? visibleMovies.length - 1
        : current - 1
    );
  };
 const nextBatch = () => {
  const maxPage = Math.floor(
    (movies.length - 1) / 3
  );

  const newPage =
    page >= maxPage ? 0 : page + 1;

  setPage(newPage);
  setActiveIndex(0);
};
  const minSwipeDistance = 50;

  const handleTouchStart = (
    e: React.TouchEvent
  ) => {
    setTouchEnd(null);
    setTouchStart(
      e.targetTouches[0].clientX
    );
  };

  const handleTouchMove = (
    e: React.TouchEvent
  ) => {
    setTouchEnd(
      e.targetTouches[0].clientX
    );
  };

  const handleTouchEnd = () => {
    if (
      touchStart === null ||
      touchEnd === null
    ) {
      return;
    }

    const distance =
      touchStart - touchEnd;

    if (distance > minSwipeDistance) {
      nextMovie();
    }

    if (distance < -minSwipeDistance) {
      prevMovie();
    }
  };

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        params.set(
          "type",
          profile.contentType ?? "movie"
        );

        if (profile.mood) {
          params.set("mood", profile.mood);
        }

if (profile.preferredGenre) {
  params.set(
    "preferredGenre",
    profile.preferredGenre
  );
}

        if (profile.company) {
          params.set(
            "company",
            profile.company
          );
        }

        if (profile.duration) {
          params.set(
            "duration",
            profile.duration
          );
        }

        if (profile.pace) {
          params.set(
            "pace",
            profile.pace
          );
        }

        if (profile.freshness) {
          params.set(
            "freshness",
            profile.freshness
          );
        }

        if (profile.discoveryMode) {
          params.set(
            "discoveryMode",
            profile.discoveryMode
          );
        }

        if (profile.language) {
          params.set(
            "language",
            profile.language
          );
        }

        if (profile.animation) {
          params.set(
            "animation",
            profile.animation
          );
        }

        if (
          Array.isArray(
            profile.restrictions
          ) &&
          profile.restrictions.length > 0
        ) {
          params.set(
            "restrictions",
            profile.restrictions.join(",")
          );
        }

        const response =
          await fetch(
            `/api/tmdb?${params.toString()}`
          );

        if (!response.ok) {
          throw new Error(
            await response.text()
          );
        }

        const data: Recommendation[] =
          await response.json();

        setMovies(data);
      } catch (err) {
        console.error(err);

        setError(
          "No se pudieron cargar las recomendaciones."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [profile]);

  if (loading) {
    return (
      <p className="text-center text-zinc-400">
        🎬 Buscando las mejores recomendaciones...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-400">
        {error}
      </p>
    );
  }

  const badges = [
    
    {
      badge: "🥇",
      badgeTitle:
        "Mi apuesta para ti",
    },
    {
      badge: "🥈",
      badgeTitle:
        "Otra que creo que disfrutarás",
    },
    {
      badge: "🥉",
      badgeTitle:
        "Una sorpresa que merece una oportunidad",
    },
  ];

  return (
    <section  id="recommendations"  className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          🎬 Creo que estas tres pueden ser justo lo que buscas.
        </h1>

        <p className="mt-3 text-sm text-zinc-400 md:text-base">
          Seleccionadas especialmente para ti.
        </p>
      </div>

      {/* MOBILE */}
      <div
        className="md:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {visibleMovies[activeIndex] && (
          <div
            key={visibleMovies[activeIndex].id}
            className="animate-fade-in relative"
          >
            <RecommendationCard
              badge={
                badges[activeIndex]
                  ?.badge ?? "🎬"
              }
              badgeTitle={
                badges[activeIndex]
                  ?.badgeTitle ??
                "Recomendación"
              }
              title={
               visibleMovies[activeIndex].title
              }
              year={
                visibleMovies[activeIndex].year
              }
              rating={
               visibleMovies[activeIndex].rating
              }
              runtime={
                visibleMovies[activeIndex].runtime
              }
              genres={
                visibleMovies[activeIndex].genres
              }
              overview={
                visibleMovies[activeIndex].overview
              }
              poster={
                visibleMovies[activeIndex].poster
              }
            />

            <button
              onClick={prevMovie}
              className="absolute left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur"
            >
              ←
            </button>

            <button
              onClick={nextMovie}
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur"
            >
              →
            </button>
          </div>
        )}

        {visibleMovies.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {visibleMovies.map((_, index) => (
              <div
                key={index}
                className={
                  index === activeIndex
                    ? "h-2 w-6 rounded-full bg-red-500 transition-all duration-300"
                    : "h-2 w-2 rounded-full bg-zinc-600 transition-all duration-300"
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* DESKTOP */}
      <div className="hidden gap-6 md:grid md:grid-cols-2 xl:grid-cols-3">
        {visibleMovies.map(
          (movie, index) => (
            <RecommendationCard
              key={movie.id}
              badge={
                badges[index % 3]
                  ?.badge ?? "🎬"
              }
              badgeTitle={
                badges[index % 3]
                  ?.badgeTitle ??
                "Recomendación"
              }
              title={movie.title}
              year={movie.year}
              rating={movie.rating}
              runtime={movie.runtime}
              genres={movie.genres}
              overview={movie.overview}
              poster={movie.poster}
            />
          )
        )}
      </div>
      {movies.length > 3 && (
  <button
    onClick={nextBatch}
    className="
      mx-auto
      mt-6
      block

      rounded-xl
      border
      border-zinc-700

      bg-zinc-900/80

      px-5
      py-3

      text-sm
      font-medium
      text-white

      transition-all

      hover:border-red-500/50
      hover:bg-zinc-800
    "
  >
    🔄 Dame otras 3 recomendaciones
  </button>
)}
    </section>
  );
}