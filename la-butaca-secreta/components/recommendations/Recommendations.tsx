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

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();

        params.set(
          "type",
          profile.contentType ?? "movie"
        );

        if (profile.mood) {
          params.set("mood", profile.mood);
        }

        if (profile.company) {
          params.set("company", profile.company);
        }

        if (profile.duration) {
          params.set("duration", profile.duration);
        }

        if (profile.pace) {
          params.set("pace", profile.pace);
        }

        if (profile.freshness) {
          params.set(
            "freshness",
            profile.freshness
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

        
        if (profile.restrictions?.length) {
            params.set(
            "restrictions",
            profile.restrictions.join(",")
                      );
        }


        const response = await fetch(
          `/api/tmdb?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();

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
      badgeTitle: "Mi apuesta para ti",
    },
    {
      badge: "🥈",
      badgeTitle: "Otra que creo que disfrutarás",
    },
    {
      badge: "🥉",
      badgeTitle: "Una sorpresa que merece una oportunidad",
    },
  ];

  return (
    <section className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">
          🎬 Creo que estas tres pueden ser justo lo que buscas.
        </h1>

        <p className="mt-4 text-lg text-zinc-400">
          Seleccionadas especialmente para ti.
        </p>
      </div>

      {movies.map((movie, index) => (
        <RecommendationCard
          key={movie.id}
          badge={badges[index]?.badge ?? "🎬"}
          badgeTitle={
            badges[index]?.badgeTitle ??
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
      ))}
    </section>
  );
}