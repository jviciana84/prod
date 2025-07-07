"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Database, AlertTriangle, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface DiagnosticData {
  tablaExiste: boolean
  totalRegistros: number
  tiposIncidencia: string[]
  registrosPorTipo: { [key: string]: number }
  ultimosRegistros: any[]
  entregasConIncidencias: any[]
  error?: string
}

export default function DiagnosticoIncidenciasPage() {
  const [diagnostico, setDiagnostico] = useState<DiagnosticData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const ejecutarDiagnostico = async () => {
    setLoading(true)
    try {
      const resultado: DiagnosticData = {
        tablaExiste: false,
        totalRegistros: 0,
        tiposIncidencia: [],
        registrosPorTipo: {},
        ultimosRegistros: [],
        entregasConIncidencias: [],
      }

      // 1. Verificar si existe la tabla incidencias_historial
      console.log("1. Verificando tabla incidencias_historial...")
      try {
        const { data: historialData, error: historialError } = await supabase
          .from("incidencias_historial")
          .select("*")
          .limit(1)

        if (!historialError) {
          resultado.tablaExiste = true
          console.log("✅ Tabla incidencias_historial existe")
        }
      } catch (err) {
        console.log("❌ Tabla incidencias_historial no existe o no es accesible")
      }

      // 2. Si la tabla existe, obtener estadísticas
      if (resultado.tablaExiste) {
        console.log("2. Obteniendo estadísticas de incidencias_historial...")

        // Total de registros
        const { count, error: countError } = await supabase
          .from("incidencias_historial")
          .select("*", { count: "exact", head: true })

        if (!countError && count !== null) {
          resultado.totalRegistros = count
          console.log(`📊 Total registros: ${count}`)
        }

        // Tipos de incidencia únicos
        const { data: tiposData, error: tiposError } = await supabase
          .from("incidencias_historial")
          .select("tipo_incidencia")

        if (!tiposError && tiposData) {
          const tipos = [...new Set(tiposData.map((item) => item.tipo_incidencia))]
          resultado.tiposIncidencia = tipos
          console.log("📋 Tipos de incidencia encontrados:", tipos)

          // Contar por tipo
          tipos.forEach((tipo) => {
            const count = tiposData.filter((item) => item.tipo_incidencia === tipo).length
            resultado.registrosPorTipo[tipo] = count
          })
        }

        // Últimos 10 registros
        const { data: ultimosData, error: ultimosError } = await supabase
          .from("incidencias_historial")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10)

        if (!ultimosError && ultimosData) {
          resultado.ultimosRegistros = ultimosData
          console.log("📝 Últimos registros obtenidos:", ultimosData.length)
        }
      }

      // 3. Verificar entregas con incidencias directamente
      console.log("3. Verificando entregas con tipos_incidencia...")
      const { data: entregasData, error: entregasError } = await supabase
        .from("entregas")
        .select("id, matricula, tipos_incidencia, incidencia")
        .not("tipos_incidencia", "is", null)

      if (!entregasError && entregasData) {
        const entregasConIncidenciasReales = entregasData.filter(
          (entrega) => entrega.tipos_incidencia && entrega.tipos_incidencia.length > 0,
        )
        resultado.entregasConIncidencias = entregasConIncidenciasReales
        console.log("🚗 Entregas con incidencias:", entregasConIncidenciasReales.length)
      }

      setDiagnostico(resultado)
      toast.success("Diagnóstico completado")
    } catch (error) {
      console.error("Error en diagnóstico:", error)
      setDiagnostico({
        tablaExiste: false,
        totalRegistros: 0,
        tiposIncidencia: [],
        registrosPorTipo: {},
        ultimosRegistros: [],
        entregasConIncidencias: [],
        error: error instanceof Error ? error.message : "Error desconocido",
      })
      toast.error("Error al ejecutar diagnóstico")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ejecutarDiagnostico()
  }, [])

  const crearTablaIncidenciasHistorial = async () => {
    try {
      const { error } = await supabase.rpc("create_incidencias_historial_table")

      if (error) {
        console.error("Error al crear tabla:", error)
        toast.error("Error al crear la tabla: " + error.message)
      } else {
        toast.success("Tabla creada exitosamente")
        ejecutarDiagnostico()
      }
    } catch (err) {
      console.error("Error:", err)
      toast.error("Error al crear la tabla")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin mr-2" />
          <span>Ejecutando diagnóstico...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Diagnóstico de Incidencias</h1>
          <p className="text-muted-foreground">Verificación del sistema de incidencias de llaves y documentos</p>
        </div>
        <Button onClick={ejecutarDiagnostico} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {diagnostico?.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Error en Diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{diagnostico.error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estado de la Tabla</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {diagnostico?.tablaExiste ? (
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
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diagnostico?.totalRegistros || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Incidencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diagnostico?.tiposIncidencia.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Entregas con Incidencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diagnostico?.entregasConIncidencias.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {!diagnostico?.tablaExiste && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Tabla no encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-4">
              La tabla 'incidencias_historial' no existe. Esto es necesario para el seguimiento de incidencias.
            </p>
            <Button onClick={crearTablaIncidenciasHistorial} variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Crear Tabla
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="tipos" className="w-full">
        <TabsList>
          <TabsTrigger value="tipos">Tipos de Incidencia</TabsTrigger>
          <TabsTrigger value="registros">Últimos Registros</TabsTrigger>
          <TabsTrigger value="entregas">Entregas con Incidencias</TabsTrigger>
        </TabsList>

        <TabsContent value="tipos">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Incidencia Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              {diagnostico?.tiposIncidencia.length === 0 ? (
                <p className="text-muted-foreground">No se encontraron tipos de incidencia</p>
              ) : (
                <div className="space-y-2">
                  {diagnostico?.tiposIncidencia.map((tipo) => (
                    <div key={tipo} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>{tipo}</span>
                      <Badge variant="secondary">{diagnostico.registrosPorTipo[tipo]} registros</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registros">
          <Card>
            <CardHeader>
              <CardTitle>Últimos Registros</CardTitle>
            </CardHeader>
            <CardContent>
              {diagnostico?.ultimosRegistros.length === 0 ? (
                <p className="text-muted-foreground">No se encontraron registros</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diagnostico?.ultimosRegistros.map((registro, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(registro.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{registro.matricula}</TableCell>
                        <TableCell>{registro.tipo_incidencia}</TableCell>
                        <TableCell>
                          <Badge variant={registro.accion === "añadida" ? "destructive" : "secondary"}>
                            {registro.accion}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregas">
          <Card>
            <CardHeader>
              <CardTitle>Entregas con Incidencias Activas</CardTitle>
            </CardHeader>
            <CardContent>
              {diagnostico?.entregasConIncidencias.length === 0 ? (
                <p className="text-muted-foreground">No se encontraron entregas con incidencias</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Tipos de Incidencia</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diagnostico?.entregasConIncidencias.map((entrega) => (
                      <TableRow key={entrega.id}>
                        <TableCell>{entrega.matricula}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {entrega.tipos_incidencia?.map((tipo: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tipo}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={entrega.incidencia ? "destructive" : "secondary"}>
                            {entrega.incidencia ? "Con incidencia" : "Sin incidencia"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
