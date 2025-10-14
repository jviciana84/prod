# 🧹 SISTEMA DE AUTO-LIMPIEZA DE STORAGE

## 📋 RESUMEN

Sistema automático que limpia cookies y localStorage de Supabase corruptos después del login, preservando todas las preferencias de usuario.

**Fecha de implementación:** 14 Oct 2025  
**Problema que resuelve:** Tablas que no cargan sin F5 debido a cookies corruptas

---

## 🎯 QUÉ HACE

### ✅ Limpia automáticamente:
- Cookies de Supabase (`sb-*`)
- localStorage de Supabase (`sb-*`)
- sessionStorage de Supabase (`sb-*`)

### 🛡️ Preserva intactos:
- `theme` - Tema del usuario
- `auto-refresh-preferences` - Configuración de auto-refresh
- `lastTasacion`, `tasacionMetadata`, `lastTasacionId` - Tasaciones
- `edelweiss_conversation_count`, `edelweiss_has_opened` - Chat AI
- Cualquier otro dato de usuario

---

## 🔧 CÓMO FUNCIONA

### 1. Limpieza Automática Post-Login

Al iniciar sesión, el sistema:
1. Verifica si la versión de limpieza está actualizada
2. Si no lo está, ejecuta limpieza selectiva
3. Preserva todas las preferencias
4. Marca la versión actual
5. **NO vuelve a ejecutar hasta nueva versión**

**Componente:** `components/auto-storage-cleaner.tsx`  
**Ubicación:** `app/layout.tsx` (dentro de AuthProvider)

### 2. Botón Manual en Configuración

El usuario puede limpiar manualmente si:
- Las tablas no cargan
- Ve errores de autenticación
- Quiere forzar una limpieza

**Componente:** `components/settings/storage-cleaner-settings.tsx`  
**Ubicación:** `/dashboard/settings`

---

## 📁 ARCHIVOS INVOLUCRADOS

### Nuevos archivos creados:

```
utils/safe-clean-storage.ts
├── needsStorageClean() - Verifica si necesita limpieza
├── safeCleanStorage() - Ejecuta limpieza selectiva
├── autoCleanStorageIfNeeded() - Auto-limpieza si necesario
├── forceCleanStorage() - Forzar limpieza manual
└── getStorageInfo() - Info del estado del storage

components/auto-storage-cleaner.tsx
└── Componente que se ejecuta automáticamente post-login

components/settings/storage-cleaner-settings.tsx
└── UI para limpieza manual en configuración
```

### Archivos modificados:

```
app/layout.tsx
└── + <AutoStorageCleaner />

app/dashboard/settings/page.tsx
└── + <StorageCleanerSettings />
```

---

## 🔐 SEGURIDAD

### ¿Es seguro?

✅ **SÍ, es completamente seguro porque:**

1. **Limpieza selectiva:** Solo elimina datos de Supabase
2. **Preservación activa:** Lista blanca de datos protegidos
3. **No destructivo:** No afecta datos en base de datos
4. **Versionado:** Solo se ejecuta cuando es necesario
5. **Manual disponible:** Usuario tiene control con botón

### ¿Qué NO hace?

❌ Eliminar datos de Supabase (tablas)  
❌ Cerrar sesión del usuario  
❌ Borrar tasaciones guardadas  
❌ Eliminar preferencias de usuario  
❌ Afectar datos de negocio  

---

## 🎚️ VERSIONADO

### Sistema de versiones:

```typescript
const CURRENT_CLEAN_VERSION = '2025-10-14-v1'
```

**¿Cuándo incrementar?**

Incrementa la versión cuando:
- Descubres nuevo tipo de corrupción
- Cambias lógica de limpieza
- Quieres forzar nueva limpieza en todos los usuarios

**Ejemplo:**
```typescript
// Si necesitas forzar nueva limpieza:
const CURRENT_CLEAN_VERSION = '2025-10-15-v2'
```

---

## 🔍 MONITOREO Y DEBUG

### Ver estado del storage:

```typescript
import { getStorageInfo } from '@/utils/safe-clean-storage'

const info = getStorageInfo()
console.log(info)
// {
//   needsCleaning: false,
//   currentVersion: '2025-10-14-v1',
//   targetVersion: '2025-10-14-v1',
//   supabaseItems: [],
//   protectedItems: ['theme', 'lastTasacion', ...]
// }
```

### Verificar si se ejecutó limpieza:

Busca en console del navegador:
```
✅ Limpieza automática ejecutada
✅ Storage ya está limpio (versión actual)
```

### Probar limpieza manual:

```typescript
import { forceCleanStorage } from '@/utils/safe-clean-storage'

const result = forceCleanStorage()
console.log(result)
// { success: true, itemsCleaned: 5, itemsPreserved: 4, errors: [] }
```

---

## 🧪 TESTING

### Cómo probar:

1. **Simular cookies corruptas:**
   ```javascript
   localStorage.setItem('sb-test-corrupted', 'corrupted-data')
   localStorage.setItem('theme', 'dark')
   ```

2. **Ejecutar limpieza:**
   - Recargar página (auto-limpieza)
   - O usar botón en `/dashboard/settings`

3. **Verificar:**
   ```javascript
   console.log(localStorage.getItem('sb-test-corrupted')) // null
   console.log(localStorage.getItem('theme')) // 'dark' ✅
   ```

### Casos de prueba:

- [ ] Limpieza automática se ejecuta una sola vez
- [ ] Tema se preserva después de limpieza
- [ ] Tasaciones en progreso no se pierden
- [ ] Botón manual funciona correctamente
- [ ] No se ejecuta limpieza si versión está actualizada

---

## 📊 DATOS PROTEGIDOS - LISTA COMPLETA

```typescript
const PROTECTED_KEYS = [
  'theme',                          // Tema de usuario
  'auto-refresh-preferences',       // Auto-refresh config
  'lastTasacion',                   // Tasación en progreso
  'tasacionMetadata',               // Metadata tasación
  'lastTasacionId',                 // ID última tasación
  'edelweiss_conversation_count',   // Chat AI contador
  'edelweiss_has_opened',           // Chat AI flag
  'storage_clean_version',          // Versión de limpieza
]
```

**¿Agregar más datos protegidos?**

Edita el array en `utils/safe-clean-storage.ts`:
```typescript
const PROTECTED_KEYS = [
  // ... existentes
  'nueva_preferencia_a_proteger',
]
```

---

## 🚀 USO DEL SISTEMA

### Para usuarios finales:

**Automático:**
- No requiere acción
- Se ejecuta transparentemente después del login
- Notificación opcional si se limpió algo

**Manual:**
1. Ir a `/dashboard/settings`
2. Sección "Limpiar datos temporales"
3. Click en "Limpiar ahora"
4. Confirmar
5. Opcionalmente recargar página

### Para desarrolladores:

**Agregar nuevos datos a proteger:**
```typescript
// En utils/safe-clean-storage.ts
const PROTECTED_KEYS = [
  // ... existentes
  'mi_nuevo_dato',
]
```

**Forzar nueva limpieza en todos:**
```typescript
// Incrementar versión
const CURRENT_CLEAN_VERSION = '2025-10-15-v2'
```

**Usar limpieza programáticamente:**
```typescript
import { safeCleanStorage } from '@/utils/safe-clean-storage'

// En alguna función
const result = safeCleanStorage()
if (result.success) {
  console.log('Limpieza exitosa')
}
```

---

## 🐛 TROUBLESHOOTING

### Problema: Limpieza no se ejecuta automáticamente

**Verificar:**
1. ¿Está `<AutoStorageCleaner />` en `app/layout.tsx`?
2. ¿La versión en localStorage coincide con `CURRENT_CLEAN_VERSION`?
3. ¿Hay errores en console?

**Solución:**
```typescript
// Forzar limpieza removiendo versión
localStorage.removeItem('storage_clean_version')
// Recargar página
```

### Problema: Se borran datos de usuario

**Verificar:**
1. ¿El dato está en `PROTECTED_KEYS`?
2. ¿El nombre de la clave es exacto?

**Solución:**
Agregar clave a `PROTECTED_KEYS` en `utils/safe-clean-storage.ts`

### Problema: Botón manual no funciona

**Verificar:**
1. ¿Hay errores en console?
2. ¿Está importado en `/dashboard/settings/page.tsx`?

**Solución:**
Ver errores específicos en console del navegador

---

## 📈 MÉTRICAS Y ANALÍTICAS

### Qué monitorear:

- Frecuencia de limpiezas automáticas
- Cantidad de items limpiados por sesión
- Errores durante limpieza
- Uso del botón manual

### Implementar tracking (opcional):

```typescript
// En safeCleanStorage()
if (result.success) {
  // Analytics event
  trackEvent('storage_cleaned', {
    itemsCleaned: result.itemsCleaned,
    version: CURRENT_CLEAN_VERSION
  })
}
```

---

## 🔄 MANTENIMIENTO

### Revisar periódicamente:

- [ ] ¿Nuevos datos de usuario que proteger?
- [ ] ¿Versión de limpieza actualizada?
- [ ] ¿Errores reportados en console?
- [ ] ¿Usuarios reportan problemas de cookies?

### Actualizar documentación si:

- Cambias `PROTECTED_KEYS`
- Modificas lógica de limpieza
- Agregas nuevas funcionalidades
- Descubres nuevos casos de uso

---

**Última actualización:** 14 Oct 2025  
**Próxima revisión:** 15 Oct 2025  
**Responsable:** Sistema automático  
**Estado:** ✅ Implementado y funcionando

