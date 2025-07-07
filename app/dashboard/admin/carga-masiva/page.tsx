"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, FileSpreadsheet } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { procesarDatosMasivos } from "@/server-actions/carga-masiva-actions"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

export default function CargaMasivaPage() {
  const supabase = createClientComponentClient()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        console.log("Verificando permisos de administrador...")
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error al verificar sesión:", error)
          setError("Error de autenticación")
          setIsAuthorized(false)
          setLoading(false)
          return
        }

        if (!data.session) {
          console.log("No hay sesión activa")
          setIsAuthorized(false)
          setLoading(false)
          return
        }

        console.log("Sesión activa encontrada, verificando roles...")
        const userId = data.session.user.id

        // Verificar roles del usuario usando RPC
        const { data: rolesData, error: rolesError } = await supabase.rpc("get_user_role_names", {
          user_id_param: userId,
        })

        if (rolesError) {
          console.error("Error al obtener roles:", rolesError)
          setError("Error al verificar permisos")
          setIsAuthorized(false)
          setLoading(false)
          return
        }

        console.log("Roles obtenidos:", rolesData)
        const roles = (rolesData || []).map((role: string) => role.toLowerCase())
        const isAdmin = roles.includes("admin") || roles.includes("administrador")

        console.log("¿Es administrador?", isAdmin)
        setIsAuthorized(isAdmin)
        setLoading(false)
      } catch (error: any) {
        console.error("Error general al verificar permisos:", error)
        setError("Error al verificar permisos")
        setIsAuthorized(false)
        setLoading(false)
      }
    }

    checkPermissions()
  }, [supabase])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center min-h-[200px]">
          <BMWMSpinner size="lg" />
          <span className="ml-2 text-lg">Verificando permisos...</span>
        </div>
      </div>
    )
  }

  if (error || isAuthorized === false) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso denegado</AlertTitle>
          <AlertDescription>
            {error ||
              "No tienes permisos para acceder a esta página. Solo los administradores pueden usar esta función."}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Carga Masiva de Datos</h1>
      <CargaMasivaForm />
    </div>
  )
}

function CargaMasivaForm() {
  const [rawData, setRawData] = useState("")
  const [parsedData, setParsedData] = useState<string[][]>([])
  const [tipoTabla, setTipoTabla] = useState("")
  const [columnas, setColumnas] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<"idle" | "parsing" | "mapping" | "processing" | "success" | "error">("idle")
  const [mensaje, setMensaje] = useState("")
  const [resultado, setResultado] = useState<{ insertados: number; errores: number; detalles: string[] }>({
    insertados: 0,
    errores: 0,
    detalles: [],
  })

  // Definición de tablas y sus columnas
  const tablasDisponibles = [
    {
      id: "nuevas_entradas",
      nombre: "Nuevas Entradas",
      columnas: [
        { id: "license_plate", nombre: "Matrícula" },
        { id: "model", nombre: "Modelo" },
        { id: "origin_location_id", nombre: "Ubicación de origen" },
        { id: "expense_type_id", nombre: "Tipo de gasto" },
        { id: "purchase_date", nombre: "Fecha de compra" },
        { id: "notes", nombre: "Notas" },
      ],
    },
    {
      id: "fotos",
      nombre: "Vehículos para fotografiar",
      columnas: [
        { id: "license_plate", nombre: "Matrícula" },
        { id: "model", nombre: "Modelo" },
        { id: "disponible", nombre: "Disponible" },
        { id: "estado_pintura", nombre: "Estado pintura" },
      ],
    },
    {
      id: "stock",
      nombre: "Stock",
      columnas: [
        { id: "license_plate", nombre: "Matrícula" },
        { id: "model", nombre: "Modelo" },
      ],
    },
  ]

  // Obtener columnas de la tabla seleccionada
  const columnasTablaSeleccionada = tablasDisponibles.find((t) => t.id === tipoTabla)?.columnas || []

  // Procesar datos pegados de Excel
  const procesarDatosPegados = () => {
    setStatus("parsing")
    try {
      // Dividir por líneas y luego por tabulaciones
      const lineas = rawData.trim().split(/\r?\n/)
      const datos = lineas.map((linea) => linea.split("\t"))
      setParsedData(datos)
      setStatus("mapping")
    } catch (error) {
      setStatus("error")
      setMensaje("Error al procesar los datos. Asegúrate de copiar directamente desde Excel.")
    }
  }

  // Manejar cambio en el mapeo de columnas
  const handleMapeoColumna = (columnaDB: string, columnaExcel: string) => {
    setColumnas((prev) => ({
      ...prev,
      [columnaDB]: columnaExcel,
    }))
  }

  // Procesar y guardar datos
  const procesarYGuardar = async () => {
    setStatus("processing")
    try {
      // Verificar que todas las columnas necesarias estén mapeadas
      const columnasFaltantes = columnasTablaSeleccionada.filter((col) => col.id !== "notes" && !columnas[col.id])

      if (columnasFaltantes.length > 0) {
        setStatus("error")
        setMensaje(`Faltan mapear columnas obligatorias: ${columnasFaltantes.map((c) => c.nombre).join(", ")}`)
        return
      }

      // Preparar datos para enviar al servidor
      const headers = parsedData[0]
      const rows = parsedData.slice(1)

      const result = await procesarDatosMasivos({
        tipoTabla,
        mapeoColumnas: columnas,
        headers,
        rows,
      })

      setResultado(result)
      setStatus("success")
    } catch (error) {
      console.error("Error al procesar datos:", error)
      setStatus("error")
      setMensaje("Error al procesar los datos. Inténtalo de nuevo.")
    }
  }

  // Reiniciar el proceso
  const reiniciar = () => {
    setRawData("")
    setParsedData([])
    setTipoTabla("")
    setColumnas({})
    setStatus("idle")
    setMensaje("")
    setResultado({ insertados: 0, errores: 0, detalles: [] })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Importación de datos desde Excel</CardTitle>
        <CardDescription>Copia y pega datos directamente desde Excel para importarlos al sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="paso1" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="paso1" disabled={status !== "idle" && status !== "parsing"}>
              1. Seleccionar tipo
            </TabsTrigger>
            <TabsTrigger value="paso2" disabled={status !== "mapping" && status !== "processing"}>
              2. Mapear columnas
            </TabsTrigger>
            <TabsTrigger value="paso3" disabled={status !== "success" && status !== "error"}>
              3. Resultados
            </TabsTrigger>
          </TabsList>

          {/* Paso 1: Seleccionar tipo y pegar datos */}
          <TabsContent value="paso1">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="tipoTabla">Selecciona el tipo de datos a importar</Label>
                <Select value={tipoTabla} onValueChange={setTipoTabla}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de datos" />
                  </SelectTrigger>
                  <SelectContent>
                    {tablasDisponibles.map((tabla) => (
                      <SelectItem key={tabla.id} value={tabla.id}>
                        {tabla.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {tipoTabla && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="datos">Copia y pega datos desde Excel</Label>
                    <Textarea
                      id="datos"
                      placeholder="Pega aquí los datos copiados desde Excel..."
                      className="min-h-[200px] font-mono"
                      value={rawData}
                      onChange={(e) => setRawData(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={procesarDatosPegados}
                    disabled={!rawData.trim() || status === "parsing"}
                    className="w-full"
                  >
                    {status === "parsing" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Procesar datos
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Paso 2: Mapear columnas */}
          <TabsContent value="paso2">
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {parsedData.length > 0 && (
                      <TableRow>
                        {parsedData[0].map((celda, index) => (
                          <TableHead key={index}>{celda}</TableHead>
                        ))}
                      </TableRow>
                    )}
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(1, 6).map((fila, indexFila) => (
                      <TableRow key={indexFila}>
                        {fila.map((celda, indexCelda) => (
                          <TableCell key={indexCelda}>{celda}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedData.length > 6 && (
                  <p className="text-sm text-muted-foreground mt-2">Mostrando 5 de {parsedData.length - 1} filas...</p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Mapeo de columnas</h3>
                <p className="text-sm text-muted-foreground">
                  Indica qué columna de Excel corresponde a cada campo en la base de datos
                </p>

                <div className="grid gap-4">
                  {columnasTablaSeleccionada.map((columna) => (
                    <div key={columna.id} className="grid grid-cols-2 gap-4 items-center">
                      <div>
                        <Label>{columna.nombre}</Label>
                        <p className="text-xs text-muted-foreground">
                          {columna.id === "notes" ? "(Opcional)" : "(Obligatorio)"}
                        </p>
                      </div>
                      <Select
                        value={columnas[columna.id] || ""}
                        onValueChange={(value) => handleMapeoColumna(columna.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona columna de Excel" />
                        </SelectTrigger>
                        <SelectContent>
                          {parsedData[0]?.map((header, index) => (
                            <SelectItem key={index} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={reiniciar}>
                    Cancelar
                  </Button>
                  <Button onClick={procesarYGuardar} disabled={status === "processing"}>
                    {status === "processing" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Importar datos"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Paso 3: Resultados */}
          <TabsContent value="paso3">
            <div className="space-y-6">
              {status === "error" ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{mensaje}</AlertDescription>
                </Alert>
              ) : status === "success" ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Importación completada</AlertTitle>
                    <AlertDescription>
                      Se han procesado {resultado.insertados + resultado.errores} registros.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-green-600">{resultado.insertados}</CardTitle>
                        <CardDescription>Registros insertados correctamente</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-red-600">{resultado.errores}</CardTitle>
                        <CardDescription>Registros con errores</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>

                  {resultado.errores > 0 && resultado.detalles.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Detalles de errores</h3>
                      <div className="bg-muted p-4 rounded-md max-h-[200px] overflow-y-auto">
                        <ul className="list-disc pl-5 space-y-1">
                          {resultado.detalles.map((detalle, index) => (
                            <li key={index} className="text-sm">
                              {detalle}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              <Button onClick={reiniciar} className="w-full">
                Importar más datos
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
