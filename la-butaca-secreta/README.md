# 🎬 La Butaca Secreta

> El amigo cinéfilo que te ayuda a decidir qué ver.

La Butaca Secreta es una aplicación web que recomienda **exactamente tres películas o series** mediante una conversación inteligente y adaptativa.

No pretende mostrar cientos de opciones.

Pretende ayudarte a decidir.

---

## ✨ Filosofía

> **La Butaca Secreta no recomienda películas. Ayuda a decidir.**

Nuestro objetivo es eliminar los 30 minutos que muchas personas pierden buscando qué ver entre distintas plataformas.

---

## 🚀 Estado del proyecto

🟢 En producción: **[labutacasecreta.vercel.app](https://labutacasecreta.vercel.app)**

La conversación adaptativa, el modo acompañado/grupo, el calendario de estrenos, la lista de guardados, compartir resultado y la instalación como app ya funcionan en producción. Lo que sigue abierto son mejoras continuas (SEO, rendimiento, cobertura del calendario), no el MVP.

---

## 🛠️ Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- [TMDb](https://www.themoviedb.org/) para datos de películas/series y disponibilidad por plataforma (Netflix, Prime Video, Disney+, Max, Filmin)
- [TVmaze](https://www.tvmaze.com/) como segunda fuente para estrenos de series
- Vercel (hosting, Speed Insights, cron/env)
- Sin backend propio ni IA generativa: el motor de preguntas es una lógica adaptativa propia (ver `docs/CONVERSATION_ENGINE.md`), no un LLM

## ✅ Calidad

- Tests unitarios (`npm test`) y end-to-end con Playwright (`npm run test:e2e`), incluida una suite de accesibilidad
- Auditorías propias de accesibilidad (navegación por teclado, lectores de pantalla) y de rendimiento en móvil
- Límite de peticiones (`rate limiting`) en las rutas de API
- Avisos legales y de privacidad en español, con atribución correcta a TMDb

---

## 📂 Documentación

Toda la documentación se encuentra en la carpeta `/docs`: PRD, UX, arquitectura, marca, motor de preguntas, motor de recomendación, roadmap y más.

---

## 🎯 Objetivo

Que cualquier usuario termine pensando:

> **"Al fin algo que me ayuda a decidir qué ver."**

---

## 📜 Licencia

MIT