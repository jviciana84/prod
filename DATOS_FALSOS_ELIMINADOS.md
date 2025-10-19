# ❌ DATOS FALSOS ELIMINADOS

**Fecha:** 19 de Octubre de 2025  
**Razón:** NO debe haber datos falsos/mock en producción

---

## 🚫 PROBLEMA IDENTIFICADO

**Usuario reportó:** "No quiero datos falsos en ningún sitio"

**Archivos con datos falsos encontrados:**
1. `components/validados/validados-table.tsx` - Fallback a datos de ejemplo
2. `app/api/tasaciones/list/route.ts` - Datos mock
3. `app/api/ventas-profesionales/list/route.ts` - Datos mock

---

## ✅ CORRECCIONES APLICADAS

### 1. ValidadosTable ✅

**Antes (❌ MALO):**
```typescript
if (!response.ok) {
  toast.error("Error al cargar los datos")
  usarDatosEjemplo() // ❌ Muestra datos falsos
  return
}

const usarDatosEjemplo = () => {
  const pedidosEjemplo = [
    { id: "1", matricula: "1234ABC", ... } // ❌ Datos falsos
  ]
  setPedidos(pedidosEjemplo)
  toast.info("Mostrando datos de ejemplo") // ❌ Engañoso
}
```

**Ahora (✅ BIEN):**
```typescript
if (!response.ok) {
  toast.error("Error al cargar los datos. Por favor, contacta soporte.")
  setPedidos([]) // ✅ Array vacío
  actualizarContadores([]) // ✅ Contadores en 0
  return
}

// ✅ Función usarDatosEjemplo ELIMINADA completamente
```

---

### 2. API Tasaciones ✅

**Antes (❌ MALO):**
```typescript
// ❌ Datos mock hardcodeados
const mockTasaciones = [
  {
    id: "1",
    fecha: "2025-01-10",
    matricula: "1234ABC",
    marca: "BMW",
    modelo: "Serie 3",
    // ... más datos falsos
  },
]

return NextResponse.json({
  data: { tasaciones: mockTasaciones } // ❌ Retorna datos falsos
})
```

**Ahora (✅ BIEN):**
```typescript
// ✅ Consulta real de base de datos
const { data: tasaciones, error } = await supabase
  .from("tasaciones")
  .select("*")

if (error) {
  // Si la tabla no existe, retornar VACÍO
  if (error.message.includes("does not exist")) {
    return NextResponse.json({
      data: { tasaciones: [] } // ✅ Array vacío, NO datos falsos
    })
  }
  return NextResponse.json({ error: error.message }, { status: 500 })
}

return NextResponse.json({
  data: { tasaciones: tasaciones || [] } // ✅ Datos reales o vacío
})
```

---

### 3. API Ventas Profesionales ✅

**Antes (❌ MALO):**
```typescript
// ❌ Datos mock hardcodeados
const mockData = [
  {
    id: "1",
    license_plate: "1234ABC",
    model: "BMW Serie 1",
    // ... más datos falsos
  },
]

return NextResponse.json({
  data: { sales: mockData } // ❌ Retorna datos falsos
})
```

**Ahora (✅ BIEN):**
```typescript
// ✅ Consulta real de base de datos
const { data: sales, error } = await supabase
  .from("professional_sales")
  .select("*")

if (error) {
  // Si la tabla no existe, retornar VACÍO
  if (error.message.includes("does not exist")) {
    return NextResponse.json({
      data: { sales: [] } // ✅ Array vacío, NO datos falsos
    })
  }
  return NextResponse.json({ error: error.message }, { status: 500 })
}

return NextResponse.json({
  data: { sales: sales || [] } // ✅ Datos reales o vacío
})
```

---

## 📋 NUEVA POLÍTICA

### ✅ Comportamiento Correcto:

**Si consulta tiene éxito:**
- ✅ Mostrar datos reales
- ✅ Log: "✅ X items cargados"

**Si consulta falla:**
- ✅ Mostrar array vacío: `[]`
- ✅ Toast error claro
- ✅ Log: "❌ Error al cargar"
- ✅ NO mostrar datos falsos

**Si tabla no existe:**
- ✅ Retornar array vacío: `[]`
- ✅ Log: "Tabla no existe aún"
- ✅ UI muestra "Sin datos" o estado vacío

---

## 🚫 PROHIBIDO

### ❌ NUNCA HACER:

```typescript
// ❌ PROHIBIDO: Datos mock/ejemplo/falsos
const mockData = [...]
const datosEjemplo = [...]
const fallbackData = [...]

// ❌ PROHIBIDO: Funciones que crean datos falsos
const usarDatosEjemplo = () => { ... }
const generateMockData = () => { ... }

// ❌ PROHIBIDO: Toast engañoso
toast.info("Mostrando datos de ejemplo")
toast.success("Datos cargados") // cuando son falsos
```

### ✅ PERMITIDO:

```typescript
// ✅ Array vacío cuando falla
setPedidos([])
setData([])

// ✅ Toast honesto
toast.error("Error al cargar. Contacta soporte.")
toast.info("No hay datos disponibles")

// ✅ Estado de carga
setLoading(false)
setError("No se pudieron cargar los datos")
```

---

## 🔍 VERIFICACIÓN

### Búsqueda de datos falsos:

```bash
# Buscar cualquier mención a mock/ejemplo/falso
grep -r "mock" app/api/
grep -r "ejemplo" components/
grep -r "fallback.*data" components/
grep -r "usarDatos" components/
```

**Resultado esperado:** 0 coincidencias

---

## 📊 IMPACTO

### Antes:
- ❌ Usuarios veían datos falsos sin saberlo
- ❌ Decisiones basadas en información incorrecta
- ❌ Confusión sobre qué es real y qué no
- ❌ Bugs ocultos por datos que "siempre funcionan"

### Ahora:
- ✅ Si hay error, se muestra claramente
- ✅ Solo datos reales de base de datos
- ✅ Array vacío = sin datos (honesto)
- ✅ Errores visibles = se corrigen rápido

---

## 🎯 ESTÁNDAR DE CALIDAD

### Regla de Oro:

> **"Prefiero ver 0 datos reales que 100 datos falsos"**

### Checklist antes de commit:

- [ ] ¿Hay datos mock/ejemplo? → ❌ Eliminar
- [ ] ¿Hay fallback a datos falsos? → ❌ Cambiar a array vacío
- [ ] ¿Hay funciones que generan datos? → ❌ Eliminar
- [ ] ¿El error se muestra claramente? → ✅ Sí
- [ ] ¿Array vacío cuando falla? → ✅ Sí

---

## 🔄 MIGRACIÓN DE CÓDIGO LEGACY

### Si encuentras código con datos falsos:

**1. Identificar:**
```typescript
// ❌ Encontrado: datos falsos
const mockData = [...]
usarDatosEjemplo()
```

**2. Eliminar:**
```typescript
// ✅ Eliminado: función completa
// usarDatosEjemplo() - ELIMINADO
```

**3. Reemplazar:**
```typescript
// ✅ Nuevo: array vacío + error claro
setPedidos([])
toast.error("Error al cargar. Contacta soporte.")
```

**4. Verificar:**
```bash
# Asegurar que no quede nada
git diff | grep "mock\|ejemplo\|fallback"
# Resultado esperado: solo eliminaciones (-)
```

---

## ✅ ARCHIVOS MODIFICADOS

1. **components/validados/validados-table.tsx**
   - ❌ Eliminada función `usarDatosEjemplo()`
   - ❌ Eliminado array `pedidosEjemplo`
   - ✅ Reemplazado con `setPedidos([])`

2. **app/api/tasaciones/list/route.ts**
   - ❌ Eliminado `mockTasaciones`
   - ✅ Agregada consulta real a tabla `tasaciones`
   - ✅ Retorna `[]` si tabla no existe

3. **app/api/ventas-profesionales/list/route.ts**
   - ❌ Eliminado `mockData`
   - ✅ Agregada consulta real a tabla `professional_sales`
   - ✅ Retorna `[]` si tabla no existe

---

## 📝 DOCUMENTACIÓN ACTUALIZADA

**Actualizar:**
- `README_MIGRACION_API_ROUTES.md` - Eliminar referencias a "fallback a datos de ejemplo"
- `ESTANDARES_DESARROLLO_API_ROUTES.md` - Agregar política "NO DATOS FALSOS"

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Commit cambios
2. ⏳ Testing local (verificar que muestre vacío cuando falla)
3. ⏳ Push a staging
4. ⏳ Testing en staging
5. ⏳ Deploy a producción

---

**Fecha:** 19 de Octubre de 2025  
**Estado:** ✅ CORREGIDO  
**Política:** 0 TOLERANCIA a datos falsos

