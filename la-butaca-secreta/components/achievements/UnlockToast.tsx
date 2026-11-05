"use client";

import { useEffect, useState } from "react";

import { BETA_TESTER_KEY, familyByKey, TIER_NAMES } from "@/lib/achievements/catalog";
import { recordShareEvent } from "@/lib/supabase/achievements";
import { track } from "@/lib/analytics";
import { ShareIcon } from "@/components/icons/Icons";
import { SITE_NAME } from "@/lib/site";
import Medal, { BetaMedal } from "./Medal";

type UnlockedLevel = { key: string; level: number };

type Props = {
  userId: string;
  unlocked: UnlockedLevel[];
  onDone: () => void;
};

const AUTO_DISMISS_MS = 4500;

/**
 * Aviso al desbloquear un logro: aparece flotando abajo, se disuelve
 * solo. Si hay varios nuevos a la vez, se muestran en cola, uno detrás
 * de otro. Fiel a UnlockToast.dc.html. En Platino/Diamante añade un
 * botón de compartir directo (sin esperar a un push, ver
 * MejorasEngagement.dc.html).
 */
export default function UnlockToast({ userId, unlocked, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const current = unlocked[index];

  useEffect(() => {
    if (!current) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);

      setTimeout(() => {
        if (index + 1 < unlocked.length) {
          setIndex((i) => i + 1);
        } else {
          onDone();
        }
      }, 250);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current?.key, current?.level]);

  if (!current) return null;

  const isBeta = current.key === BETA_TESTER_KEY;
  const family = isBeta ? null : familyByKey(current.key);
  if (!isBeta && !family) return null;

  const rare = !isBeta && current.level >= 4;

  async function share() {
    const text = `Acabo de conseguir "${family!.levelNames[current.level - 1]}" (${TIER_NAMES[current.level - 1]}) en ${family!.name} en ${SITE_NAME}.`;

    track("share_done", { screen: "achievement", method: "native" });
    await recordShareEvent(userId, "summary");

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // cancelado por la persona, no hace falta hacer nada
      }
    }
  }

  return (
    <div
      className={`fixed inset-x-0 z-50 flex justify-center px-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ top: "max(1.25rem, env(safe-area-inset-top))" }}
    >
      <div className="flex max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/95 px-4 py-3 shadow-2xl backdrop-blur">
        {isBeta ? (
          <BetaMedal size={40} />
        ) : (
          <Medal icon={family!.icon} tier={current.level as 1 | 2 | 3 | 4 | 5} size={40} />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            {isBeta ? "Logro desbloqueado" : `Logro desbloqueado · ${TIER_NAMES[current.level - 1]}`}
          </div>
          <div className="text-sm font-bold text-white">
            {isBeta ? "Beta tester" : family!.levelNames[current.level - 1]}
          </div>
          <div className="text-xs text-zinc-500">
            {isBeta ? "Gracias por estar desde el principio" : family!.name}
          </div>
        </div>
        {rare && (
          <button
            type="button"
            onClick={share}
            aria-label="Compartir logro"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 hover:bg-amber-400/25"
          >
            <ShareIcon size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
