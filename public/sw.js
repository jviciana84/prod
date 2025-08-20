// Service Worker - PWA básico
const CACHE_NAME = 'cvo-dashboard-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/globals.css'
]

self.addEventListener("install", (event) => {
  console.log("Service Worker instalado - PWA")
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto')
        return cache.addAll(urlsToCache)
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
