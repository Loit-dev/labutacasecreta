// Service worker de La Butaca Secreta: solo para los avisos push
// ("me gusta" y comentarios en tus listas). No guarda nada en caché ni
// intercepta peticiones: la web funciona exactamente igual que sin él.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "La Butaca Secreta", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "La Butaca Secreta";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        for (const client of windows) {
          if ("navigate" in client && "focus" in client) {
            return client.navigate(url).then((c) => (c || client).focus());
          }
        }

        return self.clients.openWindow(url);
      })
  );
});
