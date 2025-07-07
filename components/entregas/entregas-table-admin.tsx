"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getAdminUser, resolveUserName } from "@/utils/fix-auth"

// Crear cliente Supabase simple
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Crear cliente sin autenticación
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

type TipoIncidencia =
  | "PINTURA"
  | "MECANICA"
  | "LIMPIEZA"
  | "2ª LLAVE"
  | "DOCUMENTACION"
  | "ACCESORIOS"
  | "DAÑOS"
  | "REVISIÓN"
  | "GARANTÍA"
  | "FINANCIACIÓN"
  | "SEGURO"
  | "OTROS"

type Entrega = {
  id: string
  fecha_venta: string | null
  fecha_entrega: string | null
  matricula: string
  modelo: string
  asesor: string
  or: string
  incidencia: boolean
  tipos_incidencia: TipoIncidencia[]
  observaciones: string
}

const TIPOS_INCIDENCIA: TipoIncidencia[] = [
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

interface EntregasTableAdminProps {
  onRefreshRequest?: () => void
}

export function EntregasTableAdmin({ onRefreshRequest }: EntregasTableAdminProps) {
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Usuario admin simulado
  const adminUser = getAdminUser()

  // Función para limpiar cookies y recargar
  const handleClearCookies = () => {
            // clearAllSupabaseCookies()
    toast.success("Cookies limpiadas. Recargando página...")
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  // Cargar entregas
  const loadEntregas = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("entregas").select("*").order("fecha_venta", { ascending: false })

      if (error) {
        console.error("Error al cargar entregas:", error)
        toast.error("Error al cargar los datos: " + error.message)
        return
      }

      if (data && data.length > 0) {
        const formattedData: Entrega[] = data.map((item) => ({
          id: item.id,
          fecha_venta: item.fecha_venta,
          fecha_entrega: item.fecha_entrega,
          matricula: item.matricula || "",
          modelo: item.modelo || "",
          asesor: resolveUserName(item.asesor || ""), // Resolver alias
          or: item.or || "",
          incidencia: item.incidencia || false,
          tipos_incidencia: item.tipos_incidencia || [],
          observaciones: item.observaciones || "",
        }))

        setEntregas(formattedData)
        toast.success(`${formattedData.length} entregas cargadas`)
      }
    } catch (err) {
      console.error("Error en la consulta:", err)
      toast.error("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  // Toggle incidencia (versión admin - sin verificación de permisos)
  const toggleTipoIncidencia = async (entregaId: string, tipo: TipoIncidencia) => {
    try {
      const entregaToUpdate = entregas.find((entrega) => entrega.id === entregaId)
      if (!entregaToUpdate) {
        toast.error(`No se pudo encontrar la entrega con ID ${entregaId}`)
        return
      }

      const isTipoPresente = entregaToUpdate.tipos_incidencia?.includes(tipo)
      let nuevosTiposIncidencia: TipoIncidencia[] = []

      if (isTipoPresente && entregaToUpdate.tipos_incidencia) {
        nuevosTiposIncidencia = entregaToUpdate.tipos_incidencia.filter((t) => t !== tipo)
      } else {
        nuevosTiposIncidencia = [...(entregaToUpdate.tipos_incidencia || []), tipo]
      }

      console.log("Estado actual:", isTipoPresente ? "Presente" : "No presente")
      console.log("Nuevos tipos de incidencia:", nuevosTiposIncidencia)

      const updateObject = {
        tipos_incidencia: nuevosTiposIncidencia,
        incidencia: nuevosTiposIncidencia.length > 0,
      }

      // Actualizar estado local primero
      setEntregas((prevEntregas) =>
        prevEntregas.map((entrega) => (entrega.id === entregaId ? { ...entrega, ...updateObject } : entrega)),
      )

      // Actualizar en Supabase
      const { data, error } = await supabase.from("entregas").update(updateObject).eq("id", entregaId).select("*")

      if (error) {
        console.error("Error al actualizar la entrega en Supabase:", error)
        toast.error("Error al actualizar la entrega: " + error.message)
        // Revertir cambio local
        await loadEntregas()
        return
      }

      // Registrar en historial (como admin)
      const accion = isTipoPresente ? "eliminada" : "añadida"
      const comentario = isTipoPresente ? `Incidencia ${tipo} eliminada` : `Nueva incidencia ${tipo} detectada`

      const { error: historialError } = await supabase.from("incidencias_historial").insert({
        entrega_id: entregaId,
        tipo_incidencia: tipo,
        accion,
        usuario_id: adminUser.id,
        usuario_nombre: adminUser.email,
        fecha: new Date().toISOString(),
        comentario,
      })

      if (historialError) {
        console.error("Error al registrar historial:", historialError)
        toast.warning("La incidencia se actualizó pero no se pudo registrar en el historial")
      }

      toast.success(`${isTipoPresente ? "Eliminada" : "Añadida"} incidencia "${tipo}" para la entrega ${entregaId}`, {
        duration: 4000,
      })
    } catch (err) {
      console.error("Error inesperado al actualizar la entrega:", err)
      toast.error("Error inesperado al actualizar la entrega")
      await loadEntregas()
    }
  }

  // Refrescar datos
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadEntregas()
    setRefreshing(false)
    onRefreshRequest?.()
  }

  useEffect(() => {
    loadEntregas()
  }, [])

  // Filtrar entregas por búsqueda
  const filteredEntregas = entregas.filter((entrega) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      entrega.matricula.toLowerCase().includes(searchLower) ||
      entrega.modelo.toLowerCase().includes(searchLower) ||
      entrega.asesor.toLowerCase().includes(searchLower) ||
      entrega.or.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Cargando entregas...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Gestión de Entregas (Admin)</CardTitle>
        <CardDescription>
          Seguimiento y control de entregas de vehículos
          <span className="ml-2 text-sm">• Usuario: {adminUser.email} (Admin)</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Controles superiores */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por matrícula, modelo, asesor o OR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button onClick={handleClearCookies} variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Cookies
            </Button>
          </div>
        </div>

        {/* Tabla de entregas */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Matrícula</th>
                <th className="text-left p-2">Modelo</th>
                <th className="text-left p-2">Asesor</th>
                <th className="text-left p-2">OR</th>
                <th className="text-left p-2">Incidencias</th>
                <th className="text-left p-2">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntregas.map((entrega) => (
                <tr key={entrega.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-2 font-medium">{entrega.matricula}</td>
                  <td className="p-2">{entrega.modelo}</td>
                  <td className="p-2">{entrega.asesor}</td>
                  <td className="p-2">{entrega.or}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {TIPOS_INCIDENCIA.map((tipo) => {
                        const isSelected = entrega.tipos_incidencia?.includes(tipo)
                        return (
                          <Badge
                            key={tipo}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer text-xs ${
                              isSelected
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                            onClick={() => toggleTipoIncidencia(entrega.id, tipo)}
                          >
                            {tipo}
                          </Badge>
                        )
                      })}
                    </div>
                  </td>
                  <td className="p-2 text-sm text-gray-600 dark:text-gray-400">{entrega.observaciones || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEntregas.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron entregas</p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          Mostrando {filteredEntregas.length} de {entregas.length} entregas
        </div>
      </CardContent>
    </Card>
  )
}
