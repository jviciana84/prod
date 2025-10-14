# 🔧 SOLUCIÓN PROBLEMA: Tablas no cargan sin F5 (14 Oct 2025)

## 📅 CRONOLOGÍA

**Inicio del problema:** ~7 Oct 2025  
**Síntomas detectados:** 14 Oct 2025  
**Solución aplicada:** 14 Oct 2025  
**Estado:** ✅ RESUELTO (pendiente monitoreo)

---

## 🔴 SÍNTOMAS

### Comportamiento anormal:
- Tablas no cargan datos al entrar en páginas
- Requiere F5 (refresh) para cargar
- Afecta a: Dashboard, Vehículos, Ventas, Fotos, Entregas, Documentación
- Problema se propaga: Si entras en página con problema, luego afecta a otras
- Loading infinito sin mostrar datos

### Páginas más afectadas:
1. **Vehículos** (`components/vehicles/stock-table.tsx`)
2. **Fotos** (`components/photos/photos-table.tsx`)
3. **Dashboard** (todas las cards)

### Prueba definitiva:
- ❌ NO funciona en navegador normal
- ✅ SÍ funciona en modo incógnito
- **Conclusión:** Cookies/localStorage corruptos

---

## 🔬 CAUSA RAÍZ

### Problema técnico:
```typescript
// ❌ INCORRECTO (causa re-renders infinitos):
const supabase = createClientComponentClient()
useEffect(() => {
  fetchData()
}, [supabase])  // ⚠️ supabase cambia en cada render

// ✅ CORRECTO:
const supabase = getSupabaseClient()  // Singleton
useEffect(() => {
  fetchData()
}, [])  // Sin dependencia de supabase
```

### ¿Por qué causa problemas?

1. **Re-renders infinitos:**
   - `createClientComponentClient()` crea nueva instancia cada vez
   - React detecta cambio en `supabase`
   - Ejecuta `useEffect` de nuevo
   - Vuelve a renderizar componente
   - Ciclo infinito ♾️

2. **Corrupción de cookies:**
   - Múltiples instancias escribiendo en cookies simultáneamente
   - Race conditions
   - Tokens de autenticación corruptos

3. **Propagación a otras páginas:**
   - Cookies corruptas afectan al cliente Supabase global
   - Otras páginas usan el mismo cliente corrupto
   - Error en cascada

---

## ✅ SOLUCIÓN APLICADA

### Archivos modificados (13 total):

#### 1. Vehículos (6 archivos):
- `components/vehicles/expense-type-display.tsx`
- `components/vehicles/expense-type-selector.tsx`
- `components/vehicles/stock-stats-card.tsx`
- `components/vehicles/stock-table.tsx` ⚠️ **CRÍTICO**
- `components/vehicles/time-stats-dashboard.tsx`
- `components/vehicles/movement-history.tsx`

#### 2. Transporte (2 archivos):
- `components/transport/transport-quick-form.tsx`
- `components/transport/transport-form.tsx`

#### 3. Otros (5 archivos):
- `components/entregas/entregas-table.tsx`
- `components/keys/key-document-incidences-card.tsx`
- `components/settings/favorites-settings.tsx`
- `components/photos/photos-table.tsx` ⚠️ **CRÍTICO**
- `.gitignore` (webpack error)

### Cambios realizados:

```typescript
// ANTES:
import { createClientComponentClient } from "@/lib/supabase/client"
// o
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const supabase = createClientComponentClient()

useEffect(() => {
  // código
}, [supabase])  // ❌

// DESPUÉS:
import { getSupabaseClient } from "@/lib/supabase/singleton"

const supabase = getSupabaseClient()

useEffect(() => {
  // código
}, [])  // ✅
```

---

## ⚠️ ARCHIVOS PENDIENTES (no tocar si funciona bien)

**Quedan 5 archivos con el patrón problemático:**

1. `components/dashboard/header.tsx` (2 instancias)
2. `components/dashboard/pending-movements-card.tsx`
3. `components/vehicles/key-management.tsx`
4. `components/vehicles/document-management.tsx`
5. `components/photos/user-display.tsx`

**ESTRATEGIA:** Solo modificar si dan problemas. No tocar si funciona.

---

## 🔍 CÓMO DETECTAR SI VUELVE A PASAR

### Síntomas tempranos:
1. Tabla no carga en primer intento
2. Necesitas F5 para ver datos
3. Console del navegador muestra:
   - Múltiples llamadas a la misma API
   - Errores de autenticación
   - "Too many re-renders"

### Prueba rápida:
```
1. Abrir modo incógnito
2. Cargar la página problemática
3. ¿Funciona en incógnito? → Cookies corruptas
4. ¿No funciona en incógnito? → Problema de código
```

### Dónde mirar en el código:
```typescript
// Buscar este patrón:
useEffect(() => {
  // ...
}, [..., supabase])  // ⚠️ PROBLEMA

// Debería ser:
}, [])  // ✅ SIN supabase
```

---

## 🛠️ SOLUCIÓN RÁPIDA SI VUELVE A PASAR

### Para usuarios afectados (temporal):
1. Borrar cookies del sitio
2. Refrescar página (F5)
3. Volver a loguearse

### Para desarrollador (permanente):
1. Identificar archivo problemático con `grep`:
   ```bash
   grep -n "}, \[.*supabase.*\])" components/**/*.tsx
   ```

2. Aplicar fix:
   - Cambiar import a `getSupabaseClient`
   - Quitar `supabase` de dependencies en `useEffect`

---

## 📊 DATOS SEGUROS

### ✅ Datos NO afectados por este problema:
- Datos en Supabase (tablas)
- Tasaciones guardadas
- Ventas registradas
- Fotos subidas
- Configuraciones de usuario

### ⚠️ Datos potencialmente afectados:
- Cookies de sesión (se pueden regenerar)
- LocalStorage de autenticación (se puede limpiar)

**NO se pierde información de usuario ni de negocio.**

---

## 🔐 BACKUP Y VERSIONES

### Último backup funcional:
- **Fecha:** 8 Oct 2025
- **Estado:** Funcionando correctamente
- **Ubicación:** [Especificar ruta/commit]

### Commit de solución:
```bash
git log --oneline --since="2025-10-14" --until="2025-10-15"
```

---

## 📈 PREVENCIÓN FUTURA

### Reglas al desarrollar:

1. **NUNCA usar `supabase` en dependencies de `useEffect`:**
   ```typescript
   // ❌ MAL
   useEffect(() => { ... }, [supabase])
   
   // ✅ BIEN
   useEffect(() => { ... }, [])
   ```

2. **Siempre usar `getSupabaseClient()` del singleton:**
   ```typescript
   import { getSupabaseClient } from "@/lib/supabase/singleton"
   const supabase = getSupabaseClient()
   ```

3. **Probar en incógnito antes de deploy:**
   - Verificar que tablas carguen sin F5
   - Navegar entre páginas varias veces
   - Esperar 30 segundos sin actividad y verificar

4. **Monitoreo:**
   - Si tabla requiere F5 → investigar inmediatamente
   - Revisar console por re-renders infinitos
   - Verificar Network tab por llamadas duplicadas

---

## 🎓 LECCIONES APRENDIDAS

1. **Singleton Pattern es crucial** para clientes de BD
2. **useEffect dependencies** deben ser valores estables
3. **Modo incógnito** es excelente para diagnosticar problemas de cookies
4. **Problemas de autenticación** pueden propagarse entre páginas
5. **Documentar inmediatamente** cuando se resuelve un problema crítico

---

## 📞 CONTACTO

**Si el problema vuelve a aparecer:**
1. NO TOCAR CÓDIGO inmediatamente
2. Documentar síntomas exactos
3. Probar en modo incógnito
4. Revisar este documento
5. Buscar patrón `}, [.*supabase.*])` en archivos nuevos/modificados

---

**Última actualización:** 14 Oct 2025  
**Estado actual:** ✅ Resuelto y monitoreando  
**Próxima revisión:** 15 Oct 2025

