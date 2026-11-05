"use client";

import { useState } from "react";

import { familyByKey, TIER_NAMES } from "@/lib/achievements/catalog";
import { computeAchievements, type AchievementsState } from "@/lib/achievements/compute";
import { fetchAchievementWatchedRows } from "@/lib/supabase/achievements";
import { useAchievementsContext } from "./AchievementsProvider";
import AchievementIcon from "./AchievementIcon";

// Familias que se pueden comparar con cualquier otra cuenta sin
// permiso especial: solo las que se calculan a partir del historial
// de "vistos" (visible entre seguidores). Amigos/Compatibilidad/
// Compartir/Recomendaciones/Listas son privadas de cada cuenta (RLS)
// y no se pueden leer de otra persona desde el cliente, así que se
// excluyen de la comparación en vez de enseñar un "0" engañoso.
const COMPARABLE_GENERAL_KEYS = [
  "volumen_diario",
  "total_visto",
  "racha",
  "valoraciones",
  "valoraciones_bajas",
  "nota_media",
  "generos_vistos",
];

type Diff = { key: string; myLevel: number; theirLevel: number };

function topDifferences(mine: AchievementsState, theirs: AchievementsState): Diff[] {
  const theirByKey = new Map(
    [...theirs.general, ...theirs.genero].map((p) => [p.key, p.level])
  );

  const diffs: Diff[] = [...mine.general, ...mine.genero]
    .filter(
      (p) =>
        COMPARABLE_GENERAL_KEYS.includes(p.key) || p.key.startsWith("genero_")
    )
    .map((p) => ({ key: p.key, myLevel: p.level, theirLevel: theirByKey.get(p.key) ?? 0 }))
    .filter((d) => d.myLevel !== d.theirLevel);

  // Las de mayor diferencia primero, pero alternando signo para que
  // siempre haya algo donde ganas y algo donde pierdes (motiva sin
  // desanimar) — no solo la lista ordenada por diferencia absoluta.
  const ahead = diffs.filter((d) => d.myLevel > d.theirLevel).sort((a, b) => (b.myLevel - b.theirLevel) - (a.myLevel - a.theirLevel));
  const behind = diffs.filter((d) => d.myLevel < d.theirLevel).sort((a, b) => (b.theirLevel - b.myLevel) - (a.theirLevel - a.myLevel));

  const picked: Diff[] = [];
  for (let i = 0; i < Math.max(ahead.length, behind.length) && picked.length < 3; i++) {
    if (behind[i]) picked.push(behind[i]);
    if (picked.length < 3 && ahead[i]) picked.push(ahead[i]);
  }

  return picked.slice(0, 3);
}

type Props = {
  theirUserId: string;
  theirName: string;
};

/** Sección colapsable en el perfil de un amigo: "Comparar logros". Fiel a MejorasEngagement.dc.html. */
export default function CompareAchievements({ theirUserId, theirName }: Props) {
  const { state: myState } = useAchievementsContext();
  const [open, setOpen] = useState(false);
  const [theirState, setTheirState] = useState<AchievementsState | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);

    if (!theirState) {
      setLoading(true);

      const rows = await fetchAchievementWatchedRows(theirUserId);
      const computed = computeAchievements({
        watched: rows,
        friendsCount: 0,
        compatibleFriendsCount: 0,
        listsCount: 0,
        recommendationsSentCount: 0,
        shareEventsCount: 0,
      });

      setTheirState(computed);
      setLoading(false);
    }
  }

  if (!myState) return null;

  const diffs = theirState ? topDifferences(myState, theirState) : [];

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-full items-center justify-between text-sm font-bold text-amber-300"
      >
        Comparar logros
        <span className="text-xs text-zinc-500">{open ? "ocultar" : "ver"}</span>
      </button>

      {open && (
        <div className="mt-3">
          {loading && <p className="text-xs text-zinc-500">Calculando…</p>}

          {!loading && diffs.length === 0 && theirState && (
            <p className="text-xs text-zinc-500">Vais igualados en los logros que se pueden comparar.</p>
          )}

          {!loading &&
            diffs.map((d) => {
              const family = familyByKey(d.key);
              if (!family) return null;

              return (
                <div key={d.key} className="flex items-center gap-2.5 border-t border-white/5 py-2 first:border-t-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-zinc-400">
                    <AchievementIcon icon={family.icon} size={13} />
                  </div>
                  <span className="flex-1 text-xs font-semibold text-white">{family.name}</span>
                  <Badge label={`Tú · ${d.myLevel > 0 ? TIER_NAMES[d.myLevel - 1] : "—"}`} tone="mine" />
                  <Badge label={`${theirName} · ${d.theirLevel > 0 ? TIER_NAMES[d.theirLevel - 1] : "—"}`} tone="theirs" />
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: "mine" | "theirs" }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold ${
        tone === "mine" ? "bg-sky-400/15 text-sky-300" : "bg-violet-400/15 text-violet-300"
      }`}
    >
      {label}
    </span>
  );
}
