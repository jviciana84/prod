# 📐 ESTÁNDARES DE DESARROLLO - API ROUTES

**Fecha:** 19 de Octubre de 2025  
**Versión:** 1.0  
**Obligatorio:** SÍ - Para TODO código nuevo

---

## 🎯 REGLA DE ORO

**❌ NUNCA MÁS:**
```typescript
// ❌ PROHIBIDO: Cliente directo para consultas iniciales
const supabase = createClientComponentClient()

useEffect(() => {
  const loadData = async () => {
    const { data } = await supabase.from("table").select("*")
    setData(data)
  }
  loadData()
}, [])
```

**✅ SIEMPRE:**
```typescript
// ✅ CORRECTO: API Route + fetch
useEffect(() => {
  const loadData = async () => {
    const response = await fetch("/api/table/list")
    const { data } = await response.json()
    setData(data)
  }
  loadData()
}, [])
```

---

## 📋 PATRÓN OBLIGATORIO

### 1️⃣ Backend: API Route

**Ubicación:** `app/api/[recurso]/[accion]/route.ts`

**Plantilla:**
```typescript
// app/api/mi-tabla/list/route.ts
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Verificar autenticación
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Consulta de datos
    const { data, error } = await supabase
      .from("mi_tabla")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error en consulta:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
    })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
```

---

### 2️⃣ Frontend: Componente

**Plantilla:**
```typescript
"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function MiComponente() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  // Cliente Supabase SOLO para mutaciones (opcional)
  // const supabase = createClientComponentClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      console.log("🔍 Cargando datos desde API...")
      const response = await fetch("/api/mi-tabla/list")

      if (!response.ok) {
        throw new Error("Error al cargar datos")
      }

      const { data } = await response.json()
      setData(data || [])
      console.log("✅ Datos cargados:", data?.length || 0)
    } catch (error) {
      console.error("❌ Error:", error)
      toast.error("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  // Mutaciones (si necesario)
  const handleUpdate = async (id: string, newData: any) => {
    const supabase = createClientComponentClient()
    const { error } = await supabase
      .from("mi_tabla")
      .update(newData)
      .eq("id", id)

    if (error) {
      toast.error("Error al actualizar")
      return
    }

    toast.success("Actualizado correctamente")
    loadData() // Recargar desde API
  }

  return (
    <div>
      {loading ? <p>Cargando...</p> : <Table data={data} />}
    </div>
  )
}
```

---

## 🚫 ANTI-PATRONES (NO HACER)

### ❌ 0. Datos falsos/mock/ejemplo
```typescript
// ❌ PROHIBIDO: Datos falsos
const mockData = [{ id: "1", name: "Fake" }]
const usarDatosEjemplo = () => { ... }
const fallbackData = [...]

// ✅ CORRECTO: Array vacío + error claro
if (error) {
  setPedidos([])
  toast.error("Error al cargar. Contacta soporte.")
}
```

### ❌ 1. Cliente directo en useEffect
```typescript
// ❌ PROHIBIDO
const supabase = createClientComponentClient()
useEffect(() => {
  supabase.from("table").select("*").then(...)
}, [])
```

### ❌ 2. Cliente en useRef
```typescript
// ❌ PROHIBIDO
const supabaseRef = useRef(createClientComponentClient())
useEffect(() => {
  supabaseRef.current.from("table").select("*").then(...)
}, [])
```

### ❌ 3. Consulta directa en componente server
```typescript
// ❌ PROHIBIDO (usar API Route)
export default async function ServerComponent() {
  const supabase = await createServerClient()
  const { data } = await supabase.from("table").select("*")
  return <div>{data}</div>
}
```
**Excepción:** Solo permitido en Layout o página principal de Dashboard.

---

## ✅ CASOS DE USO

### Caso 1: Tabla con datos

**Necesitas:** Mostrar lista de items

**Solución:**
1. Crear `/api/items/list/route.ts`
2. Component hace `fetch("/api/items/list")`

---

### Caso 2: Formulario que crea datos

**Necesitas:** POST para crear item

**Solución:**
1. Crear `/api/items/create/route.ts` (POST)
2. Component hace `fetch("/api/items/create", { method: "POST", body: ... })`

**Alternativa:** Usar cliente directo para mutaciones simples (INSERT)
```typescript
const supabase = createClientComponentClient()
const { error } = await supabase.from("items").insert(newData)
```

---

### Caso 3: Edición de item

**Necesitas:** UPDATE de datos

**Solución:**
```typescript
// Opción A: API Route
POST /api/items/update
Body: { id, data }

// Opción B: Cliente directo (más simple)
const supabase = createClientComponentClient()
await supabase.from("items").update(data).eq("id", id)
```

**Recomendación:** Cliente directo para mutaciones simples (más rápido).

---

### Caso 4: Filtros complejos

**Necesitas:** Búsqueda con filtros

**Solución:**
```typescript
// API Route con parámetros
POST /api/items/list
Body: { search, filters, page, limit }

// Component
const response = await fetch("/api/items/list", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ search, filters, page, limit }),
})
```

---

## 📝 CHECKLIST ANTES DE COMMIT

### Para TODO código nuevo:

- [ ] ¿La consulta inicial usa API Route? (✅ Sí / ❌ No)
- [ ] ¿Hay logs de tracking? (🔍 Cargando... / ✅ Cargado)
- [ ] ¿Hay manejo de errores? (try-catch + toast)
- [ ] ¿Verificas autenticación en API Route?
- [ ] ¿El cliente Supabase solo se usa para mutaciones?
- [ ] ¿Hay loading state?
- [ ] ¿Probaste que funciona sin F5?

---

## 🔍 CODE REVIEW CHECKLIST

### Al revisar Pull Request:

```markdown
### Checklist API Routes

- [ ] **Sin cliente directo en consultas iniciales**
  - ❌ Encontrado: `useEffect(() => supabase.from(...)`
  - ✅ Correcto: `useEffect(() => fetch("/api/...")`

- [ ] **API Route creada si necesaria**
  - Ubicación: `app/api/[recurso]/[accion]/route.ts`
  - Autenticación verificada: ✅
  - Manejo de errores: ✅

- [ ] **Logs de tracking**
  - 🔍 Log inicio: ✅
  - ✅ Log éxito: ✅
  - ❌ Log error: ✅

- [ ] **Manejo de errores**
  - try-catch: ✅
  - toast.error(): ✅
  - Estado de loading: ✅

- [ ] **Cliente solo para mutaciones**
  - INSERT/UPDATE/DELETE: ✅ (permitido)
  - SELECT inicial: ❌ (usar API Route)
```

---

## 📚 EJEMPLOS REALES DEL PROYECTO

### ✅ Ejemplo 1: Ventas (Completo)

**API Route:** `app/api/sales/list/route.ts`
```typescript
export async function GET() {
  const supabase = await createServerClient(await cookies())
  const { data } = await supabase.from("sales_vehicles").select("*")
  return NextResponse.json({ data })
}
```

**Component:** `components/sales/sales-table.tsx`
```typescript
const loadSoldVehicles = async () => {
  console.log("🔄 Cargando desde API...")
  const response = await fetch("/api/sales/list")
  const { data } = await response.json()
  console.log("✅ Cargados:", data.length)
  setVehicles(data)
}
```

---

### ✅ Ejemplo 2: Noticias (Simple)

**API Route:** `app/api/noticias/list/route.ts`
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined

  const query = supabase.from("noticias").select("*")
  if (limit) query.limit(limit)
  
  const { data } = await query
  return NextResponse.json({ data })
}
```

**Component:** `components/dashboard/news-dropdown.tsx`
```typescript
const fetchNoticias = async () => {
  const response = await fetch("/api/noticias/list?limit=5")
  const { data } = await response.json()
  setNoticias(data)
}
```

---

### ✅ Ejemplo 3: Conversaciones (Filtros)

**API Route:** `app/api/conversations/list/route.ts`
```typescript
export async function POST(request: Request) {
  const body = await request.json()
  const { page, itemsPerPage, sessionId, userId, searchTerm } = body

  let query = supabase.from("conversations").select("*", { count: "exact" })
  
  if (sessionId !== "all") query = query.eq("session_id", sessionId)
  if (userId !== "all") query = query.eq("user_id", userId)
  if (searchTerm) query = query.ilike("message", `%${searchTerm}%`)
  
  query = query.range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
  
  const { data, count } = await query
  return NextResponse.json({ data, count })
}
```

---

## 🎓 TRAINING: MIGRAR CÓDIGO LEGACY

### Si encuentras código antiguo:

```typescript
// ❌ CÓDIGO ANTIGUO (legacy)
const supabase = createClientComponentClient()

useEffect(() => {
  const loadData = async () => {
    const { data } = await supabase.from("old_table").select("*")
    setData(data)
  }
  loadData()
}, [])
```

### Proceso de migración:

**Paso 1:** Crear API Route
```bash
# Crear archivo
mkdir -p app/api/old-table/list
touch app/api/old-table/list/route.ts
```

**Paso 2:** Implementar API Route
```typescript
// app/api/old-table/list/route.ts
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createServerClient(await cookies())
  const { data } = await supabase.from("old_table").select("*")
  return NextResponse.json({ data })
}
```

**Paso 3:** Refactorizar componente
```typescript
// ✅ CÓDIGO NUEVO (migrado)
useEffect(() => {
  const loadData = async () => {
    console.log("🔍 Cargando desde API...")
    const response = await fetch("/api/old-table/list")
    const { data } = await response.json()
    setData(data)
    console.log("✅ Cargado:", data.length)
  }
  loadData()
}, [])
```

**Paso 4:** Probar
```bash
npm run dev
# Verificar en consola: 🔍 Cargando... → ✅ Cargado
```

---

## 🚀 WORKFLOW PARA NUEVA FEATURE

### 1. Planificación
```markdown
Feature: [Nombre de la feature]

Datos necesarios:
- Tabla 1: [nombre]
- Tabla 2: [nombre]

API Routes a crear:
- GET /api/feature/list
- POST /api/feature/create (opcional)
- POST /api/feature/update (opcional)
```

### 2. Implementación

**Orden recomendado:**
1. ✅ Crear API Routes
2. ✅ Probar API Routes en Postman/Thunder Client
3. ✅ Crear componente frontend
4. ✅ Integrar con API Routes
5. ✅ Probar en local
6. ✅ Code review
7. ✅ Push a staging
8. ✅ Testing en staging
9. ✅ Deploy a producción

### 3. Testing

**Checklist:**
- [ ] Datos cargan correctamente
- [ ] No hay loading infinito
- [ ] Consola sin errores rojos
- [ ] Navegación fluida
- [ ] F5 no es necesario
- [ ] Funciona en incógnito

---

## 📊 MÉTRICAS DE CALIDAD

### KPIs del nuevo código:

| Métrica | Objetivo |
|---------|----------|
| **API Routes para consultas iniciales** | 100% |
| **Logs de tracking** | 100% |
| **Manejo de errores** | 100% |
| **Loading infinito** | 0% |
| **Errores en consola** | 0 |
| **F5 necesario** | 0% |

---

## 🎯 RESUMEN EJECUTIVO

### Para desarrolladores nuevos:

**3 Reglas Simples:**

1. **Consultas iniciales** → API Route + fetch
2. **Mutaciones simples** → Cliente directo (opcional)
3. **Siempre logs** → 🔍 Cargando... / ✅ Cargado

**Plantillas listas:**
- `app/api/[recurso]/list/route.ts` (backend)
- Componente con fetch (frontend)

**Ejemplos reales:**
- Ver `app/api/sales/list/route.ts`
- Ver `components/sales/sales-table.tsx`

---

## 🆘 SOPORTE

### Si tienes dudas:

1. **Lee documentación:**
   - `README_MIGRACION_API_ROUTES.md`
   - Este documento

2. **Busca ejemplos:**
   - 18 API Routes ya creadas
   - 14 componentes ya migrados

3. **Pregunta antes de codear:**
   - ¿Esto necesita API Route?
   - ¿O puedo usar cliente directo?

4. **En caso de duda:**
   - **Siempre usa API Route** (más seguro)

---

**Versión:** 1.0  
**Última actualización:** 19 de Octubre de 2025  
**Mantenido por:** Equipo de desarrollo

