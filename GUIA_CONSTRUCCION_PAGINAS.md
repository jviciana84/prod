# 📋 GUÍA DE CONSTRUCCIÓN DE PÁGINAS - CVO Dashboard

## ⚠️ REGLA DE ORO: PATRÓN DE MUTACIONES vs CONSULTAS

```typescript
// ✅ CONSULTAS (SELECT) → Cliente directo
const supabase = createClientComponentClient()
const { data } = await supabase.from("tabla").select("*")

// ✅ MUTACIONES (INSERT/UPDATE/DELETE) → API Route
const response = await fetch("/api/ruta", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(datos)
})
```

**¿Por qué?** Las consultas no tienen problema de "zombie client". Las mutaciones SÍ necesitan servidor para evitar tokens expirados.

---

## 📄 ESTRUCTURA DE UNA PÁGINA

### 1️⃣ **Página sin Tabla (Página Simple)**

```typescript
// app/dashboard/mi-pagina/page.tsx
"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"

export default function MiPagina() {
  const supabase = createClientComponentClient()
  const [datos, setDatos] = useState([])
  const [loading, setLoading] = useState(true)

  // ✅ CONSULTA - Cliente directo
  useEffect(() => {
    async function cargarDatos() {
      const { data, error } = await supabase
        .from("mi_tabla")
        .select("*")
      
      if (error) {
        console.error("Error:", error)
        return
      }
      
      setDatos(data || [])
      setLoading(false)
    }
    
    cargarDatos()
  }, [])

  // ✅ MUTACIÓN - API Route
  const handleGuardar = async (registro) => {
    try {
      const response = await fetch("/api/mi-ruta/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registro)
      })

      if (!response.ok) throw new Error("Error al guardar")
      
      // Recargar datos después de guardar
      const { data } = await supabase.from("mi_tabla").select("*")
      setDatos(data || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs className="mt-4" />
          <CompactSearchWithModal className="mt-4" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Página</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contenido</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tu contenido aquí */}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### 2️⃣ **Página con Tabla (Componente Separado)**

#### **A. Archivo de la Página**

```typescript
// app/dashboard/mi-pagina/page.tsx
"use client"

import { useState, useCallback } from "react"
import MiTabla from "@/components/mi-seccion/mi-tabla"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CompactSearchWithModal } from "@/components/dashboard/compact-search-with-modal"

export default function MiPaginaConTabla() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  return (
    <div className="p-4 md:p-5 space-y-4 pb-20">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Breadcrumbs className="mt-4" />
          <CompactSearchWithModal className="mt-4" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Página con Tabla</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <MiTabla key={refreshKey} onRefresh={handleRefresh} />
        </CardContent>
      </Card>
    </div>
  )
}
```

#### **B. Componente de la Tabla**

```typescript
// components/mi-seccion/mi-tabla.tsx
"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function MiTabla({ onRefresh }) {
  const supabase = createClientComponentClient()
  const { toast } = useToast()
  const [datos, setDatos] = useState([])
  const [loading, setLoading] = useState(true)

  // ✅ CONSULTA - Cliente directo
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from("mi_tabla")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error cargando datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      })
      return
    }

    setDatos(data || [])
    setLoading(false)
  }

  // ✅ MUTACIÓN - API Route
  const handleEditar = async (id, cambios) => {
    try {
      const response = await fetch("/api/mi-ruta/editar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...cambios })
      })

      if (!response.ok) throw new Error("Error al editar")

      toast({
        title: "Éxito",
        description: "Registro actualizado correctamente"
      })

      // Recargar datos
      await cargarDatos()
      onRefresh?.()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el registro",
        variant: "destructive"
      })
    }
  }

  // ✅ MUTACIÓN - API Route
  const handleEliminar = async (id) => {
    try {
      const response = await fetch("/api/mi-ruta/eliminar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })

      if (!response.ok) throw new Error("Error al eliminar")

      toast({
        title: "Éxito",
        description: "Registro eliminado correctamente"
      })

      // Recargar datos
      await cargarDatos()
      onRefresh?.()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campo 1</TableHead>
          <TableHead>Campo 2</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {datos.map((registro) => (
          <TableRow key={registro.id}>
            <TableCell>{registro.campo1}</TableCell>
            <TableCell>{registro.campo2}</TableCell>
            <TableCell>
              <Button onClick={() => handleEditar(registro.id, { campo1: "nuevo" })}>
                Editar
              </Button>
              <Button onClick={() => handleEliminar(registro.id)}>
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

### 3️⃣ **API Routes (Servidor)**

#### **Crear API Route para EDITAR**

```typescript
// app/api/mi-ruta/editar/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id, ...cambios } = await request.json()

    if (!id) {
      return NextResponse.json({ 
        message: "ID requerido" 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("mi_tabla")
      .update(cambios)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)

  } catch (error: any) {
    console.error("Error editando:", error.message)
    return NextResponse.json({ 
      message: "Error al editar", 
      error: error.message 
    }, { status: 500 })
  }
}
```

#### **Crear API Route para ELIMINAR**

```typescript
// app/api/mi-ruta/eliminar/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ 
        message: "ID requerido" 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from("mi_tabla")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ message: "Eliminado correctamente" })

  } catch (error: any) {
    console.error("Error eliminando:", error.message)
    return NextResponse.json({ 
      message: "Error al eliminar", 
      error: error.message 
    }, { status: 500 })
  }
}
```

---

## 🚫 ERRORES COMUNES A EVITAR

### ❌ **ERROR 1: Importar supabaseAdmin inexistente**

```typescript
// ❌ MAL
import { supabaseAdmin } from "@/lib/supabaseClient"

// ✅ BIEN
import { createClientComponentClient } from "@/lib/supabase/client"
```

### ❌ **ERROR 2: Mutaciones directas en componentes**

```typescript
// ❌ MAL
const supabase = createClientComponentClient()
await supabase.from("tabla").update({ campo: valor }).eq("id", id)

// ✅ BIEN
await fetch("/api/ruta/editar", {
  method: "POST",
  body: JSON.stringify({ id, campo: valor })
})
```

### ❌ **ERROR 3: Usar !inner en queries**

```typescript
// ❌ MAL
.select("*, tabla_relacionada!inner(campo)")

// ✅ BIEN
.select("*, tabla_relacionada(campo)")
```

### ❌ **ERROR 4: No recargar datos después de mutación**

```typescript
// ❌ MAL
await fetch("/api/ruta/editar", { ... })
// No recarga los datos

// ✅ BIEN
await fetch("/api/ruta/editar", { ... })
await cargarDatos() // Recargar
```

---

## 📦 IMPORTS NECESARIOS

### **Para Componentes Cliente**

```typescript
"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
```

### **Para API Routes**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
```

---

## ✅ CHECKLIST ANTES DE CREAR PÁGINA

- [ ] ¿Necesito hacer INSERT/UPDATE/DELETE? → Crear API Route
- [ ] ¿Solo necesito SELECT? → Usar `createClientComponentClient` directo
- [ ] ¿La página tiene tabla? → Separar en componente
- [ ] ¿Importo correctamente? → `createClientComponentClient` NO `supabaseAdmin`
- [ ] ¿Recargo datos después de mutación? → Llamar a función de carga
- [ ] ¿Tengo breadcrumbs y search? → Incluir componentes estándar
- [ ] ¿Uso !inner en queries? → Quitar `!inner`, usar join normal

---

## 🎯 RESUMEN RÁPIDO

| Operación | Dónde | Cómo |
|-----------|-------|------|
| **SELECT** | Componente Cliente | `createClientComponentClient()` |
| **INSERT** | API Route | `createServerClient()` + Service Role |
| **UPDATE** | API Route | `createServerClient()` + Service Role |
| **DELETE** | API Route | `createServerClient()` + Service Role |

**Versión:** 1.2.356-ed422b9  
**Última actualización:** 23/10/2025

