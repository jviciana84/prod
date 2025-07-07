// Service Worker simple para notificaciones push
console.log("Service Worker cargado")

self.addEventListener("install", (event) => {
  console.log("Service Worker instalado")
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("Service Worker activado")
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  console.log("Push recibido:", event)

  let title = "Nueva notificación"
  let options = {
    body: "Tienes una nueva notificación",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  }

  try {
    if (event.data) {
      const data = event.data.json()
      title = data.title || title
      options = { ...options, ...data }
    }
  } catch (e) {
    console.error("Error parseando datos:", e)
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  console.log("Notificación clickeada")
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus()
      }
      return clients.openWindow("/")
    }),
  )
})
