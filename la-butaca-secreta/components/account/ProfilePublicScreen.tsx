"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useProfile } from "@/hooks/useProfile";
import { computeCompatibility, MIN_COMMON_RATED } from "@/lib/compatibility";
import { findSharedPerson, type SharedPerson } from "@/lib/compatibilityExtras";
import { genreEmoji } from "@/lib/genreEmoji";
import { buildSummary } from "@/lib/summary";
import { fetchWatchedHistory, type WatchedRow } from "@/lib/supabase/summary";
import { fetchPendingSyncFor, type PendingSyncItem } from "@/lib/supabase/pendingSync";
import { fetchLists, type ListRow } from "@/lib/supabase/lists";
import { follow, isFollowing, unfollow } from "@/lib/supabase/follows";
import { fetchFriendStatus, sendFriendRequest, type FriendStatus } from "@/lib/supabase/friends";
import { reportUser } from "@/lib/supabase/reports";
import { fetchSocialCounts, type SocialCounts } from "@/lib/supabase/socialCounts";
import type { ProfileRow } from "@/lib/supabase/profiles";
import { useRejected } from "@/hooks/useRejected";
import { LockIcon } from "@/components/icons/Icons";

import ShareProfileDialog from "./ShareProfileDialog";
import ShareCompatibilityDialog from "./ShareCompatibilityDialog";
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
  // Mi propio historial, para comparar con el de arriba y calcular la
  // compatibilidad (lib/compatibility.ts). Solo hace falta si no es
  // mi propio perfil.
  const [myHistory, setMyHistory] = useState<WatchedRow[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof buildSummary> | null>(null);
  const [pending, setPending] = useState<PendingSyncItem[]>([]);
  const [lists, setLists] = useState<ListRow[]>([]);
  const [following, setFollowing] = useState(false);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [showShare, setShowShare] = useState(false);
  const [showShareCompat, setShowShareCompat] = useState(false);
  // Actor/actriz o director que se repite entre los títulos en los
  // que más coincidís (dato extra de la tarjeta de compatibilidad).
  // Se calcula aparte porque hace falta pedir el reparto a TMDb
  // (lib/compatibilityExtras.ts), a diferencia del resto de la
  // tarjeta que sale directo del historial ya cargado.
  const [sharedPerson, setSharedPerson] = useState<SharedPerson | null>(null);
  const [showRecommend, setShowRecommend] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [openGrid, setOpenGrid] = useState<"total" | "pending" | "discarded" | null>(null);
  const [openList, setOpenList] = useState<ListRow | null>(null);
  const [socialCounts, setSocialCounts] = useState<SocialCounts | null>(null);

  // "Descartadas" solo existe en local (lib/rejected.ts): no hay forma
  // de leer las de otra persona, así que ese cuadro solo tiene datos
  // reales cuando es tu propio perfil.
  const rejected = useRejected();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [historyRows, myHistoryRows, pendingItems, listRows, follows, friend, counts] =
        await Promise.all([
          fetchWatchedHistory(profile.userId),
          isMe ? Promise.resolve([]) : fetchWatchedHistory(viewerId),
          fetchPendingSyncFor(profile.userId),
          fetchLists(profile.userId),
          isMe ? Promise.resolve(false) : isFollowing(viewerId, profile.userId),
          isMe
            ? Promise.resolve({ status: "none" as FriendStatus, requestId: null })
            : fetchFriendStatus(viewerId, profile.userId),
          fetchSocialCounts(profile.userId),
        ]);

      if (cancelled) return;

      setHistory(historyRows);
      setMyHistory(myHistoryRows);
      setStats(buildSummary(historyRows));
      setPending(pendingItems);
      setLists(listRows);
      setFollowing(follows);
      setFriendStatus(friend.status);
      setSocialCounts(counts);
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

    if (ok) {
      setFollowing(!following);
      setSocialCounts((current) =>
        current
          ? { ...current, followers: current.followers + (following ? -1 : 1) }
          : current
      );
    }
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

  // Solo tiene sentido frente a otra persona. Si no hay ni un título
  // en común (commonCount === 0) no se enseña la tarjeta más abajo:
  // no merece la pena decir solo "0 en común".
  const compatibility = isMe ? null : computeCompatibility(myHistory, history);

  // Una clave estable de los 3 títulos en los que más coincidís, para
  // no repetir la petición del reparto si el resto del historial
  // cambia pero esos 3 títulos no.
  const topCommonKey =
    compatibility?.status === "ready"
      ? compatibility.topCommon
          .map((t) => `${t.mediaType}-${t.tmdbId}`)
          .join(",")
      : "";

  useEffect(() => {
    let cancelled = false;

    const titles = topCommonKey
      ? topCommonKey.split(",").map((entry) => {
          const [mediaType, tmdbId] = entry.split("-");
          return { mediaType: mediaType as "movie" | "tv", tmdbId: Number(tmdbId) };
        })
      : [];

    const result = titles.length > 0 ? findSharedPerson(titles) : Promise.resolve(null);

    result.then((person) => {
      if (!cancelled) setSharedPerson(person);
    });

    return () => {
      cancelled = true;
    };
  }, [topCommonKey]);

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

        {socialCounts && (
          <div className="mt-1 flex items-center gap-4 text-xs text-zinc-400">
            <span>
              <span className="font-extrabold text-white">{socialCounts.following}</span> Siguiendo
            </span>
            <span>
              <span className="font-extrabold text-white">{socialCounts.followers}</span> Seguidores
            </span>
            <span>
              <span className="font-extrabold text-white">{socialCounts.friends}</span> Amigos
            </span>
          </div>
        )}
      </div>

      {compatibility && compatibility.commonCount > 0 && (
        <div
          className="relative rounded-[22px] p-[2px]"
          style={{
            background:
              "linear-gradient(135deg, rgba(251,146,60,0.55), rgba(252,211,77,0.15) 60%, rgba(255,255,255,0.08))",
          }}
        >
          <div
            className="flex flex-col gap-2.5 rounded-[20px] p-4"
            style={{
              background:
                "radial-gradient(120% 140% at 15% 0%, rgba(251,146,60,0.16), transparent 55%), #121214",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">
                Compatibilidad
              </span>
              <div className="flex items-center gap-2">
                {compatibility.status === "ready" && (
                  <span className="text-[10px] font-bold text-zinc-500">
                    {compatibility.commonRatedCount} valoradas por ambos
                  </span>
                )}
                {compatibility.status === "ready" && viewerProfile && (
                  <button
                    onClick={() => setShowShareCompat(true)}
                    aria-label="Compartir compatibilidad"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber-300"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v.01" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {compatibility.status === "ready" ? (
              <>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="text-3xl leading-none">{compatibility.icon}</div>
                    <div
                      className="bg-clip-text text-4xl font-black leading-none text-transparent"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, #ffffff 40%, #fb923c)",
                      }}
                    >
                      {compatibility.percent}%
                    </div>
                  </div>
                  <div className="mt-1 text-sm font-extrabold text-amber-300">
                    {compatibility.label}
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-zinc-300">
                  Habéis visto{" "}
                  <strong
                    className="bg-clip-text font-extrabold text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, #ffffff 40%, #fb923c)",
                    }}
                  >
                    {compatibility.commonCount}
                  </strong>{" "}
                  título{compatibility.commonCount === 1 ? "" : "s"} en común.
                </p>

                {compatibility.topCommon.length > 0 && (
                  <div className="my-1 flex items-end justify-center">
                    {(
                      // La que más coincide (índice 0) va al centro: hay
                      // que colocarla físicamente en medio del DOM (no
                      // solo marcarla "grande"), si no el flex la deja
                      // la primera, es decir a la izquierda.
                      compatibility.topCommon.length === 3
                        ? [1, 0, 2]
                        : compatibility.topCommon.map((_, i) => i)
                    ).map((index) => {
                      const title = compatibility.topCommon[index];
                      // La que más coincide (la primera) va al centro,
                      // grande y recta; las otras dos a los lados, más
                      // pequeñas y giradas — mismo abanico que en el
                      // resto de tarjetas (lib/summaryImage.ts).
                      const isCenter = index === 0;
                      const rotation = index === 1 ? -10 : index === 2 ? 10 : 0;
                      const overlap = index === 0 ? "" : index === 1 ? "-mr-3" : "-ml-3";

                      return (
                        <Link
                          key={`${title.mediaType}-${title.tmdbId}`}
                          href={`/${title.mediaType === "tv" ? "serie" : "pelicula"}/${title.tmdbId}`}
                          title={title.title}
                          style={{
                            transform: `rotate(${rotation}deg)`,
                            zIndex: isCenter ? 10 : 0,
                          }}
                          className={`relative shrink-0 overflow-hidden rounded-lg border border-white/15 bg-zinc-800 shadow-lg ${overlap} ${
                            isCenter ? "h-[104px] w-[70px]" : "h-[86px] w-[58px]"
                          }`}
                        >
                          {title.posterUrl ? (
                            <Image
                              src={title.posterUrl}
                              alt=""
                              fill
                              sizes="70px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center p-1 text-center text-[8px] text-zinc-500">
                              {title.title}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {compatibility.topGenres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {compatibility.topGenres.map((genre) => (
                      <span
                        key={genre.name}
                        className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-zinc-300"
                      >
                        {genreEmoji(genre.name)} {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* El gancho: actor/director en común o, si no hay
                    ninguno (lo normal con solo 3 títulos), el género
                    que más se repite — nunca se queda sin este dato.
                    Chip rojo, como el de la URL al pie de la imagen
                    que se comparte, pero con letra más pequeña. */}
                {(sharedPerson || compatibility.topGenres.length > 0) && (
                  <div className="flex justify-center">
                    <span
                      className="inline-block rounded-full px-3 py-1.5 text-[11px] font-extrabold leading-snug text-white"
                      style={{
                        background: "linear-gradient(90deg, #b91c1c, #ea580c)",
                      }}
                    >
                      {sharedPerson?.role === "director" &&
                        `La mano de ${sharedPerson.name}`}
                      {sharedPerson?.role === "actor" &&
                        `Os convence ${sharedPerson.name} en pantalla`}
                      {!sharedPerson &&
                        `${genreEmoji(compatibility.topGenres[0].name)} Los dos sois fans de ${compatibility.topGenres[0].name}`}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl">❔</span>
                <p className="text-xs text-zinc-400">
                  Aún tenéis pocas pelis en común valoradas por los dos (
                  {compatibility.commonRatedCount}/{MIN_COMMON_RATED}) para
                  calcularlo.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
      {showShareCompat && compatibility?.status === "ready" && viewerProfile && (
        <ShareCompatibilityDialog
          myUsername={viewerProfile.username}
          theirUsername={profile.username}
          percent={compatibility.percent}
          icon={compatibility.icon}
          label={compatibility.label}
          commonRatedCount={compatibility.commonRatedCount}
          topCommon={compatibility.topCommon.map((t) => ({
            title: t.title,
            posterUrl: t.posterUrl,
          }))}
          topGenres={compatibility.topGenres}
          sharedPerson={sharedPerson}
          onClose={() => setShowShareCompat(false)}
        />
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
