import Conversation from "@/components/conversation/Conversation";
import type { MonthData } from "@/components/calendar/CalendarView";
import { SITE_URL } from "@/lib/site";

// El mes de hoy es con diferencia lo primero que se abre en el
// Calendario. Lo traemos aquí, en el servidor, para que ya esté listo
// dentro del HTML: así la pestaña no depende de una petición desde el
// navegador que pueda tardar (la ruta compara contra TMDb y TVmaze) o,
// en el peor caso, fallar. Si esto falla por lo que sea, no pasa nada:
// el calendario simplemente lo pide él solo al abrirse, como siempre.
async function fetchTodayCalendar(): Promise<
  { month: string; data: MonthData } | undefined
> {
  const month = new Date().toISOString().slice(0, 7);

  try {
    const response = await fetch(
      `${SITE_URL}/api/calendar?month=${month}`,
      // Mismo margen que el Cache-Control de la propia ruta: así esta
      // página no hace de cuello de botella ni tira peticiones de más.
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return undefined;

    const data = (await response.json()) as MonthData;

    return { month, data };
  } catch {
    return undefined;
  }
}

export default async function Home() {
  const initialCalendar = await fetchTodayCalendar();

  return <Conversation initialCalendar={initialCalendar} />;
}
