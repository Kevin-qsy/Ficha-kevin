self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("ficha-rpg-v1").then(cache =>
      cache.addAll([
        "/src/index.html",
        "/src/main.js"
      ])
    )
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
