// Service Worker para PWA - CVO Dashboard
// Versión 1.3.0 - Con cache de videos de login
const CACHE_NAME = 'cvo-dashboard-v1.3.0'
const VIDEO_CACHE_NAME = 'cvo-videos-v1.0.0'

// URLs de videos de login en Supabase Storage
const LOGIN_VIDEOS = [
  'https://wpjmimbscfsdzcwuwctk.supabase.co/storage/v1/object/public/videos/Video_BMW_M_GT_CVO_2.mp4',
  'https://wpjmimbscfsdzcwuwctk.supabase.co/storage/v1/object/public/videos/BMW_M_HYBRID_V.mp4',
  'https://wpjmimbscfsdzcwuwctk.supabase.co/storage/v1/object/public/videos/BMW_M_GT_Carreras.mp4',
  'https://wpjmimbscfsdzcwuwctk.supabase.co/storage/v1/object/public/videos/Video_BMW_M_GT_CVO.mp4'
]

const urlsToCache = [
  '/',
  '/dashboard',
  '/manifest.json',
]

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando v1.3.0...')
  
  // Skip waiting - Activar inmediatamente sin esperar
  self.skipWaiting()
  
  event.waitUntil(
    Promise.all([
      // Cachear archivos básicos
    caches.open(CACHE_NAME)
      .then((cache) => {
          console.log('Service Worker: Cacheando archivos básicos')
        return cache.addAll(urlsToCache)
        }),
      // Cachear videos en background (no bloquear instalación si falla)
      caches.open(VIDEO_CACHE_NAME)
        .then((cache) => {
          console.log('Service Worker: Iniciando descarga de videos en background...')
          // Intentar cachear videos uno por uno (no usar addAll para no fallar si uno falla)
          return Promise.allSettled(
            LOGIN_VIDEOS.map(videoUrl => 
              fetch(videoUrl)
                .then(response => {
                  if (response.ok) {
                    console.log(`✅ Video cacheado: ${videoUrl.split('/').pop()}`)
                    return cache.put(videoUrl, response)
                  }
                })
                .catch(err => {
                  console.log(`⚠️ Error cacheando video: ${videoUrl.split('/').pop()}`, err)
                })
            )
          )
        })
    ])
      .catch((err) => {
      console.log('Service Worker: Error en instalación', err)
      })
  )
})

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando v1.3.0...')
  
  event.waitUntil(
    Promise.all([
      // Borrar caches viejos (excepto cache de videos)
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Mantener cache actual y cache de videos
            if (cacheName !== CACHE_NAME && cacheName !== VIDEO_CACHE_NAME) {
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
  
  // NO notificar inmediatamente - solo cuando hay un SW esperando
  // El cliente verificará si hay un SW waiting al cargar
})

// Escuchar mensajes del cliente (para SKIP_WAITING)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: SKIP_WAITING recibido')
    self.skipWaiting()
  }
})

// Función helper: Verificar si es un video de login
const isLoginVideo = (url) => {
  return LOGIN_VIDEOS.some(videoUrl => url.includes(videoUrl) || videoUrl.includes(url))
}

// Fetch - Estrategias mixtas: Cache-First para videos, Network-First para el resto
self.addEventListener('fetch', (event) => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') return

  // No cachear API routes (siempre fresh)
  if (event.request.url.includes('/api/')) {
    return
  }

  // ESTRATEGIA CACHE-FIRST para videos de login (carga instantánea)
  if (isLoginVideo(event.request.url)) {
    event.respondWith(
      caches.open(VIDEO_CACHE_NAME)
        .then((cache) => {
          return cache.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log(`⚡ Video desde cache: ${event.request.url.split('/').pop()}`)
                return cachedResponse
              }
              // Si no está en cache, descargar y cachear
              console.log(`🌐 Video desde red: ${event.request.url.split('/').pop()}`)
              return fetch(event.request)
                .then((response) => {
                  if (response && response.ok) {
                    cache.put(event.request, response.clone())
                  }
                  return response
                })
            })
        })
    )
    return
  }

  // ESTRATEGIA NETWORK-FIRST para el resto (siempre fresh)
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

