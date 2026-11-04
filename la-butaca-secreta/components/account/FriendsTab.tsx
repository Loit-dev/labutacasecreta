"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";

import { useProfile } from "@/hooks/useProfile";
import { computeCompatibility, type Compatibility } from "@/lib/compatibility";
import { fetchFeed, groupFeedItems, type FeedGroup, type FeedItem } from "@/lib/supabase/feed";
import { fetchFollowingIds, fetchFollowerIds } from "@/lib/supabase/follows";
import { fetchFriends } from "@/lib/supabase/friends";
import { fetchProfilesByUserIds, type ProfileRow } from "@/lib/supabase/profiles";
import { fetchNotifications, countBadge } from "@/lib/supabase/notifications";
import { fetchWatchedHistory, type WatchedRow } from "@/lib/supabase/summary";

import UsernameSetup from "./UsernameSetup";
import BuscarAmigosDialog from "./BuscarAmigosDialog";
import FeedGroupDialog from "./FeedGroupDialog";
import NotificacionesDialog from "./NotificacionesDialog";
import ShareProfileDialog from "./ShareProfileDialog";

type Props = {
  session: Session;
};

// Cuántas personas se enseñan de entrada en Siguiendo/Seguidores/
// Amigos antes de necesitar "Ver más" (puede haber muchísimas).
const PEOPLE_PAGE = 5;

export default function FriendsTab({ session }: Props) {
  const userId = session.user.id;
  const { profile, loading, reload } = useProfile(userId);

  if (loading) {
    return <p className="text-center text-sm text-zinc-300">Cargando…</p>;
  }

  if (!profile) {
    return <UsernameSetup userId={userId} onCreated={reload} />;
  }

  return <FriendsContent userId={userId} username={profile.username} />;
}

function FriendsContent({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  const [feed, setFeed] = useState<{
    items: FeedItem[];
    profiles: Map<string, ProfileRow>;
  } | null>(null);
  type PeopleTab = "following" | "followers" | "friends";
  const [people, setPeople] = useState<Record<PeopleTab, ProfileRow[]>>({
    following: [],
    followers: [],
    friends: [],
  });
  const [activeTab, setActiveTab] = useState<PeopleTab>("following");
  // Para no soltar de golpe una lista de gente que puede ser larga:
  // se corta a PEOPLE_PAGE y un chip "Ver más" la va ampliando. Se
  // reinicia cada vez que se cambia de pestaña (Siguiendo/Seguidores/
  // Amigos), para no arrastrar lo expandido de una a otra.
  const [visibleCount, setVisibleCount] = useState(PEOPLE_PAGE);
  const [counts, setCounts] = useState({ following: 0, followers: 0, friends: 0 });
  const [badge, setBadge] = useState(0);

  // Mi propio historial, para comparar con el de cada persona y sacar
  // el % de compatibilidad (lib/compatibility.ts) de la lista de
  // abajo. Se calcula por persona y solo para las que se ven ahora
  // mismo (visibleCount), no para toda la lista de golpe.
  const [myHistory, setMyHistory] = useState<WatchedRow[]>([]);
  const [compatByUser, setCompatByUser] = useState<Map<string, Compatibility>>(
    new Map()
  );
  const fetchingCompat = useRef<Set<string>>(new Set());

  const [showBuscar, setShowBuscar] = useState(false);
  const [showNotificaciones, setShowNotificaciones] = useState(false);
  const [showCompartir, setShowCompartir] = useState(false);
  const [activeGroup, setActiveGroup] = useState<{ group: FeedGroup; name: string } | null>(null);

  async function load() {
    const [feedResult, followingIds, followerIds, friends, notifications, myHistoryRows] =
      await Promise.all([
        fetchFeed(userId),
        fetchFollowingIds(userId),
        fetchFollowerIds(userId),
        fetchFriends(userId),
        fetchNotifications(userId),
        fetchWatchedHistory(userId),
      ]);

    setFeed(feedResult);
    setBadge(countBadge(notifications));
    setMyHistory(myHistoryRows);

    const [followingProfiles, followerProfiles] = await Promise.all([
      fetchProfilesByUserIds(followingIds),
      fetchProfilesByUserIds(followerIds),
    ]);
    setPeople({ following: followingProfiles, followers: followerProfiles, friends });

    // El número de la pestaña tiene que ser el de la gente que
    // realmente se puede mostrar debajo: si alguien te sigue pero
    // nunca llegó a crear su @usuario, follows.follower_id existe
    // pero no hay fila en profiles, y antes el contador salía de
    // followerIds.length (3) mientras la lista salía de los perfiles
    // resueltos (2) — contaban cosas distintas.
    setCounts({
      following: followingProfiles.length,
      followers: followerProfiles.length,
      friends: friends.length,
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function closeNotificaciones() {
    setShowNotificaciones(false);
    setBadge(0);
  }

  function selectPeopleTab(tab: PeopleTab) {
    setActiveTab(tab);
    setVisibleCount(PEOPLE_PAGE);
  }

  // Calcula la compatibilidad solo con la gente que se ve ahora mismo
  // (según la pestaña y el "Ver más" ya desplegado), no con toda la
  // lista: evita pedir el historial de decenas de personas de golpe.
  // Si yo todavía no tengo nada visto y valorado, no hace falta ni
  // pedir el historial de nadie: siempre va a salir "not_enough".
  useEffect(() => {
    const visible = people[activeTab].slice(0, visibleCount);
    const pending = visible.filter(
      (p) => !compatByUser.has(p.userId) && !fetchingCompat.current.has(p.userId)
    );

    if (pending.length === 0) return;

    pending.forEach((p) => fetchingCompat.current.add(p.userId));

    if (myHistory.length === 0) {
      setCompatByUser((prev) => {
        const next = new Map(prev);
        pending.forEach((p) => {
          next.set(p.userId, {
            status: "not_enough",
            commonCount: 0,
            commonRatedCount: 0,
          });
          fetchingCompat.current.delete(p.userId);
        });
        return next;
      });
      return;
    }

    let cancelled = false;

    Promise.all(
      pending.map(async (p) => {
        const theirHistory = await fetchWatchedHistory(p.userId);
        return [p.userId, computeCompatibility(myHistory, theirHistory)] as const;
      })
    ).then((results) => {
      pending.forEach((p) => fetchingCompat.current.delete(p.userId));

      if (cancelled) return;

      setCompatByUser((prev) => {
        const next = new Map(prev);
        results.forEach(([id, compat]) => next.set(id, compat));
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, visibleCount, people, myHistory]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-white">Amigos</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCompartir(true)}
            aria-label="Compartir mi perfil"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-amber-300"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v.01" />
            </svg>
          </button>
          <button
            onClick={() => setShowBuscar(true)}
            aria-label="Buscar amigos"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button
            onClick={() => setShowNotificaciones(true)}
            aria-label={`Notificaciones${badge > 0 ? `, ${badge} pendientes` : ""}`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {badge > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white">
                {badge}
              </span>
            )}
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
          Novedades
        </p>

        {!feed && <p className="text-sm text-zinc-400">Cargando…</p>}

        {feed && feed.items.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 px-4 py-9 text-center">
            <p className="text-sm font-bold text-white">Aún no hay novedades</p>
            <p className="max-w-xs text-xs text-zinc-400">
              Cuando sigas a algún amigo, aquí verás lo que ve y las listas
              que crea.
            </p>
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => setShowBuscar(true)}
                className="rounded-full bg-amber-300 px-4 py-2 text-xs font-extrabold text-black"
              >
                Buscar amigos
              </button>
              <button
                onClick={() => setShowCompartir(true)}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-extrabold text-white"
              >
                Compartir mi perfil
              </button>
            </div>
          </div>
        )}

        {feed && feed.items.length > 0 && (
          <div className="flex flex-col gap-2">
            {groupFeedItems(feed.items).map((group, index) => {
              const first = group.items[0];
              const extra = group.items.length - 1;
              const p = feed.profiles.get(group.userId);
              const name = p?.displayName ?? p?.username ?? "Alguien";

              let verb: ReactNode;
              let posterUrl: string | null | undefined;

              if (first.kind === "watched") {
                verb = (
                  <>
                    vio <span className="font-bold">{first.title}</span>
                    {first.rating ? ` ★ ${first.rating}` : ""}
                  </>
                );
                posterUrl = first.posterUrl;
              } else if (first.kind === "list_item_added") {
                verb = (
                  <>
                    añadió <span className="font-bold">{first.title}</span> a la
                    lista <span className="font-bold">{first.listName}</span>
                  </>
                );
                posterUrl = first.posterUrl;
              } else {
                verb = (
                  <>
                    creó la lista{" "}
                    <span className="font-bold">{first.listName}</span>
                  </>
                );
                posterUrl = undefined;
              }

              return (
                <Link
                  key={index}
                  href={p ? `/u/${p.username}` : "#"}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-[11px] font-extrabold text-black">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[12.5px] leading-snug text-white">
                      <span className="font-bold">{name}</span> {verb}
                      {extra > 0 && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setActiveGroup({ group, name });
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              setActiveGroup({ group, name });
                            }
                          }}
                          className="ml-1 cursor-pointer font-bold text-amber-300 underline underline-offset-2"
                        >
                          y {extra}+
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-zinc-500">
                      {new Date(first.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  {posterUrl && (
                    <div className="relative h-12 w-[34px] shrink-0 overflow-hidden rounded bg-zinc-800">
                      <Image src={posterUrl} alt="" fill className="object-cover" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => selectPeopleTab("following")}
            className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
              activeTab === "following"
                ? "bg-amber-300/15 text-amber-300"
                : "text-zinc-400"
            }`}
          >
            Siguiendo · {counts.following}
          </button>
          <button
            type="button"
            onClick={() => selectPeopleTab("followers")}
            className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
              activeTab === "followers"
                ? "bg-amber-300/15 text-amber-300"
                : "text-zinc-400"
            }`}
          >
            Seguidores · {counts.followers}
          </button>
          <button
            type="button"
            onClick={() => selectPeopleTab("friends")}
            className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
              activeTab === "friends"
                ? "bg-amber-300/15 text-amber-300"
                : "text-zinc-400"
            }`}
          >
            Amigos · {counts.friends}
          </button>
        </div>

        <div className="mt-2.5 flex flex-col gap-1">
          {people[activeTab].length === 0 && (
            <p className="px-0.5 py-2 text-xs text-zinc-500">
              {activeTab === "following" && "Aún no sigues a nadie."}
              {activeTab === "followers" && "Todavía nadie te sigue."}
              {activeTab === "friends" && "Todavía no tienes amigos."}
            </p>
          )}
          {people[activeTab].slice(0, visibleCount).map((p) => {
            const compat = compatByUser.get(p.userId);

            return (
              <Link
                key={p.userId}
                href={`/u/${p.username}`}
                className="flex items-center gap-3 rounded-xl px-0.5 py-2"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-amber-400 text-[11px] font-extrabold text-black">
                  {p.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">
                    {p.displayName ?? p.username}
                  </p>
                  <p className="truncate text-xs text-zinc-500">@{p.username}</p>
                </div>

                {compat?.status === "ready" && (
                  <span className="shrink-0 rounded-full bg-amber-300/15 px-2.5 py-1 text-xs font-extrabold text-amber-300">
                    {compat.icon} {compat.percent}%
                  </span>
                )}
                {compat?.status === "not_enough" && (
                  <span
                    role="button"
                    tabIndex={0}
                    title="Pocas pelis en común valoradas por los dos"
                    aria-label="Pocas pelis en común valoradas por los dos"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                      }
                    }}
                    className="flex h-6 w-6 shrink-0 cursor-help items-center justify-center rounded-full bg-white/10 text-xs font-extrabold text-zinc-400"
                  >
                    ?
                  </span>
                )}
              </Link>
            );
          })}

          {people[activeTab].length > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PEOPLE_PAGE)}
              className="mt-1 self-center rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-bold text-zinc-300 transition-colors hover:border-white/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Ver más · {people[activeTab].length - visibleCount}
            </button>
          )}
        </div>
      </div>

      {showBuscar && (
        <BuscarAmigosDialog userId={userId} onClose={() => setShowBuscar(false)} />
      )}
      {showNotificaciones && (
        <NotificacionesDialog userId={userId} onClose={closeNotificaciones} />
      )}
      {showCompartir && (
        <ShareProfileDialog userId={userId} username={username} onClose={() => setShowCompartir(false)} />
      )}
      {activeGroup && (
        <FeedGroupDialog
          name={activeGroup.name}
          group={activeGroup.group}
          onClose={() => setActiveGroup(null)}
        />
      )}
    </div>
  );
}
