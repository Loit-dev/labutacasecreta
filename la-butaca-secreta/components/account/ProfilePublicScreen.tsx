"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useProfile } from "@/hooks/useProfile";
import { buildSummary } from "@/lib/summary";
import { fetchWatchedHistory, type WatchedRow } from "@/lib/supabase/summary";
import { fetchPendingSyncFor, type PendingSyncItem } from "@/lib/supabase/pendingSync";
import { fetchLists, type ListRow } from "@/lib/supabase/lists";
import { follow, isFollowing, unfollow } from "@/lib/supabase/follows";
import { fetchFriendStatus, sendFriendRequest, type FriendStatus } from "@/lib/supabase/friends";
import { reportUser } from "@/lib/supabase/reports";
import type { ProfileRow } from "@/lib/supabase/profiles";
import { useRejected } from "@/hooks/useRejected";
import { LockIcon } from "@/components/icons/Icons";

import ShareProfileDialog from "./ShareProfileDialog";
import RecommendDialog from "./RecommendDialog";
import TitleGridDialog, { type TitleGridItem } from "./TitleGridDialog";

type Props = {
  viewerId: string;
  profile: ProfileRow;
};

// Mismos colores oro/plata/bronce que el ranking de géneros de "Mi
// resumen" (GENRE_RANKS en MiResumenScreen.tsx), adaptados a cuadro.
const GENRE_RANK_STYLES = [
  { border: "border-yellow-500/40", text: "text-yellow-300" },
  { border: "border-zinc-300/30", text: "text-zinc-200" },
  { border: "border-orange-500/40", text: "text-orange-300" },
];

export default function ProfilePublicScreen({ viewerId, profile }: Props) {
  const isMe = viewerId === profile.userId;
  const router = useRouter();

  // Para seguir o pedir amistad hace falta haber creado el @usuario:
  // follows/friend_requests solo exigen estar logueado (auth.uid()),
  // así que sin esto alguien podía seguir sin perfil y quedar como
  // seguidor "fantasma" (sin nombre, sin foto, ver DECISIONS.md).
  const { profile: viewerProfile, loading: viewerProfileLoading } = useProfile(viewerId);

  const [history, setHistory] = useState<WatchedRow[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof buildSummary> | null>(null);
  const [pending, setPending] = useState<PendingSyncItem[]>([]);
  const [lists, setLists] = useState<ListRow[]>([]);
  const [following, setFollowing] = useState(false);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [showShare, setShowShare] = useState(false);
  const [showRecommend, setShowRecommend] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [openGrid, setOpenGrid] = useState<"total" | "pending" | "discarded" | null>(null);
  const [openList, setOpenList] = useState<ListRow | null>(null);

  // "Descartadas" solo existe en local (lib/rejected.ts): no hay forma
  // de leer las de otra persona, así que ese cuadro solo tiene datos
  // reales cuando es tu propio perfil.
  const rejected = useRejected();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [historyRows, pendingItems, listRows, follows, friend] =
        await Promise.all([
          fetchWatchedHistory(profile.userId),
          fetchPendingSyncFor(profile.userId),
          fetchLists(profile.userId),
          isMe ? Promise.resolve(false) : isFollowing(viewerId, profile.userId),
          isMe
            ? Promise.resolve({ status: "none" as FriendStatus, requestId: null })
            : fetchFriendStatus(viewerId, profile.userId),
        ]);

      if (cancelled) return;

      setHistory(historyRows);
      setStats(buildSummary(historyRows));
      setPending(pendingItems);
      setLists(listRows);
      setFollowing(follows);
      setFriendStatus(friend.status);
    })();

    return () => {
      cancelled = true;
    };
  }, [viewerId, profile.userId, isMe]);

  function goCreateUsername() {
    router.push("/mi-cuenta?tab=amigos");
  }

  async function handleFollow() {
    if (viewerProfileLoading) return;

    if (!viewerProfile) {
      goCreateUsername();
      return;
    }

    const ok = following
      ? await unfollow(viewerId, profile.userId)
      : await follow(viewerId, profile.userId);

    if (ok) setFollowing(!following);
  }

  async function handleFriendRequest() {
    if (viewerProfileLoading) return;

    if (!viewerProfile) {
      goCreateUsername();
      return;
    }

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
            <StatBox
              value={stats.totalWatched}
              label="Totales"
              valueClassName="text-white"
              onClick={stats.totalWatched > 0 ? () => setOpenGrid("total") : undefined}
            />
            <StatBox
              value={stats.monthCount}
              label="Este mes"
              valueClassName={stats.monthBadge ? "text-amber-300" : "text-white"}
            />
            <StatBox value={stats.streakDays} label="Racha" valueClassName="text-orange-300" />
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <StatBox
              value={stats.averageRating ? `★ ${stats.averageRating}` : "—"}
              label="Nota media"
              valueClassName="text-amber-300"
            />
            <StatBox
              value={pending.length}
              label="Pendientes"
              valueClassName="text-white"
              onClick={pending.length > 0 ? () => setOpenGrid("pending") : undefined}
            />
            {isMe ? (
              <StatBox
                value={rejected.count}
                label="Descartadas"
                valueClassName="text-zinc-300"
                onClick={rejected.count > 0 ? () => setOpenGrid("discarded") : undefined}
              />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-center">
                <p className="flex items-center justify-center text-zinc-500">
                  <LockIcon size={20} />
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-500">
                  Descartadas (privado)
                </p>
              </div>
            )}
          </div>

          {stats.topGenres.length > 0 && (
            <div className="mt-2 flex flex-col gap-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Tus géneros
              </p>
              <div className="grid grid-cols-3 gap-2">
                {stats.topGenres.map((genre, index) => {
                  const rank = GENRE_RANK_STYLES[index];

                  return (
                    <div
                      key={genre.name}
                      className={`rounded-2xl border bg-black/30 p-3 text-center ${rank.border}`}
                    >
                      <p className={`truncate text-sm font-extrabold ${rank.text}`}>
                        {genre.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-zinc-500">
                        {genre.count} {genre.count === 1 ? "vista" : "vistas"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {openGrid === "total" && (
        <TitleGridDialog
          title="Totales"
          subtitle={`${history.length} título${history.length === 1 ? "" : "s"} vistos`}
          items={history.map(
            (row): TitleGridItem => ({
              key: `${row.mediaType}-${row.tmdbId}`,
              id: row.tmdbId,
              type: row.mediaType,
              title: row.title,
              poster: row.posterUrl,
            })
          )}
          emptyText="Todavía no ha marcado ningún título como visto."
          onClose={() => setOpenGrid(null)}
        />
      )}

      {openGrid === "pending" && (
        <TitleGridDialog
          title="Pendientes"
          subtitle={`${pending.length} título${pending.length === 1 ? "" : "s"} guardados`}
          items={pending.map(
            (p): TitleGridItem => ({
              key: `${p.mediaType}-${p.tmdbId}`,
              id: p.tmdbId,
              type: p.mediaType,
              title: p.title,
              poster: p.posterUrl,
            })
          )}
          emptyText="Sin pendientes guardados."
          onClose={() => setOpenGrid(null)}
        />
      )}

      {openGrid === "discarded" && isMe && (
        <TitleGridDialog
          title="Descartadas"
          subtitle={`${rejected.count} título${rejected.count === 1 ? "" : "s"} descartados`}
          items={rejected.items.map(
            (item): TitleGridItem => ({
              key: `${item.type}-${item.id}`,
              id: item.id,
              type: item.type,
              title: item.title,
              poster: item.poster,
            })
          )}
          emptyText="No has descartado ningún título."
          onClose={() => setOpenGrid(null)}
        />
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
              <button
                key={list.id}
                type="button"
                onClick={() => setOpenList(list)}
                className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-white/30"
              >
                <span className="flex-1 text-sm font-bold text-white">{list.name}</span>
                <span className="text-xs text-zinc-500">{list.items.length} títulos</span>
              </button>))}
          </div>
        )}
      </div>

      {openList && (
        <TitleGridDialog
          title={openList.name}
          subtitle={`${openList.items.length} título${openList.items.length === 1 ? "" : "s"}`}
          items={openList.items.map(
            (item): TitleGridItem => ({
              key: item.id,
              id: item.tmdbId,
              type: item.mediaType,
              title: item.title,
              poster: item.posterUrl,
            })
          )}
          emptyText="Esta lista todavía no tiene títulos."
          onClose={() => setOpenList(null)}
        />
      )}

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
  onClick,
  valueClassName = "text-amber-300",
}: {
  value: string | number;
  label: string;
  small?: boolean;
  onClick?: () => void;
  valueClassName?: string;
}) {
  const content = (
    <>
      <p className={`font-extrabold ${valueClassName} ${small ? "text-sm" : "text-xl"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-zinc-500">{label}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-2xl border border-white/20 bg-white/[0.03] p-3 text-center transition-colors active:bg-white/10"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-white/[0.03] p-3 text-center">
      {content}
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
