// Referee Affirmations — offline shell.
// Cache-first for the app shell and the affirmation audio, so the voice
// keeps working on a weak connection. Chat and live voice need the network.
const CACHE = "referee-affirmations-v2";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
  "favicon-96.png",
  "audio/loop-all.mp3",
  "audio/affirmation-1.mp3",
  "audio/affirmation-2.mp3",
  "audio/affirmation-3.mp3",
  "audio/affirmation-4.mp3",
  "audio/affirmation-5.mp3",
  "audio/affirmation-6.mp3",
  "audio/affirmation-7.mp3",
  "audio/affirmation-8.mp3",
  "audio/affirmation-9.mp3"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  // The page itself is network-first, so updates always reach people;
  // the cached copy only answers when they are offline.
  const isShell = e.request.mode === "navigate" || url.pathname.endsWith("index.html") || url.pathname.endsWith("sw.js");
  if (isShell) {
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
    return;
  }

  // Audio and images are cache-first: instant, and free of repeat downloads.
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
