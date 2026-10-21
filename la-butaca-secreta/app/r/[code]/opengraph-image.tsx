import { ImageResponse } from "next/og";

import { formatNames } from "@/lib/group";
import { parseShareCode } from "@/lib/shareLink";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getSharedRecommendations } from "@/lib/tmdb/shared";

// Vista previa del enlace (WhatsApp, Telegram, X, iMessage…):
// los pósters de las recomendaciones compartidas.
export const alt = "Mis sugerencias · La Butaca Secreta";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

// Descarga un póster y lo convierte en data URL (si falla, queda vacío)
async function posterData(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const type = response.headers.get("content-type") ?? "";

    // Solo formatos que el generador de imágenes entiende
    if (!/image\/(jpeg|png|gif)/.test(type)) return null;

    const bytes = Buffer.from(await response.arrayBuffer());

    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function SharedOpenGraphImage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const set = parseShareCode(code);

  let posters: (string | null)[] = [];

  try {
    if (set) {
      const items = await getSharedRecommendations(set);

      posters = await Promise.all(
        items.slice(0, 3).map((item) => posterData(item.poster))
      );
    }
  } catch {
    posters = [];
  }

  const what = set?.type === "tv" ? "Series" : "Películas";

  const group = set?.group;

  const title = group
    ? `Sugerencias para ${formatNames(group.names)}`
    : "Mis sugerencias";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "40px 60px",
          color: "#fafafa",
          background:
            "linear-gradient(135deg, #1c0707 0%, #09090b 55%, #0b1220 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 440,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: "#ef4444",
            }}
          >
            {SITE_NAME}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: group ? 54 : 78,
              fontWeight: 800,
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 32,
              color: "#d4d4d8",
            }}
          >
            {what} para ver hoy
          </div>

          {group ? (
            <div
              style={{
                display: "flex",
                marginTop: 14,
                fontSize: 34,
                fontWeight: 700,
                color: "#fb923c",
              }}
            >
              {group.percent} % de coincidencia
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              marginTop: 40,
              fontSize: 26,
              color: "#fb923c",
            }}
          >
            {SITE_URL.replace(/^https?:\/\//, "")}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginLeft: "auto",
            gap: 22,
          }}
        >
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              style={{
                display: "flex",
                width: 220,
                height: 330,
                borderRadius: 18,
                overflow: "hidden",
                background: "#27272a",
                border: "2px solid rgba(255,255,255,0.25)",
              }}
            >
              {posters[index] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={posters[index] as string}
                  width={220}
                  height={330}
                  alt=""
                  style={{ objectFit: "cover" }}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
