/* Service Worker (petugas latar belakang) untuk Absensi Santri.
 *
 * Strategi:
 *  - Halaman/aset Next.js  : network-first, fallback ke cache lalu /offline.
 *  - Aset statis (/_next/static, ikon) : cache-first (immutable).
 *  - Permintaan ke Supabase / /api      : selalu jaringan (data harus segar).
 */
const CACHE = "absensi-v1";
const SHELL = ["/offline", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Hanya tangani origin sendiri.
  if (url.origin !== self.location.origin) return;

  // Data absensi/tugas harus selalu segar.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/"))
    return;

  // Aset statis Next.js & ikon: cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/icon-maskable.svg"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Navigasi halaman: network-first, fallback cache, lalu halaman offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline")),
        ),
    );
  }
});
