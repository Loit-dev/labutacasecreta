"use client";

import { supabase } from "./client";

export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  reason: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("reports").insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      reason,
    });

    return !error;
  } catch (error) {
    console.error("No se pudo enviar el reporte:", error);

    return false;
  }
}

export async function reportList(
  reporterId: string,
  reportedListId: string,
  reason: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("reports").insert({
      reporter_id: reporterId,
      reported_list_id: reportedListId,
      reason,
    });

    return !error;
  } catch (error) {
    console.error("No se pudo enviar el reporte:", error);

    return false;
  }
}
