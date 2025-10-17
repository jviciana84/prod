"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plus, RefreshCw, FileDown, AlertCircle } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { RegistrarIncidencia } from "./registrar-incidencia"
import { PermissionGate } from "@/components/auth/permission-gate"

interface IncidenciaHistorial {
  id: string
  entrega_id: string
  tipo_incidencia: string
  accion: string
  usuario_id: string
  usuario_nombre: string
  fecha: string
  comentario: string
}

interface IncidenciaHistorialComponentProps {
  entregaId: string
}

export function IncidenciaHistorialComponent({ entregaId }: IncidenciaHistorialComponentProps) {
  const [historial, setHistorial] = useState<IncidenciaHistorial[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showRegistrarForm, setShowRegistrarForm] = useState(false)
  const [activeTab, setActiveTab] = useState("historial")

  const supabase = createClientComponentClient()

  // Cargar historial al montar el componente
  useEffect(() => {
    loadHistorial()
  }, [entregaId])

  const loadHistorial = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("incidencias_historial")
        .select("*")
        .eq("entrega_id", entregaId)
        .order("fecha", { ascending: false })

      if (error) {
        console.error("Error al cargar historial:", error)
        toast.error("Error al cargar el historial de incidencias")
        return
      }

      setHistorial(data || [])
    } catch (error) {
      console.error("Error al cargar historial:", error)
      toast.error("Error al cargar el historial de incidencias")
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadHistorial()
    setRefreshing(false)
  }

  const handleRegistrarSuccess = () => {
    setShowRegistrarForm(false)
    loadHistorial()
    toast.success("Incidencia registrada correctamente")
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es })
    } catch (e) {
      return dateString
    }
  }

  const exportToCSV = () => {
    if (historial.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }

    // Crear contenido CSV
    const headers = ["Fecha", "Tipo", "Acción", "Usuario", "Comentario"]
    const rows = historial.map((item) => [
      formatDate(item.fecha),
      item.tipo_incidencia,
      item.accion,
      item.usuario_nombre,
      item.comentario,
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `historial_incidencias_${entregaId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Historial de Incidencias</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} title="Actualizar">
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={exportToCSV}
              disabled={historial.length === 0}
              title="Exportar a CSV"
            >
              <FileDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="historial" className="flex-1">
              Historial
            </TabsTrigger>
            <TabsTrigger value="registrar" className="flex-1">
              Registrar
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="historial" className="m-0">
          <CardContent className="pt-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Cargando historial...</span>
              </div>
            ) : historial.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-2" />
                <p>No hay registros de incidencias</p>
                <PermissionGate allowedRoles={["admin", "supervisor"]}>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("registrar")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar incidencia
                  </Button>
                </PermissionGate>
              </div>
            ) : (
              <div className="space-y-4">
                {historial.map((item) => (
                  <div key={item.id} className="border-b pb-3 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium">{item.tipo_incidencia}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(item.fecha)}</div>
                    </div>
                    <div className="text-sm mb-1">{item.comentario}</div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        {item.accion === "añadida" ? "Registrada" : "Resuelta"} por {item.usuario_nombre}
                      </div>
                      <div
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          item.accion === "añadida"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                            : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        }`}
                      >
                        {item.accion}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </TabsContent>

        <TabsContent value="registrar" className="m-0">
          <CardContent className="pt-4">
            <RegistrarIncidencia
              entregaId={entregaId}
              onSuccess={handleRegistrarSuccess}
              onCancel={() => setActiveTab("historial")}
            />
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
