/**
 * Logging mínimo para los `catch` que hoy descartan errores en silencio
 * (sobre todo en el pipeline de TMDb/TVmaze del calendario y las
 * recomendaciones): una llamada que falla no debe tumbar la respuesta,
 * pero tampoco debe desaparecer sin dejar rastro — así hubo bugs (fechas
 * descartadas, logos inconsistentes) que solo se vieron mirando la web a
 * ojo, no porque algo avisara.
 *
 * No añade ninguna dependencia ni cuenta externa: usa `console.error`
 * con una línea JSON estructurada. Vercel recoge automáticamente la
 * salida de las funciones serverless en Project → Logs/Observability,
 * donde se puede filtrar por `scope` o buscar texto.
 *
 * Si en el futuro se añade una cuenta de Sentry (u otra), este es el
 * único sitio que habría que tocar.
 */
export function logError(
  scope: string,
  error: unknown,
  context?: Record<string, unknown>
) {
  const message =
    error instanceof Error ? error.message : String(error);

  // Una sola línea JSON: fácil de grep/filtrar en los logs de Vercel.
  console.error(
    JSON.stringify({
      level: "error",
      scope,
      message,
      ...context,
      time: new Date().toISOString(),
    })
  );
}
