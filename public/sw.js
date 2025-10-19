// Service Worker para PWA - CVO Dashboard
// Versión 1.2.0 - Con auto-actualización
const CACHE_NAME = 'cvo-dashboard-v1.2.0'
const urlsToCache = [
  '/',
  '/dashboard',
  '/manifest.json',
]

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando v1.2.0...')
  
  // Skip waiting - Activar inmediatamente sin esperar
  self.skipWaiting()
  
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
  console.log('Service Worker: Activando v1.2.0...')
  
  event.waitUntil(
    Promise.all([
      // Borrar caches viejos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Eliminando caché antigua', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Claim clients - Tomar control inmediato de todas las pestañas
      self.clients.claim()
    ])
  )
  
  // Notificar a todos los clientes que hay nueva versión
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'SW_UPDATED', version: '1.2.0' })
    })
  })
})

// Escuchar mensajes del cliente (para SKIP_WAITING)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: SKIP_WAITING recibido')
    self.skipWaiting()
  }
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

