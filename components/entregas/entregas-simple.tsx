"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

// Crear cliente Supabase sin autenticación
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente simple sin cookies problemáticas
const simpleSupabase = {
  async query(sql: string, params: any[] = []) {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ sql, params }),
    })
    return response.json()
  },

  async updateEntrega(id: string, data: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/entregas?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  async getEntregas() {
    const response = await fetch(`${supabaseUrl}/rest/v1/entregas?select=*&order=fecha_venta.desc`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })
    return response.json()
  },

  async insertHistorial(data: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/incidencias_historial`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },
}

const TIPOS_INCIDENCIA = [
  "PINTURA",
  "MECANICA",
  "LIMPIEZA",
  "2ª LLAVE",
  "DOCUMENTACION",
  "ACCESORIOS",
  "DAÑOS",
  "REVISIÓN",
  "GARANTÍA",
  "FINANCIACIÓN",
  "SEGURO",
  "OTROS",
]

interface Entrega {
  id: string
  fecha_venta: string | null
  fecha_entrega: string | null
  matricula: string | null
  modelo: string | null
  asesor: string | null
  or: string | null
  incidencia: boolean
  tipos_incidencia: string[] | null
  observaciones: string | null
}

export function EntregasSimple() {
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const loadEntregas = async () => {
    try {
      setLoading(true)
      const data = await simpleSupabase.getEntregas()

      if (Array.isArray(data)) {
        setEntregas(data)
        toast.success("Datos cargados correctamente")
      } else {
        console.error("Error al cargar entregas:", data)
        toast.error("Error al cargar los datos")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const toggleIncidencia = async (entregaId: string, tipo: string) => {
    try {
      setUpdating(entregaId)

      const entrega = entregas.find((e) => e.id === entregaId)
      if (!entrega) return

      const tiposActuales = entrega.tipos_incidencia || []
      const tieneIncidencia = tiposActuales.includes(tipo)

      let nuevosTipos: string[]
      if (tieneIncidencia) {
        nuevosTipos = tiposActuales.filter((t) => t !== tipo)
      } else {
        nuevosTipos = [...tiposActuales, tipo]
      }

      const updateData = {
        tipos_incidencia: nuevosTipos,
        incidencia: nuevosTipos.length > 0,
      }

      // Actualizar estado local inmediatamente
      setEntregas((prev) => prev.map((e) => (e.id === entregaId ? { ...e, ...updateData } : e)))

      // Actualizar en base de datos
      const result = await simpleSupabase.updateEntrega(entregaId, updateData)

      if (result.error) {
        throw new Error(result.error.message)
      }

      // Registrar en historial
      await simpleSupabase.insertHistorial({
        entrega_id: entregaId,
        tipo_incidencia: tipo,
        accion: tieneIncidencia ? "eliminada" : "añadida",
        usuario_id: null, // Como admin, no necesitamos autenticación
        usuario_nombre: "Admin",
        fecha: new Date().toISOString(),
        comentario: `Incidencia ${tipo} ${tieneIncidencia ? "eliminada" : "añadida"} por Admin`,
      })

      toast.success(`Incidencia ${tipo} ${tieneIncidencia ? "eliminada" : "añadida"}`)
    } catch (error) {
      console.error("Error al actualizar:", error)
      toast.error("Error al actualizar la incidencia")
      // Recargar datos en caso de error
      await loadEntregas()
    } finally {
      setUpdating(null)
    }
  }

  useEffect(() => {
    loadEntregas()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center">
          <BMWMSpinner size={24} className="mr-2" />
          <span>Cargando entregas...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Entregas - Modo Admin</CardTitle>
        <Button onClick={loadEntregas} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entregas.map((entrega) => (
            <div key={entrega.id} className="border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <strong>Matrícula:</strong> {entrega.matricula || "N/A"}
                </div>
                <div>
                  <strong>Modelo:</strong> {entrega.modelo || "N/A"}
                </div>
                <div>
                  <strong>Asesor:</strong> {entrega.asesor || "N/A"}
                </div>
                <div>
                  <strong>OR:</strong> {entrega.or || "N/A"}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Incidencias:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {TIPOS_INCIDENCIA.map((tipo) => {
                    const isChecked = entrega.tipos_incidencia?.includes(tipo) || false
                    const isUpdating = updating === entrega.id

                    return (
                      <div key={tipo} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${entrega.id}-${tipo}`}
                          checked={isChecked}
                          disabled={isUpdating}
                          onCheckedChange={() => toggleIncidencia(entrega.id, tipo)}
                        />
                        <label
                          htmlFor={`${entrega.id}-${tipo}`}
                          className={`text-sm cursor-pointer ${isChecked ? "font-medium text-red-600" : ""}`}
                        >
                          {tipo}
                        </label>
                      </div>
                    )
                  })}
                </div>
                {updating === entrega.id && (
                  <div className="mt-2 flex items-center text-sm text-muted-foreground">
                    <BMWMSpinner size={12} className="mr-1" />
                    Actualizando...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {entregas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No se encontraron entregas</div>
        )}
      </CardContent>
    </Card>
  )
}
