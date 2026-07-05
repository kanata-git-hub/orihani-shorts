// Service Worker for offline caching and PWA installation
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Simple fetch pass-through, can be extended for offline support
  event.respondWith(fetch(event.request));
});
