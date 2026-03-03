const CACHE_NAME = 'sai-balaji-v5';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // MANDATORY logic for Chrome to show install button
    if (event.request.mode === 'navigate') {
        event.respondWith(fetch(event.request).catch(() => caches.match('/')));
    } else {
        event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    }
});
