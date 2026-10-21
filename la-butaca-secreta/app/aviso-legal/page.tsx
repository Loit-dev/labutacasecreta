import type { Metadata } from "next";

import LegalPage from "@/components/layout/LegalPage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Aviso legal",
  description: `Aviso legal y atribuciones de ${SITE_NAME}.`,
  alternates: { canonical: "/aviso-legal" },
};

export default function LegalNoticePage() {
  return (
    <LegalPage title="Aviso legal y atribuciones">
      <section>
        <h2>Sobre este sitio</h2>

        <p>
          {SITE_NAME} es un proyecto personal, gratuito y sin
          ánimo comercial que ayuda a decidir qué ver con
          tres recomendaciones de películas y series.
          {CONTACT_EMAIL && (
            <>
              {" "}Contacto:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              .
            </>
          )}
        </p>
      </section>

      <section>
        <h2>Atribuciones</h2>

        <ul>
          <li>
            Los datos de películas y series proceden de{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              The Movie Database (TMDb)
            </a>
            . Este producto usa la API de TMDb, pero TMDb ni
            lo respalda ni lo certifica (aviso oficial:
            «This product uses the TMDB API but is not
            endorsed or certified by TMDB»).
          </li>
          <li>
            Los datos de disponibilidad en plataformas
            proceden de{" "}
            <a
              href="https://www.justwatch.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              JustWatch
            </a>
            .
          </li>
        </ul>
      </section>

      <section>
        <h2>Marcas y contenidos</h2>

        <p>
          Netflix, Prime Video, Disney+, Max, Filmin y el
          resto de nombres, logos, títulos y pósters son
          propiedad de sus respectivos titulares. Este sitio
          no está afiliado, patrocinado ni respaldado por
          ellos.
        </p>
      </section>

      <section>
        <h2>Exactitud de la información</h2>

        <p>
          Las recomendaciones son orientativas. El catálogo
          de cada plataforma cambia con frecuencia, así que
          un título puede dejar de estar disponible, o no
          estarlo en tu plan, sin que lo sepamos. Antes de
          contar con él, compruébalo en la plataforma.
        </p>
      </section>

      <section>
        <h2>Enlaces externos</h2>

        <p>
          Este sitio enlaza a páginas de terceros (por
          ejemplo, YouTube). No nos hacemos responsables de
          sus contenidos ni de sus políticas de privacidad.
        </p>
      </section>
    </LegalPage>
  );
}
