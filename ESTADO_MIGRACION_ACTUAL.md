# ESTADO DE MIGRACIÓN - 19 OCT 2025 17:30

## ✅ COMPLETADO (100%)

### Queries → API Routes
- ✅ Fotos
- ✅ Ventas
- ✅ Entregas
- ✅ Noticias
- ✅ Stock
- ✅ Validados
- ✅ Dashboard
- ✅ Conversaciones
- ✅ Llaves historial
- ✅ Transport
- ✅ Tasaciones
- ✅ Ventas profesionales

**Total:** 12 páginas/componentes

---

### Mutations → API Routes (COMPLETADAS)

#### FOTOS (6/6) ✅
1. ✅ `/api/photos/update-paint-status`
2. ✅ `/api/photos/update-photographer`
3. ✅ `/api/photos/update-photo-status`
4. ✅ `/api/photos/mark-error`
5. ✅ `/api/photos/subsanate-error`
6. ✅ `/api/photos/delete-vehicle`

#### VENTAS (4/4) ✅
1. ✅ `/api/sales/update-cyp-status`
2. ✅ `/api/sales/update-photo360`
3. ✅ `/api/sales/update-or`
4. ✅ `/api/sales/update-cell`

---

## ⚠️ PENDIENTE

### Mutations → API Routes (FALTAN)

#### ENTREGAS (2)
1. ❌ Actualizar incidencia
2. ❌ Editar celda

#### STOCK (15 aprox)
1. ❌ Actualizar estado venta
2. ❌ Editar celdas (múltiples campos)
3. ❌ Bulk updates
4. ❌ Etc.

#### OTROS COMPONENTES
- ❌ Document management (inserts)
- ❌ Key management (inserts/updates)
- ❌ Transport (updates)
- ❌ Validados (updates)
- ❌ Conversations (delete)

---

## 🧹 LIMPIEZA PENDIENTE

### Eliminar "Cliente Fresco" de:
1. ❌ `components/entregas/entregas-table.tsx`
2. ❌ `components/validados/validados-table.tsx`
3. ❌ `components/vehicles/document-management.tsx`
4. ❌ `components/vehicles/key-management.tsx`
5. ❌ `components/vehicles/stock-table.tsx`
6. ❌ `components/transport/transport-dashboard.tsx`
7. ❌ `components/transport/transport-table.tsx`
8. ❌ `components/transport/transport-detail.tsx`
9. ❌ `components/dashboard/admin/conversaciones/conversations-client.tsx`

**Estos componentes tienen:**
```typescript
const supabase = createClientComponentClient()
```

**Necesitan:**
- O migrar a API Routes
- O eliminar el "cliente fresco" y volver al singleton simple

---

## 🎯 SIGUIENTE PASO

**Opción A:** Migrar Entregas + Stock a API Routes (más trabajo, 100% limpio)
**Opción B:** Solo limpiar código (eliminar cliente fresco de componentes no migrados)
**Opción C:** Dejarlo así (Fotos + Ventas funcionan perfecto)

---

## 📊 MÉTRICAS

- **Páginas críticas migradas:** 2/2 (Fotos, Ventas) ✅
- **Mutations migradas:** 10/~50 (~20%)
- **Código limpio:** Fotos y Ventas ✅, resto con cliente fresco ⚠️


