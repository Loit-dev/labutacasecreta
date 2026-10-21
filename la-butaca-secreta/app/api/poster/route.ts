import { POSTER_PATH } from "@/lib/share";

/**
 * Entrega un póster de TMDb desde nuestro propio dominio.
 *
 * Se usa para crear la imagen de «Compartir»: el navegador solo puede
 * guardar un canvas si todas sus imágenes son de la misma web.
 * Solo acepta rutas con forma de póster y siempre pide a image.tmdb.org.
 */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("p") ?? "";

  if (!POSTER_PATH.test(path)) {
    return new Response("Póster no válido", { status: 400 });
  }

  try {
    const upstream = await fetch(
      `https://image.tmdb.org/t/p/w500${path}`
    );

    if (!upstream.ok) {
      return new Response("Póster no encontrado", { status: 404 });
    }

    return new Response(await upstream.arrayBuffer(), {
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "image/jpeg",
        // Un póster no cambia: que lo recuerde el navegador y la CDN
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response("No se pudo cargar el póster", {
      status: 502,
    });
  }
}
