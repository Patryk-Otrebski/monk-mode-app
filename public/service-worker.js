const CACHE_NAME = "monk-mode-v2";
const assetUrl = (path) => new URL(path, self.registration.scope).toString();
const APP_SHELL = assetUrl("index.html");
const CORE_ASSETS = [
  assetUrl(""),
  APP_SHELL,
  assetUrl("manifest.webmanifest"),
  assetUrl("icon.svg"),
  assetUrl("icon-192.png"),
  assetUrl("icon-512.png"),
  assetUrl("apple-touch-icon.png")
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }

          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(APP_SHELL));
    })
  );
});
