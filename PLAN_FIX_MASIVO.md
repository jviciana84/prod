# 📋 PLAN FIX MASIVO - TODA LA APP

**Objetivo:** Eliminar cliente global singleton de TODOS los componentes  
**Solución:** Cliente fresco en cada mutación  
**Scope:** 73 archivos

---

## 🎯 ESTRATEGIA

### Componentes CRÍTICOS (prioridad 1):
1. ✅ photos-table.tsx (YA HECHO)
2. ⏳ sales-table.tsx
3. ⏳ entregas-table.tsx
4. ⏳ validados-validados-table.tsx
5. ⏳ transport-dashboard.tsx
6. ⏳ conversations-client.tsx
7. ⏳ vehicle-management.tsx

### Componentes SECUNDARIOS (prioridad 2):
- Admin managers
- Settings managers
- Forms varios

### Componentes TERCIARIOS (prioridad 3):
- Backups
- Debug pages
- Auth components (solo lectura)

---

## 🔧 CAMBIO A APLICAR

### Patrón de fix:

❌ **ANTES:**
```typescript
const supabase = createClientComponentClient() // Global

const handleUpdate = async () => {
  await supabase.from("table").update(...) // Cliente global zombie
}
```

✅ **DESPUÉS:**
```typescript
// NO cliente global

const handleUpdate = async () => {
  const supabase = createClientComponentClient() // Fresco cada vez
  await supabase.from("table").update(...)
}
```

---

## 📊 PROGRESO

Total: 73 archivos
- ✅ Completado: 1 (photos)
- ⏳ En progreso: 0
- ⏳ Pendiente: 72

