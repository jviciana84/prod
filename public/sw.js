// Service Worker para PWA - CVO Dashboard
const CACHE_NAME = 'cvo-dashboard-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/manifest.json',
]

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos')
        return cache.addAll(urlsToCache)
      })
      .catch((err) => {
        console.log('Service Worker: Error al cachear', err)
      })
  )
})

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando caché antigua', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Fetch - Strategy: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') return

  // No cachear API routes (siempre fresh)
  if (event.request.url.includes('/api/')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, guardar en caché
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Si falla la red, intentar desde caché
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Si no hay caché, retornar error básico
            return new Response('Offline - No hay conexión', {
              status: 503,
              statusText: 'Service Unavailable'
            })
          })
      })
  )
})

