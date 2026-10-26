"use client";

import { useState } from "react";

import RatingPrompt from "@/components/recommendations/RatingPrompt";
import { useAuth } from "@/hooks/useAuth";
import { useWatchlist } from "@/hooks/useWatchlist";
import { track } from "@/lib/analytics";
import { dateInputToISO } from "@/lib/dateInput";
import { BookmarkIcon, CheckBadgeIcon, EyeIcon, StarFilledIcon } from "@/components/icons/Icons";
import { recordAvoid, recordBoost } from "@/lib/genreAffinity";
import type { Rating } from "@/lib/rating";
import { readRating, setRating } from "@/lib/rating";
import { saveWatched } from "@/lib/supabase/watched";
import type { Recommendation } from "@/lib/tmdb/mapper";
import { addSeen, readSeen } from "@/lib/viewed";

type Props = {
  type: "movie" | "tv";
  title: Recommendation;
};

/**
 * "Guardar" y "Ya la vi" en la ficha de título (/pelicula/[id],
 * /serie/[id]), a la que se llega sobre todo desde el buscador: antes
 * solo se podía valorar desde las tarjetas de recomendación, aquí no
 * había forma de marcarla como vista ni de puntuarla.
 */
export default function TitleActions({ type, title }: Props) {
  const watchlist = useWatchlist();
  const { session } = useAuth();

  const [showRating, setShowRating] = useState(false);

  const [seen, setSeen] = useState(() =>
    readSeen(type).includes(title.id)
  );

  const [rating, setRatingValue] = useState<Rating | undefined>(() =>
    readRating(type, title.id)
  );

  const saved = watchlist.has(title.id, type);

  const toggleSaved = () => {
    const added = watchlist.toggle({
      id: title.id,
      type,
      title: title.title,
      year: title.year || undefined,
      rating: title.rating,
      poster: title.poster,
      platforms: (title.platforms ?? []).map((platform) => platform.name),
    });

    track(added ? "list_add" : "list_remove", {
      type,
      id: title.id,
      source: "title_page",
    });
  };

  const openRating = () => {
    track("seen_clicked", {
      type,
      id: title.id,
      source: "title_page",
    });

    setShowRating(true);
  };

  const confirmRating = (value: Rating | undefined, seenAt?: string) => {
    setShowRating(false);

    addSeen(type, title.id);
    setSeen(true);

    if (value) {
      setRating(type, title.id, value);
      setRatingValue(value);

      // Fase 3: 4-5 estrellas empuja esos géneros, 1-2 los baja, de
      // forma duradera (lib/genreAffinity.ts). 3 estrellas es neutro.
      if (value >= 4) {
        recordBoost(type, title.genreIds);
      } else if (value <= 2) {
        recordAvoid(type, title.genreIds);
      }
    }

    if (session) {
      saveWatched({
        userId: session.user.id,
        tmdbId: title.id,
        mediaType: type,
        title: title.title,
        rating: value,
        genres: title.genres,
        posterUrl: title.poster,
        seenAt: seenAt ? dateInputToISO(seenAt) : undefined,
      });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={toggleSaved}
        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {saved ? <CheckBadgeIcon size={16} /> : <BookmarkIcon size={16} />}
        {saved ? "En mi lista" : "Guardar"}
      </button>

      <button
        type="button"
        onClick={openRating}
        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <EyeIcon size={16} />
        {seen
          ? rating
            ? (
              <span className="inline-flex items-center gap-1">
                Vista · <StarFilledIcon size={13} className="text-amber-300" /> {rating}
              </span>
            )
            : "Vista (valorar)"
          : "Ya la vi"}
      </button>

      {showRating && (
        <RatingPrompt title={title.title} onConfirm={confirmRating} />
      )}
    </>
  );
}
