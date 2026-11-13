// Network-first for our own files so new versions reach users; cache is only the offline fallback.
// Never touches API calls (other origins) or non-GET requests.
var CACHE_NAME = 'makhzani-v2';
var urlsToCache = ['index.html', 'manifest.json'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function (c) { return c.addAll(urlsToCache); }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      var copy = r.clone();
      caches.open(CACHE_NAME).then(function (c) { c.put(e.request, copy); });
      return r;
    }).catch(function () {
      return caches.match(e.request).then(function (r) { return r || caches.match('index.html'); });
    })
  );
});
