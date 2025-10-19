# PLAN DE LIMPIEZA Y MIGRACIÓN COMPLETA A API ROUTES

**Fecha:** 19 Octubre 2025  
**Objetivo:** Código limpio, solo soluciones que funcionan  
**Estrategia:** Revertir lo que no funcionó + Aplicar API Routes en todo

---

## FASE 1: REVERTIR LO QUE NO FUNCIONÓ

### 1.1 Restaurar Singleton Original
- **Archivo:** `lib/supabase/client.ts`
- **Acción:** Volver a implementación con cache (singleton)
- **Razón:** El singleton no era el problema. El problema es usar el cliente desde el navegador.

### 1.2 Eliminar "Cliente Fresco" de Componentes
**Componentes afectados (12):**
1. `components/sales/sales-table.tsx`
2. `components/entregas/entregas-table.tsx`
3. `components/validados/validados-table.tsx`
4. `components/dashboard/admin/conversaciones/conversations-client.tsx`
5. `components/vehicles/vehicle-management.tsx`
6. `components/vehicles/key-management.tsx`
7. `components/vehicles/document-management.tsx`
8. `components/vehicles/stock-table.tsx`
9. `components/transport/transport-dashboard.tsx`
10. `components/transport/transport-table.tsx`
11. `components/transport/transport-detail.tsx`
12. `components/photos/photos-table.tsx` (mutations restantes)

**Cambio:**
```typescript
// Eliminar esto de cada función:
const supabase = createClientComponentClient()
```

### 1.3 Limpiar Logs de Debug Excesivos
- Eliminar logs `console.log("🔧 Cliente creado...")`
- Eliminar logs `console.log("🧹 Cliente limpiado...")`
- Mantener solo logs de errores importantes

---

## FASE 2: MIGRACIÓN COMPLETA A API ROUTES

### 2.1 FOTOS (Completar - faltan 4)

**Ya migradas (2):**
- ✅ `/api/photos/update-paint-status` → handlePaintStatusChange
- ✅ `/api/photos/update-photographer` → handlePhotographerChange

**Crear nuevas (4):**
1. `/api/photos/update-photo-status` → handlePhotoStatusChange
2. `/api/photos/mark-error` → handleMarkAsError
3. `/api/photos/subsanate-error` → handleSubsanateError
4. `/api/photos/delete-vehicle` → handleDeleteVehicle

---

### 2.2 VENTAS (5 mutations principales)

**Crear:**
1. `/api/sales/update-cyp-status` → handleCYPStatusChange
2. `/api/sales/update-photo360` → handlePhoto360StatusChange
3. `/api/sales/update-pre-delivery` → handlePreDeliveryCenterChange
4. `/api/sales/update-or` → handleORSave
5. `/api/sales/update-cell` → handleCellSave

---

### 2.3 ENTREGAS (2 mutations)

**Crear:**
1. `/api/entregas/update-incidencia` → handleIncidenciaChange
2. `/api/entregas/update-cell` → handleEditCellSave

---

### 2.4 STOCK (5 mutations más usadas)

**Crear (prioridad alta):**
1. `/api/stock/update-status` → Para cambios de estado
2. `/api/stock/update-cell` → Para edición de celdas
3. `/api/stock/bulk-update` → Para actualizaciones masivas

*(Las otras 10 se pueden hacer después si se usan poco)*

---

## FASE 3: LIMPIEZA FINAL

### 3.1 Eliminar Código Muerto
- Función `clearSupabaseClient()` (ya no se usa)
- Imports no utilizados

### 3.2 Documentación
- Actualizar `README_MIGRACION_API_ROUTES.md`
- Crear guía: "Cómo agregar nuevas mutations"

---

## ORDEN DE EJECUCIÓN

**Día 1 (Ahora):**
1. ✅ Fotos completo (4 mutations restantes)
2. ✅ Ventas completo (5 mutations)

**Día 2 (Cuando quieras):**
3. Entregas (2 mutations)
4. Stock (5 principales)
5. Limpieza final

---

## ESTADO ACTUAL

- Queries: ✅ 100% API Routes
- Mutations: ⚠️ ~15% API Routes (2 de ~40)
- Código limpio: ❌ Tiene código "cliente fresco" que no sirve


