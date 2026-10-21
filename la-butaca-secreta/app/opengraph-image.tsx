import { ImageResponse } from "next/og";

// Imagen que se ve al compartir el enlace (WhatsApp, X, iMessage, Google…)
export const alt =
  "La Butaca Secreta · Tres películas o series para decidir qué ver";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          color: "#fafafa",
          background:
            "linear-gradient(135deg, #1c0707 0%, #09090b 55%, #0b1220 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#ef4444",
          }}
        >
          La Butaca Secreta
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 28,
            fontSize: 86,
            fontWeight: 800,
            lineHeight: 1.05,
          }}
        >
          <span>Descubre historias</span>

          <span style={{ color: "#f97316" }}>
            hechas para ti.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 34,
            color: "#a1a1aa",
          }}
        >
          Tres películas o series. Sin listas infinitas.
        </div>
      </div>
    ),
    { ...size }
  );
}
