/**
 * Lectura de Supabase desde el servidor (rutas de API y páginas), sin
 * sesión: como un visitante anónimo, así que solo ve lo que las
 * políticas permiten a cualquiera (listas públicas, funciones con
 * `grant ... to anon`). Usa la API REST directamente con fetch para que
 * Next.js pueda cachear la respuesta (`revalidate`).
 *
 * Si Supabase no está configurado o falla, devuelve null y quien llama
 * decide qué enseñar.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function headers(): HeadersInit {
  return {
    apikey: anonKey ?? "",
    Authorization: `Bearer ${anonKey ?? ""}`,
    "Content-Type": "application/json",
  };
}

export async function supabaseRpc<T>(
  fn: string,
  args: Record<string, unknown>,
  revalidate: number
): Promise<T | null> {
  if (!url || !anonKey) return null;

  try {
    const response = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(args),
      next: { revalidate },
    });

    if (!response.ok) return null;

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function supabaseSelect<T>(
  pathAndQuery: string,
  revalidate: number
): Promise<T | null> {
  if (!url || !anonKey) return null;

  try {
    const response = await fetch(`${url}/rest/v1/${pathAndQuery}`, {
      headers: headers(),
      next: { revalidate },
    });

    if (!response.ok) return null;

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Llama a una función de Supabase con la sesión de quien hace la
 * petición (su token), para que auth.uid() sea esa persona. Sin caché.
 */
export async function supabaseRpcAsUser<T>(
  fn: string,
  args: Record<string, unknown>,
  accessToken: string
): Promise<T | null> {
  if (!url || !anonKey) return null;

  try {
    const response = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const text = await response.text();

    return (text ? JSON.parse(text) : null) as T;
  } catch {
    return null;
  }
}
