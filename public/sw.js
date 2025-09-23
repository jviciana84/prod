// Service Worker - PWA básico
const CACHE_NAME = 'cvo-dashboard-v1'
const urlsToCache = [
  '/',
  '/globals.css'
]

self.addEventListener("install", (event) => {
  console.log("Service Worker instalado - PWA")
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto')
        // Intentar cachear cada URL individualmente para evitar fallos
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.warn(`No se pudo cachear ${url}:`, error)
              return null // Continuar con otros URLs
            })
          )
        )
      })
      .catch(error => {
        console.error('Error al abrir cache:', error)
      })
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("Service Worker activado - PWA")
  event.waitUntil(self.clients.claim())
})

// PUSH EVENT - Mantener funcionalidad existente
self.addEventListener("push", (event) => {
  console.log("Push event recibido pero anulado - solo campana activa")
  // No hacer nada - push anulado
})

self.addEventListener("notificationclick", (event) => {
  console.log("Notification click recibido pero anulado")
  // No hacer nada - push anulado
})
