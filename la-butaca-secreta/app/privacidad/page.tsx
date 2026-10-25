import type { Metadata } from "next";

import LegalPage from "@/components/layout/LegalPage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

const title = "Privacidad";
const description = `Qué datos usa ${SITE_NAME} y cuáles no.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacidad" },
  openGraph: { title, description, url: "/privacidad" },
  twitter: { title, description },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad">
      <section>
        <h2>En resumen</h2>

        <p>
          Usar {SITE_NAME} para pedir recomendaciones no
          requiere cuenta ni datos personales, y no usamos
          cookies ni publicidad. Si quieres, puedes crear una
          cuenta gratuita (solo con tu correo) para guardar tu
          historial, tus listas y tus pendientes entre
          dispositivos: más abajo explicamos qué se guarda en
          ese caso. Medimos el uso general de la web con una
          analítica sin cookies y sin datos personales (más
          abajo te lo explicamos también).
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
        <h2>Si creas una cuenta</h2>

        <p>
          Crear una cuenta es opcional y sirve para que tu
          actividad te acompañe entre dispositivos, en
          «Mi cuenta». Entras con un enlace mágico que te
          enviamos por correo (sin contraseña), a través de{" "}
          <strong>Supabase</strong>, el proveedor que aloja
          nuestra base de datos y gestiona el inicio de
          sesión. Solo guardamos tu correo electrónico para
          identificarte; no lo usamos para nada más ni lo
          compartimos.
        </p>

        <p>
          Con sesión iniciada, guardamos ligados a tu cuenta:
        </p>

        <ul>
          <li>
            Tu <strong>diario</strong>: qué películas o series
            marcas como vistas, cuándo y la nota que les pones
            (si le pones alguna).
          </li>
          <li>
            Tu <strong>película o serie favorita</strong>, la
            que eliges a mano en «Mi Resumen».
          </li>
          <li>
            Tus <strong>listas</strong>: el nombre de cada
            lista que crees y los títulos que añadas a ellas.
          </li>
        </ul>

        <p>
          Esos datos están protegidos de forma que solo tu
          cuenta puede leerlos o modificarlos; nadie más tiene
          acceso a ellos, nosotros incluidos, salvo para dar
          soporte técnico si nos escribes con un problema.
          Puedes editar o borrar cualquier entrada de tu
          diario o tus listas desde «Mi cuenta» en cualquier
          momento. Si quieres borrar tu cuenta entera y todo lo
          asociado a ella, escríbenos
          {CONTACT_EMAIL ? (
            <>
              {" "}a{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </>
          ) : (
            " a través del contacto que figure en el sitio"
          )}{" "}
          y lo hacemos sin demora.
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

        <p>
          Si has usado el modo «acompañado», el enlace incluye
          además los nombres o motes que hayas escrito y el
          porcentaje de coincidencia, para que quien lo abra vea
          «Sugerencias para Ana y Luis». Esos nombres no se
          guardan en ningún servidor: viajan solo dentro de la
          dirección que tú decides compartir.
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
            <strong>Supabase</strong> aloja la base de datos y
            el inicio de sesión de quienes crean una cuenta
            (correo electrónico, diario, favorita y listas,
            descritos arriba). Solo se usa si decides crear
            una cuenta.
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
          Si no tienes cuenta, no guardamos datos personales
          asociados a ti y no hay información que acceder,
          rectificar o suprimir en nuestro lado. Si tienes
          cuenta, puedes acceder, corregir o borrar tu diario
          y tus listas tú mismo desde «Mi cuenta», y pedirnos
          por correo que borremos la cuenta entera cuando
          quieras. Si tienes cualquier otra duda sobre esta
          política o sobre tus derechos de protección de
          datos, puedes escribirnos
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
          Si en el futuro añadimos nuevas funciones que
          traten datos personales, actualizaremos esta página
          antes de activarlas.
        </p>
      </section>
    </LegalPage>
  );
}
