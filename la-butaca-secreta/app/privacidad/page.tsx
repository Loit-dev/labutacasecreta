import type { Metadata } from "next";

import LegalPage from "@/components/layout/LegalPage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacidad",
  description: `Qué datos usa ${SITE_NAME} y cuáles no.`,
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad">
      <section>
        <h2>En resumen</h2>

        <p>
          {SITE_NAME} no tiene cuentas de usuario, no te
          pide datos personales y no usa cookies ni
          publicidad. Medimos el uso de la web con una
          analítica sin cookies y sin datos personales (más
          abajo te lo explicamos). Tus respuestas sirven para
          buscar recomendaciones y no se guardan asociadas a
          ti en ninguna base de datos.
        </p>
      </section>

      <section>
        <h2>Qué ocurre cuando respondes al cuestionario</h2>

        <p>
          Tus respuestas (por ejemplo, «película», «reírme» o
          «en pareja») se envían a nuestro servidor, sin
          identificarte, para consultar a TMDb y devolverte
          tres recomendaciones. Terminada la petición, no se
          conservan.
        </p>
      </section>

      <section>
        <h2>Qué se guarda en tu dispositivo</h2>

        <p>
          Si pulsas «Ya la vi», guardamos el identificador de
          ese título en el almacenamiento local de tu
          navegador (<em>localStorage</em>) para no volver a
          recomendártelo. Es un dato técnico que no sale de tu
          dispositivo, salvo la lista de identificadores que
          se envía con cada búsqueda para excluir esos
          títulos. Puedes borrarlo en cualquier momento con
          el enlace «Olvidar mis títulos vistos» o limpiando
          los datos del sitio en tu navegador.
        </p>

        <p>
          Lo mismo ocurre con «Mi lista»: si pulsas «Guardar
          para ver luego», guardamos en tu navegador el
          título, año, nota, póster y plataformas de ese
          título. No se envía a ningún servidor y puedes
          vaciarla desde «Mi lista» en cualquier momento.
        </p>
      </section>

      <section>
        <h2>Analítica de uso</h2>

        <p>
          Usamos <strong>Vercel Web Analytics</strong> para
          saber cuánta gente visita la web y cómo se usa, y así
          mejorarla. No usa cookies, no te identifica ni te
          sigue entre sitios web. Recoge datos agregados como
          la página visitada, de dónde llegas, el país, el
          tipo de dispositivo y el navegador.
        </p>

        <p>
          Con <strong>Vercel Speed Insights</strong> medimos
          además cuánto tarda la web en cargar y responder en
          los dispositivos reales, para que vaya más rápido.
          Tampoco usa cookies ni te identifica.
        </p>

        <p>
          También contamos acciones de forma anónima: qué
          opciones se eligen en el cuestionario, cuántas veces
          se pulsa «Ya la vi», «No me apetece», «Dame otras 3»
          o «Compartir», y los números de identificación de los
          títulos implicados. Nunca se asocian a una persona
          concreta.
        </p>
      </section>

      <section>
        <h2>Imagen para compartir</h2>

        <p>
          El botón «Compartir» crea una imagen con tus tres
          recomendaciones directamente en tu navegador. No se
          sube a ningún servidor nuestro: tú decides si la
          descargas o la envías. Para dibujar los pósters,
          nuestro servidor los descarga de TMDb y te los
          entrega, sin guardar nada.
        </p>

        <p>
          También puedes copiar un enlace que abre las mismas
          tres recomendaciones. El enlace solo contiene los
          números de identificación de esos títulos; quien lo
          abra verá las recomendaciones, sin ningún dato tuyo.
        </p>
      </section>

      <section>
        <h2>Servicios de terceros</h2>

        <ul>
          <li>
            <strong>Vercel</strong> aloja la web y, como
            cualquier servidor, puede registrar datos
            técnicos de la visita (dirección IP, navegador,
            fecha) en sus registros de funcionamiento.
          </li>
          <li>
            <strong>TMDb</strong> proporciona los datos de
            películas y series. Las consultas las hace
            nuestro servidor y no incluyen tus datos
            personales. Los pósters y logos se cargan
            directamente desde <em>image.tmdb.org</em>, por
            lo que tu navegador se conecta a ese servidor.
          </li>
          <li>
            <strong>JustWatch</strong> es la fuente de los
            datos de disponibilidad en plataformas, que
            recibimos a través de TMDb.
          </li>
          <li>
            <strong>YouTube</strong> solo se carga si pulsas
            «Ver tráiler». Usamos el modo de privacidad
            mejorada (<em>youtube-nocookie.com</em>), pero al
            reproducir el vídeo tu navegador se conecta a
            Google.
          </li>
        </ul>
      </section>

      <section>
        <h2>Tus derechos</h2>

        <p>
          Como no guardamos datos personales asociados a ti,
          no hay información que acceder, rectificar o
          suprimir en nuestro lado. Si tienes cualquier duda
          sobre esta política o sobre tus derechos de
          protección de datos, puedes escribirnos
          {CONTACT_EMAIL ? (
            <>
              {" "}a{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              .
            </>
          ) : (
            " a través del contacto que figure en el sitio."
          )}{" "}
          También puedes reclamar ante la Agencia Española de
          Protección de Datos (
          <a
            href="https://www.aepd.es/"
            target="_blank"
            rel="noopener noreferrer"
          >
            aepd.es
          </a>
          ).
        </p>
      </section>

      <section>
        <h2>Cambios</h2>

        <p>
          Si en el futuro añadimos cuentas u otras funciones
          que traten datos personales, actualizaremos esta
          página antes de activarlas.
        </p>
      </section>
    </LegalPage>
  );
}
