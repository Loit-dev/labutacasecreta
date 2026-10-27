"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { buildSummary } from "@/lib/summary";
import { fetchWatchedHistory } from "@/lib/supabase/summary";
import { fetchFavorite } from "@/lib/supabase/favorite";
import { fetchPendingSyncFor, type PendingSyncItem } from "@/lib/supabase/pendingSync";
import { fetchLists, type ListRow } from "@/lib/supabase/lists";
import { follow, isFollowing, unfollow } from "@/lib/supabase/follows";
import { fetchFriendStatus, sendFriendRequest, type FriendStatus } from "@/lib/supabase/friends";
import { reportUser } from "@/lib/supabase/reports";
import type { ProfileRow } from "@/lib/supabase/profiles";

import ShareProfileDialog from "./ShareProfileDialog";
import RecommendDialog from "./RecommendDialog";

type Props = {
  viewerId: string;
  profile: ProfileRow;
};

export default function ProfilePublicScreen({ viewerId, profile }: Props) {
  const isMe = viewerId === profile.userId;

  const [stats, setStats] = useState<ReturnType<typeof buildSummary> | null>(null);
  const [favoriteTitle, setFavoriteTitle] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingSyncItem[]>([]);
  const [lists, setLists] = useState<ListRow[]>([]);
  const [following, setFollowing] = useState(false);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [showShare, setShowShare] = useState(false);
  const [showRecommend, setShowRecommend] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [history, favorite, pendingItems, listRows, follows, friend] =
        await Promise.all([
          fetchWatchedHistory(profile.userId),
          fetchFavorite(profile.userId),
          fetchPendingSyncFor(profile.userId),
          fetchLists(profile.userId),
          isMe ? Promise.resolve(false) : isFollowing(viewerId, profile.userId),
          isMe
            ? Promise.resolve({ status: "none" as FriendStatus, requestId: null })
            : fetchFriendStatus(viewerId, profile.userId),
        ]);

      if (cancelled) return;

      setStats(buildSummary(history));
      setFavoriteTitle(favorite?.title ?? null);
      setPending(pendingItems);
      setLists(listRows);
      setFollowing(follows);
      setFriendStatus(friend.status);
    })();

    return () => {
      cancelled = true;
    };
  }, [viewerId, profile.userId, isMe]);

  async function handleFollow() {
    const ok = following
      ? await unfollow(viewerId, profile.userId)
      : await follow(viewerId, profile.userId);

    if (ok) setFollowing(!following);
  }

  async function handleFriendRequest() {
    const ok = await sendFriendRequest(viewerId, profile.userId);
    if (ok) setFriendStatus("pending_sent");
  }

  async function handleReport(reason: string) {
    const ok = await reportUser(viewerId, profile.userId, reason);
    if (ok) setReportSent(true);
  }

  const name = profile.displayName ?? profile.username;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-2xl font-extrabold text-black">
          {name.slice(0, 2).toUpperCase()}
        </div>
        <p className="text-lg font-extrabold text-white">{name}</p>
        <p className="text-sm text-zinc-500">@{profile.username}</p>
        {friendStatus === "friends" && (
          <span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-extrabold text-amber-300">
            Amigos
          </span>
        )}

        {!isMe && (
          <div className="mt-1 flex items-center gap-2">
            <button
              onClick={handleFollow}
              className={`rounded-full px-4 py-2 text-xs font-extrabold ${
                following ? "border border-white/20 text-white" : "bg-white/10 text-white"
              }`}
            >
              {following ? "Siguiendo ✓" : "Seguir"}
            </button>
            <button
              onClick={() => setShowRecommend(true)}
              className="flex items-center gap-1.5 rounded-full bg-amber-300 px-3.5 py-2 text-xs font-extrabold text-black"
            >
              Recomendar
            </button>
            {friendStatus === "none" && (
              <button
                onClick={handleFriendRequest}
                className="rounded-full border border-white/20 px-3 py-2 text-xs font-bold text-zinc-300"
              >
                Pedir amistad
              </button>
            )}
            {friendStatus === "pending_sent" && (
              <span className="text-xs font-bold text-zinc-500">Solicitud enviada</span>
            )}
          </div>
        )}

        {isMe && (
          <button
            onClick={() => setShowShare(true)}
            className="mt-1 rounded-full border border-white/20 px-4 py-2 text-xs font-extrabold text-white"
          >
            Compartir mi perfil
          </button>
        )}
      </div>

      {stats && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Resumen
          </p>
          <div className="grid grid-cols-3 gap-2">
            <StatBox value={stats.totalWatched} label="vistas" />
            <StatBox value={favoriteTitle ? "★" : "—"} label="favorita" />
            <StatBox value={stats.topGenre?.name ?? "—"} label="género top" small />
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <PosterRow label="Pendientes" items={pending.map((p) => ({ key: `${p.tmdbId}-${p.mediaType}`, poster: p.posterUrl }))} />
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
          Listas públicas
        </p>
        {lists.length === 0 ? (
          <p className="text-xs text-zinc-500">Sin listas públicas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {lists.map((list) => (
              <Link
                key={list.id}
                href="/mi-cuenta"
                className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              >
                <span className="flex-1 text-sm font-bold text-white">{list.name}</span>
                <span className="text-xs text-zinc-500">{list.items.length} títulos</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {!isMe && (
        <div className="text-center">
          {!showReport && !reportSent && (
            <button
              onClick={() => setShowReport(true)}
              className="text-xs text-zinc-500 underline underline-offset-2"
            >
              Reportar perfil
            </button>
          )}
          {showReport && !reportSent && (
            <ReportForm onSubmit={handleReport} onCancel={() => setShowReport(false)} />
          )}
          {reportSent && (
            <p className="text-xs text-zinc-500">Gracias, lo revisaremos.</p>
          )}
        </div>
      )}

      {showShare && (
        <ShareProfileDialog userId={viewerId} username={profile.username} onClose={() => setShowShare(false)} />
      )}
      {showRecommend && (
        <RecommendDialog
          fromUserId={viewerId}
          toUserId={profile.userId}
          toName={name}
          onClose={() => setShowRecommend(false)}
        />
      )}
    </div>
  );
}

function StatBox({
  value,
  label,
  small,
}: {
  value: string | number;
  label: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/[0.03] p-3 text-center">
      <p className={`font-extrabold text-amber-300 ${small ? "text-sm" : "text-xl"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-zinc-500">{label}</p>
    </div>
  );
}

function PosterRow({
  label,
  items,
}: {
  label: string;
  items: { key: string; poster: string | null }[];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="flex gap-2 overflow-x-auto">
        {items.map((item) => (
          <div key={item.key} className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
            {item.poster && <Image src={item.poster} alt="" fill className="object-cover" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="mx-auto flex max-w-xs flex-col gap-2">
      <textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="¿Qué pasa con este perfil?"
        rows={2}
        className="rounded-xl border border-white/20 bg-black/25 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-500"
      />
      <div className="flex justify-center gap-2">
        <button
          onClick={() => reason.trim() && onSubmit(reason.trim())}
          disabled={!reason.trim()}
          className="rounded-full bg-amber-300 px-3 py-1.5 text-xs font-extrabold text-black disabled:opacity-40"
        >
          Enviar
        </button>
        <button onClick={onCancel} className="text-xs text-zinc-500">
          Cancelar
        </button>
      </div>
    </div>
  );
}
