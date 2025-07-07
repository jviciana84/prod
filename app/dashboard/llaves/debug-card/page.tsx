"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function DebugCardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const RELEVANT_INCIDENCE_TYPES = ["2ª llave", "CardKey", "Ficha técnica", "Permiso circulación"]

  const ejecutarDebug = async () => {
    setLoading(true)
    try {
      console.log("=== INICIANDO DEBUG DEL CARD ===")

      // 1. Verificar estructura de la tabla incidencias_historial
      console.log("1. Verificando estructura de incidencias_historial...")
      const { data: estructura, error: errorEstructura } = await supabase
        .from("incidencias_historial")
        .select("*")
        .limit(1)

      console.log("Estructura de la tabla:", estructura)

      // 2. Contar todos los registros
      console.log("2. Contando todos los registros...")
      const { count: totalRegistros, error: errorTotal } = await supabase
        .from("incidencias_historial")
        .select("*", { count: "exact", head: true })

      console.log("Total de registros en incidencias_historial:", totalRegistros)

      // 3. Verificar si existe la columna 'resuelta'
      console.log("3. Verificando columna 'resuelta'...")
      const { data: conResuelta, error: errorResuelta } = await supabase
        .from("incidencias_historial")
        .select("resuelta")
        .limit(1)

      const tieneColumnaResuelta = !errorResuelta
      console.log("¿Tiene columna 'resuelta'?", tieneColumnaResuelta)

      // 4. Obtener todos los registros relevantes
      console.log("4. Obteniendo registros relevantes...")
      const { data: todosRegistros, error: errorRegistros } = await supabase
        .from("incidencias_historial")
        .select("*")
        .in("tipo_incidencia", RELEVANT_INCIDENCE_TYPES)

      console.log("Registros relevantes encontrados:", todosRegistros?.length || 0)
      console.log("Datos completos:", todosRegistros)

      // 5. Filtrar por acción 'añadida'
      const registrosAnadidos = todosRegistros?.filter((r) => r.accion === "añadida") || []
      console.log("Registros con acción 'añadida':", registrosAnadidos.length)

      // 6. Si tiene columna resuelta, filtrar por resuelta = false
      let registrosActivos = registrosAnadidos
      if (tieneColumnaResuelta) {
        registrosActivos = registrosAnadidos.filter((r) => r.resuelta === false)
        console.log("Registros activos (resuelta = false):", registrosActivos.length)
      }

      // 7. Contar por tipo
      const conteosPorTipo = {
        "2ª llave": 0,
        CardKey: 0,
        "Ficha técnica": 0,
        "Permiso circulación": 0,
      }

      registrosActivos.forEach((registro) => {
        if (conteosPorTipo.hasOwnProperty(registro.tipo_incidencia)) {
          conteosPorTipo[registro.tipo_incidencia]++
        }
      })

      console.log("Conteos finales por tipo:", conteosPorTipo)

      // 8. Verificar entregas con incidencias para comparar
      console.log("8. Verificando entregas con incidencias...")
      const { data: entregas, error: errorEntregas } = await supabase
        .from("entregas")
        .select("id, matricula, tipos_incidencia, incidencia")
        .eq("incidencia", true)

      console.log("Entregas con incidencias:", entregas?.length || 0)

      const entregasConTiposRelevantes =
        entregas?.filter(
          (entrega) =>
            entrega.tipos_incidencia &&
            entrega.tipos_incidencia.some((tipo: string) => RELEVANT_INCIDENCE_TYPES.includes(tipo)),
        ) || []

      console.log("Entregas con tipos relevantes:", entregasConTiposRelevantes.length)

      setData({
        totalRegistros,
        tieneColumnaResuelta,
        todosRegistros: todosRegistros || [],
        registrosAnadidos,
        registrosActivos,
        conteosPorTipo,
        entregas: entregas || [],
        entregasConTiposRelevantes,
        estructura: estructura || [],
      })

      console.log("=== DEBUG COMPLETADO ===")
      toast.success("Debug completado - revisa la consola")
    } catch (error) {
      console.error("Error en debug:", error)
      toast.error("Error en debug")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ejecutarDebug()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin mr-2" />
          <span>Ejecutando debug...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug Card de Incidencias</h1>
          <p className="text-muted-foreground">Diagnóstico detallado del card de llaves</p>
        </div>
        <Button onClick={ejecutarDebug} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Ejecutar Debug
        </Button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalRegistros || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Columna 'resuelta'</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {data.tieneColumnaResuelta ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-700">Existe</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span className="text-red-700">No existe</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Registros Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.registrosActivos?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Entregas con Incidencias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.entregasConTiposRelevantes?.length || 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conteos por Tipo (Card)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(data.conteosPorTipo).map(([tipo, count]) => (
                    <div key={tipo} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>{tipo}</span>
                      <Badge variant={count > 0 ? "destructive" : "secondary"}>{count}</Badge>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between p-2 bg-primary/10 rounded font-bold">
                      <span>TOTAL</span>
                      <Badge variant="destructive">
                        {Object.values(data.conteosPorTipo).reduce((a: number, b: number) => a + b, 0)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Entregas con Incidencias Relevantes</CardTitle>
              </CardHeader>
              <CardContent>
                {data.entregasConTiposRelevantes.length === 0 ? (
                  <p className="text-muted-foreground">No hay entregas con incidencias relevantes</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.entregasConTiposRelevantes.map((entrega: any) => (
                      <div key={entrega.id} className="p-2 bg-muted rounded text-sm">
                        <div className="font-medium">{entrega.matricula}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {entrega.tipos_incidencia
                            ?.filter((tipo: string) => RELEVANT_INCIDENCE_TYPES.includes(tipo))
                            .map((tipo: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tipo}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registros Activos Detallados</CardTitle>
            </CardHeader>
            <CardContent>
              {data.registrosActivos.length === 0 ? (
                <p className="text-muted-foreground">No hay registros activos</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Resuelta</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.registrosActivos.map((registro: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{registro.matricula}</TableCell>
                        <TableCell>{registro.tipo_incidencia}</TableCell>
                        <TableCell>
                          <Badge variant={registro.accion === "añadida" ? "destructive" : "secondary"}>
                            {registro.accion}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={registro.resuelta ? "secondary" : "destructive"}>
                            {registro.resuelta ? "Sí" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(registro.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
