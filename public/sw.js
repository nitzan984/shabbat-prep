/*
 * Service worker של "מכינים שבת": מטמון למעטפת האפליקציה, כדי שתיפתח מהר וגם בלי קליטה.
 * הנתונים עצמם (Hebcal, מזג אוויר, Supabase) לא נשמרים כאן: האפליקציה שומרת אותם ב־localStorage.
 */
const VERSION = 'v1'
const SHELL = `shell-${VERSION}`
const ASSETS = `assets-${VERSION}`
const FONTS = `fonts-${VERSION}`
const PRECACHE = ['/', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL, ASSETS, FONTS])
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const isFont = (url) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // דפים: קודם רשת (כדי לקבל גרסה חדשה), ובלי רשת את המעטפת השמורה
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(SHELL).then((cache) => cache.put('/', copy))
          return response
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  // קבצי build עם hash בשם: לא משתנים, אז מהמטמון קודם
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone()
            caches.open(ASSETS).then((cache) => cache.put(request, copy))
            return response
          }),
      ),
    )
    return
  }

  // הגופן ושאר הקבצים הסטטיים: מהמטמון מיד, ומתעדכנים ברקע
  if (isFont(url) || (url.origin === self.location.origin && !url.pathname.startsWith('/api/'))) {
    const cacheName = isFont(url) ? FONTS : SHELL
    event.respondWith(
      caches.open(cacheName).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
              return response
            })
            .catch(() => cached)
          return cached || network
        }),
      ),
    )
  }
  // כל השאר (API חיצוניים) עובר ישר לרשת
})
