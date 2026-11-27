import { NextResponse } from "next/server";
import webpush from "web-push";

import { VAPID_PUBLIC_KEY } from "@/lib/push/config";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import { supabaseRpcAsUser } from "@/lib/supabase/rest";

/**
 * Avisa al dueño de una lista de que alguien acaba de darle "me gusta"
 * o de comentar. Lo llama el navegador de quien lo hace, justo después
 * (lib/push/client.ts → notifyListOwner). La base de datos
 * (push_targets, supabase/push.sql) comprueba con su sesión que lo ha
 * hecho de verdad hace menos de 2 minutos y que la lista es de otra
 * persona; si no, no devuelve a nadie y no se envía nada.
 *
 * Sin VAPID_PRIVATE_KEY en Vercel, no hace nada (204).
 */

type Target = {
  endpoint: string;
  p256dh: string;
  auth: string;
  actor_username: string | null;
  list_name: string;
  comment_body: string | null;
};

const privateKey = process.env.VAPID_PRIVATE_KEY;

export async function POST(request: Request) {
  if (!privateKey) return new NextResponse(null, { status: 204 });

  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (!token) return new NextResponse(null, { status: 401 });

  let body: { kind?: unknown; listId?: unknown };

  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const kind = body.kind === "like" || body.kind === "comment" ? body.kind : null;
  const listId = typeof body.listId === "string" ? body.listId : null;

  if (!kind || !listId || !/^[0-9a-f-]{36}$/i.test(listId)) {
    return new NextResponse(null, { status: 400 });
  }

  const targets = await supabaseRpcAsUser<Target[]>(
    "push_targets",
    { p_kind: kind, p_list_id: listId },
    token
  );

  if (!Array.isArray(targets) || targets.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  webpush.setVapidDetails(`mailto:${CONTACT_EMAIL}`, VAPID_PUBLIC_KEY, privateKey);

  const who = targets[0].actor_username
    ? `@${targets[0].actor_username}`
    : "Alguien";
  const list = targets[0].list_name;
  const comment = targets[0].comment_body;

  const payload = JSON.stringify(
    kind === "like"
      ? {
          title: "Nuevo me gusta",
          body: `${who} le ha dado me gusta a tu lista «${list}»`,
          url: `${SITE_URL}/lista/${listId}`,
          tag: `like-${listId}`,
        }
      : {
          title: `${who} ha comentado en «${list}»`,
          body: comment ? comment.slice(0, 140) : "Nuevo comentario en tu lista",
          url: `${SITE_URL}/lista/${listId}#comentarios`,
          tag: `comment-${listId}`,
        }
  );

  await Promise.all(
    targets.map(async (target) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: target.endpoint,
            keys: { p256dh: target.p256dh, auth: target.auth },
          },
          payload,
          { TTL: 60 * 60 * 24 }
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;

        // 404/410: ese dispositivo ya no acepta avisos; se olvida.
        if (status === 404 || status === 410) {
          await supabaseRpcAsUser(
            "forget_push_subscription",
            { p_endpoint: target.endpoint },
            token
          );
        }
      }
    })
  );

  return new NextResponse(null, { status: 204 });
}
