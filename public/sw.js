self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// El MVP no cachea respuestas para evitar datos obsoletos de pedidos.
self.addEventListener("fetch", () => {});
