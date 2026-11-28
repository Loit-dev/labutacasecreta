"use client";

import { useState } from "react";

import RatingPrompt from "@/components/recommendations/RatingPrompt";
import { useAchievementsContext } from "@/components/achievements/AchievementsProvider";
import { BookmarkIcon, CheckBadgeIcon, EyeIcon } from "@/components/icons/Icons";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWatchlist } from "@/hooks/useWatchlist";
import { track } from "@/lib/analytics";
import { dateInputToISO } from "@/lib/dateInput";
import type { Rating } from "@/lib/rating";
import { readRating, setRating } from "@/lib/rating";
import type { SearchHit } from "@/lib/search";
import { saveWatched } from "@/lib/supabase/watched";
import { addSeen, readSeen } from "@/lib/viewed";

type Props = {
  hit: SearchHit;
};

/**
 * Mismas dos acciones que TitleActions ("Guardar" / "Ya la vi"), pero
 * en versión solo-icono para cada fila del buscador: desde ahí no hay
 * datos como el reparto o los géneros (SearchHit es ligero a propósito),
 * así que lo que no tenemos simplemente se omite (es opcional en
 * SavedItem/saveWatched) — el único coste es que marcar como vista
 * desde aquí no empuja afinidad de género (recordBoost/recordAvoid,
 * que si necesita los géneros), cosa que sí pasa desde la ficha.
 */
export default function SearchHitActions({ hit }: Props) {
  const watchlist = useWatchlist();
  const { session } = useAuth();
  const { notifyWatchedAction, notifyListAction } = useAchievementsContext();
  const { profile } = useProfile(session?.user.id ?? "");

  const [showRating, setShowRating] = useState(false);

  const [seen, setSeen] = useState(() => readSeen(hit.type).includes(hit.id));

  const [, setRatingValue] = useState<Rating | undefined>(() =>
    readRating(hit.type, hit.id)
  );

  const saved = watchlist.has(hit.id, hit.type);

  const toggleSaved = () => {
    const added = watchlist.toggle({
      id: hit.id,
      type: hit.type,
      title: hit.title,
      year: hit.year ?? undefined,
      poster: hit.poster ?? undefined,
      platforms: [],
    });

    track(added ? "list_add" : "list_remove", {
      type: hit.type,
      id: hit.id,
      source: "search",
    });

    if (added) notifyListAction(["guardadas"]);
  };

  const openRating = () => {
    track("seen_clicked", { type: hit.type, id: hit.id, source: "search" });
    setShowRating(true);
  };

  const confirmRating = (
    value: Rating | undefined,
    seenAt?: string,
    review?: string
  ) => {
    addSeen(hit.type, hit.id);
    setSeen(true);

    if (value) {
      setRating(hit.type, hit.id, value);
      setRatingValue(value);
    }

    if (session) {
      saveWatched({
        userId: session.user.id,
        tmdbId: hit.id,
        mediaType: hit.type,
        title: hit.title,
        rating: value,
        posterUrl: hit.poster ?? undefined,
        seenAt: seenAt ? dateInputToISO(seenAt) : undefined,
        review,
      });
      notifyWatchedAction([]);
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={toggleSaved}
        aria-pressed={saved}
        aria-label={saved ? "Quitar de mi lista" : "Guardar"}
        title={saved ? "En mi lista" : "Guardar"}
        className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {saved ? (
          <CheckBadgeIcon size={18} className="text-emerald-400" />
        ) : (
          <BookmarkIcon size={18} />
        )}
      </button>

      <button
        type="button"
        onClick={openRating}
        aria-pressed={seen}
        aria-label={seen ? "Marcada como vista" : "Marcar como vista"}
        title={seen ? "Vista" : "Ya la vi"}
        className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <EyeIcon size={18} className={seen ? "text-amber-300" : undefined} />
      </button>

      {showRating && (
        <RatingPrompt
          title={hit.title}
          onConfirm={confirmRating}
          onClose={() => setShowRating(false)}
          share={{
            type: hit.type,
            tmdbId: hit.id,
            posterUrl: hit.poster ?? undefined,
            username: profile?.username,
          }}
        />
      )}
    </div>
  );
}
