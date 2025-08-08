// Service Worker - PUSH NOTIFICATIONS ANULADO
// Solo campana activa

self.addEventListener("install", (event) => {
  console.log("Service Worker instalado (push anulado)")
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("Service Worker activado (push anulado)")
  event.waitUntil(self.clients.claim())
})

// PUSH EVENT ANULADO - No procesar push notifications
self.addEventListener("push", (event) => {
  console.log("Push event recibido pero anulado - solo campana activa")
  // No hacer nada - push anulado
})

self.addEventListener("notificationclick", (event) => {
  console.log("Notification click recibido pero anulado")
  // No hacer nada - push anulado
})
