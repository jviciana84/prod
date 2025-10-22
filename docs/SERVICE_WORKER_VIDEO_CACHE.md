# 📹 Sistema de Cache de Videos con Service Worker

## 🎯 Objetivo

Cachear los 4 videos de login en el navegador del usuario para carga **instantánea** en siguientes visitas, sin consumir bandwidth de Supabase.

## ✅ Implementación Completada

### 📦 Archivos Modificados
- `public/sw.js` - Service Worker actualizado con cache de videos

### 🔧 Versión
- **v1.3.0** - Con cache de videos de login

## 🎬 Cómo Funciona

### 1️⃣ **Primera visita del usuario:**
```
Usuario entra → Service Worker se instala → Descarga 4 videos en background
                ↓
            Video carga normal desde Supabase (Network)
```

### 2️⃣ **Segunda visita y siguientes:**
```
Usuario entra → Service Worker → Busca en cache → ⚡ CARGA INSTANTÁNEA
```

### 3️⃣ **Si cache fue borrado:**
```
Usuario entra → Service Worker → No encuentra cache → Descarga de Supabase
                                                        ↓
                                                  Funciona igual que antes
```

## 🎨 Estrategias de Cache

### **Cache-First (Videos de Login)**
- Busca primero en cache local
- Si encuentra: carga instantánea ⚡
- Si NO encuentra: descarga de Supabase 🌐
- Luego lo cachea para próxima vez

### **Network-First (Resto de la app)**
- Siempre intenta desde red (datos frescos)
- Si falla: fallback a cache
- Mantiene app actualizada

## 📊 Videos Cacheados

```javascript
const LOGIN_VIDEOS = [
  'Video_BMW_M_GT_CVO_2.mp4',      // ~5.52 MB
  'BMW_M_HYBRID_V.mp4',             // ~4.60 MB
  'BMW_M_GT_Carreras.mp4',          // ~4.40 MB
  'Video_BMW_M_GT_CVO.mp4'          // ~3.00 MB
]
// Total: ~17.5 MB
```

## 🚀 Beneficios

✅ **Carga instantánea** - 0 latencia en videos
✅ **Ahorro de bandwidth** - Menos transferencia de Supabase
✅ **Mejor UX** - Experiencia más fluida
✅ **Funciona offline** - Videos disponibles sin conexión
✅ **Degradación elegante** - Si falla cache, carga normal
✅ **Zero risk** - No rompe funcionalidad existente

## 🔍 Verificación

### **Ver en consola del navegador:**

**Durante instalación:**
```
Service Worker: Instalando v1.3.0...
Service Worker: Iniciando descarga de videos en background...
✅ Video cacheado: Video_BMW_M_GT_CVO_2.mp4
✅ Video cacheado: BMW_M_HYBRID_V.mp4
✅ Video cacheado: BMW_M_GT_Carreras.mp4
✅ Video cacheado: Video_BMW_M_GT_CVO.mp4
```

**Al cargar video:**
```
⚡ Video desde cache: BMW_M_HYBRID_V.mp4  (instantáneo)
```

### **Inspeccionar cache manualmente:**

1. Abrir **DevTools** (F12)
2. Ir a **Application** → **Cache Storage**
3. Buscar: `cvo-videos-v1.0.0`
4. Ver los 4 videos cacheados

### **Limpiar cache (testing):**

```javascript
// En consola del navegador:
caches.delete('cvo-videos-v1.0.0')
```

## 📱 Compatibilidad

✅ Chrome / Edge / Opera
✅ Firefox
✅ Safari (iOS 11.3+)
✅ Samsung Internet
❌ Internet Explorer (no soporta Service Workers)

## ⚙️ Configuración

### **Cambiar versión del cache:**

Si necesitas forzar re-descarga de videos:

```javascript
// En public/sw.js
const VIDEO_CACHE_NAME = 'cvo-videos-v1.0.1' // Cambiar versión
```

### **Añadir más videos:**

```javascript
// En public/sw.js
const LOGIN_VIDEOS = [
  'https://wpjmimbscfsdzcwuwctk.supabase.co/storage/v1/object/public/videos/Video_BMW_M_GT_CVO_2.mp4',
  // ... videos actuales ...
  'https://wpjmimbscfsdzcwuwctk.supabase.co/storage/v1/object/public/videos/NUEVO_VIDEO.mp4' // Añadir aquí
]
```

## 🐛 Troubleshooting

### **Videos no se cachean:**
1. Verificar que Service Worker está activo (DevTools → Application)
2. Revisar consola por errores de red
3. Verificar permisos CORS de Supabase

### **Video no carga desde cache:**
1. Hard refresh (Ctrl+Shift+R)
2. Limpiar cache manualmente
3. Verificar que URL del video coincide exactamente

### **Cache ocupa mucho espacio:**
- Chrome: ~50-80% del espacio disponible
- Si necesita espacio, el navegador borrará caches antiguos automáticamente
- El Service Worker re-descargará videos cuando sea necesario

## 📈 Métricas

**Tiempo de carga estimado:**

| Escenario | Primera Carga | Siguientes Cargas |
|-----------|---------------|-------------------|
| Con cache | ~2-3s (5G/WiFi) | **~50-100ms** ⚡ |
| Sin cache | ~2-3s | ~2-3s |

**Ahorro de bandwidth (por usuario activo/mes):**
- 10 visitas/mes × 5MB promedio = **50 MB ahorrados**
- 100 usuarios activos = **5 GB/mes ahorrados** 💰

## 🔐 Seguridad

✅ Videos son **públicos** (Supabase public bucket)
✅ Cache es **local** al navegador (no compartido)
✅ Service Worker solo tiene acceso a **origen permitido**
✅ No hay datos sensibles en videos

## 🎓 Recursos

- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache Storage - MDN](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)
- [Workbox - Google](https://developers.google.com/web/tools/workbox)




