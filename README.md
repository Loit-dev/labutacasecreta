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

🟡 En desarrollo (v0.1)

Actualmente estamos diseñando la experiencia antes de implementar la lógica.

---

## 🛠️ Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- App Router

Próximamente:

- TMDb
- Supabase
- IA
- Vercel

---

## 🧑‍💻 Desarrollo

Todo el código está en `la-butaca-secreta/`.

```bash
cd la-butaca-secreta
cp .env.example .env.local   # y rellena TMDB_API_TOKEN
npm install
npm run dev        # servidor de desarrollo
npm test           # tests del motor (no necesitan nada más)
npm run typecheck  # comprobación de tipos
```

Variables de entorno (también en Vercel → Settings → Environment Variables,
**marcando Production y Preview**):

| Variable | Obligatoria | Para qué |
|---|---|---|
| `TMDB_API_TOKEN` | Sí | Token de lectura de la API de TMDb |
| `TMDB_BASE_URL` | No | Por defecto `https://api.themoviedb.org/3` |
| `TMDB_IMAGE_URL` | No | Por defecto `https://image.tmdb.org/t/p/w500` |
| `NEXT_PUBLIC_SITE_URL` | No | Dirección pública (si usas dominio propio) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | No | Correo que se muestra en privacidad y aviso legal |

Cada pull request pasa por una comprobación automática (tipos + tests) en
GitHub Actions.

---

## 📂 Documentación

Toda la documentación se encuentra en la carpeta `/docs`.

- PRD
- UX
- Arquitectura
- Brand
- Motor de preguntas
- Motor de recomendación
- Roadmap

---

## 🎯 Objetivo

Que cualquier usuario termine pensando:

> **"Al fin algo que me ayuda a decidir qué ver."**

---

## 📜 Licencia

MIT