"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Calendar, User, Truck, Edit, Save, X, CheckCircle, AlertTriangle } from "lucide-react"

interface RecogidaConSeguimiento {
  id: string
  matricula: string
  fecha_solicitud: string
  nombre_cliente: string
  usuario_solicitante: string
  seguimiento: string | null
  estado: string
  isEditing?: boolean
  tempSeguimiento?: string
}

export function SeguimientoUpdater() {
  const [recogidas, setRecogidas] = useState<RecogidaConSeguimiento[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const loadRecogidas = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("recogidas_historial")
        .select(`
          id,
          matricula,
          fecha_solicitud,
          nombre_cliente,
          usuario_solicitante,
          seguimiento,
          estado
        `)
        .order("fecha_solicitud", { ascending: false })

      if (error) {
        console.error("Error cargando recogidas:", error)
        toast({
          title: "❌ Error",
          description: "No se pudieron cargar las recogidas",
          variant: "destructive",
        })
        return
      }

      setRecogidas(data || [])
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "❌ Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecogidas()
  }, [])

  const startEditing = (id: string) => {
    setRecogidas(prev => prev.map(recogida => 
      recogida.id === id 
        ? { ...recogida, isEditing: true, tempSeguimiento: recogida.seguimiento || "" }
        : recogida
    ))
  }

  const cancelEditing = (id: string) => {
    setRecogidas(prev => prev.map(recogida => 
      recogida.id === id 
        ? { ...recogida, isEditing: false, tempSeguimiento: undefined }
        : recogida
    ))
  }

  const updateTempSeguimiento = (id: string, value: string) => {
    setRecogidas(prev => prev.map(recogida => 
      recogida.id === id 
        ? { ...recogida, tempSeguimiento: value }
        : recogida
    ))
  }

  const saveSeguimiento = async (id: string) => {
    const recogida = recogidas.find(r => r.id === id)
    if (!recogida || !recogida.tempSeguimiento) {
      toast({
        title: "❌ Error",
        description: "El número de seguimiento no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    setSaving(id)
    try {
      const { error } = await supabase
        .from("recogidas_historial")
        .update({ 
          seguimiento: recogida.tempSeguimiento.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", id)

      if (error) {
        console.error("Error guardando seguimiento:", error)
        toast({
          title: "❌ Error",
          description: "No se pudo guardar el seguimiento",
          variant: "destructive",
        })
        return
      }

      // Actualizar estado local
      setRecogidas(prev => prev.map(r => 
        r.id === id 
          ? { 
              ...r, 
              seguimiento: recogida.tempSeguimiento.trim(),
              isEditing: false,
              tempSeguimiento: undefined
            }
          : r
      ))

      toast({
        title: "✅ Guardado",
        description: "Número de seguimiento actualizado correctamente",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "❌ Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setSaving(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "solicitada":
        return "bg-blue-100 text-blue-800"
      case "en_transito":
        return "bg-yellow-100 text-yellow-800"
      case "entregada":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const recogidasSinSeguimiento = recogidas.filter(r => !r.seguimiento || r.seguimiento.trim() === "")
  const recogidasConSeguimiento = recogidas.filter(r => r.seguimiento && r.seguimiento.trim() !== "")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Actualizar Números de Seguimiento
          </CardTitle>
          <CardDescription>
            Actualiza los números de seguimiento que recibas de la agencia de transporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4">
              <Badge variant="outline">
                Total: {recogidas.length}
              </Badge>
              <Badge variant="destructive">
                Sin seguimiento: {recogidasSinSeguimiento.length}
              </Badge>
              <Badge variant="default">
                Con seguimiento: {recogidasConSeguimiento.length}
              </Badge>
            </div>
            <Button onClick={loadRecogidas} disabled={loading} variant="outline">
              {loading ? "Cargando..." : "Actualizar"}
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Instrucciones:</strong> Cuando recibas el número de seguimiento de la agencia de transporte, 
              haz clic en el botón de editar y añade el número. Este número se mostrará en la tabla de historial.
            </AlertDescription>
          </Alert>

          {/* Tabla de recogidas sin seguimiento */}
          {recogidasSinSeguimiento.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-red-600">
                Recogidas Pendientes de Seguimiento ({recogidasSinSeguimiento.length})
              </h3>
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Seguimiento</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recogidasSinSeguimiento.map((recogida) => (
                      <TableRow key={recogida.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{formatDate(recogida.fecha_solicitud)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{recogida.matricula}</TableCell>
                        <TableCell>{recogida.nombre_cliente || "No especificado"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{recogida.usuario_solicitante}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getEstadoColor(recogida.estado)}`}>
                            {recogida.estado.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {recogida.isEditing ? (
                            <Input
                              value={recogida.tempSeguimiento || ""}
                              onChange={(e) => updateTempSeguimiento(recogida.id, e.target.value)}
                              placeholder="Número de seguimiento"
                              className="w-32"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">Pendiente</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {recogida.isEditing ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => saveSeguimiento(recogida.id)}
                                disabled={saving === recogida.id}
                              >
                                {saving === recogida.id ? (
                                  <CheckCircle className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Save className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelEditing(recogida.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(recogida.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Tabla de recogidas con seguimiento */}
          {recogidasConSeguimiento.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-green-600">
                Recogidas con Seguimiento ({recogidasConSeguimiento.length})
              </h3>
              <div className="rounded-lg border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Seguimiento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recogidasConSeguimiento.map((recogida) => (
                      <TableRow key={recogida.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{formatDate(recogida.fecha_solicitud)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{recogida.matricula}</TableCell>
                        <TableCell>{recogida.nombre_cliente || "No especificado"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{recogida.usuario_solicitante}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getEstadoColor(recogida.estado)}`}>
                            {recogida.estado.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {recogida.seguimiento}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {recogidas.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No hay recogidas para mostrar
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 