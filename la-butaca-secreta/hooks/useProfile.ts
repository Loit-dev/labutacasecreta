"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchMyProfile, type ProfileRow } from "@/lib/supabase/profiles";

/** El perfil (username) de la cuenta logueada, o null si aún no lo ha creado. */
export function useProfile(userId: string) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    fetchMyProfile(userId).then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { profile, loading, reload };
}
