import Link from "next/link";

import { LEGAL_UPDATED, SITE_NAME } from "@/lib/site";

type Props = {
  title: string;
  children: React.ReactNode;
};

/**
 * Estructura común de las páginas de texto (privacidad y aviso legal).
 */
export default function LegalPage({
  title,
  children,
}: Props) {
  return (
    <main className="relative z-30 mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href="/"
        className="text-sm text-zinc-400 underline-offset-2 hover:text-white hover:underline"
      >
        ← Volver a {SITE_NAME}
      </Link>

      <h1
        className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
        style={{ fontFamily: "var(--font-manrope)" }}
      >
        {title}
      </h1>

      <p className="mt-2 text-sm text-zinc-500">
        Última actualización: {LEGAL_UPDATED}
      </p>

      <div className="mt-8 space-y-8 text-zinc-300 [&_a]:text-red-400 [&_a]:underline-offset-2 [&_a:hover]:underline [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_li]:leading-relaxed [&_p]:leading-relaxed [&_ul]:space-y-1">
        {children}
      </div>
    </main>
  );
}
