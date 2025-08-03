"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { procesarDatosMasivos, mapearDatosPorMatricula } from "@/server-actions/carga-masiva-actions"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import * as XLSX from 'xlsx'

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

  // Estados para mapeo por matrícula
  const [mapeoStatus, setMapeoStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [mapeoMensaje, setMapeoMensaje] = useState("")
  const [mapeoResultado, setMapeoResultado] = useState<{ actualizados: number; errores: number; noEncontrados: number; detalles: string[] }>({
    actualizados: 0,
    errores: 0,
    noEncontrados: 0,
    detalles: [],
  })
  const [columnaExcel, setColumnaExcel] = useState("")
  const [columnaDestino, setColumnaDestino] = useState("")
  const [tablaDestino, setTablaDestino] = useState<"nuevas_entradas" | "stock" | "ambas">("ambas")

  // Definición de tablas y sus columnas REALES
  const tablasDisponibles = [
    {
      id: "nuevas_entradas",
      nombre: "Nuevas Entradas",
      columnas: [
        { id: "license_plate", nombre: "Matrícula" },
        { id: "model", nombre: "Modelo" },
        { id: "vehicle_type", nombre: "Tipo de vehículo" },
        { id: "entry_date", nombre: "Fecha de entrada" },
        { id: "reception_date", nombre: "Fecha de recepción" },
        { id: "is_received", nombre: "Recibido" },
        { id: "status", nombre: "Estado" },
        { id: "expense_charge", nombre: "Cargo de gasto" },
        { id: "expense_type_id", nombre: "Tipo de gasto" },
        { id: "location_id", nombre: "Ubicación" },
        { id: "notes", nombre: "Notas" },
        { id: "purchase_price", nombre: "Precio de compra" },
        { id: "origin", nombre: "Origen" },
        { id: "origin_details", nombre: "Detalles del origen" },
        { id: "purchase_date_duc", nombre: "Fecha de compra DUC" },
        { id: "duc_id_anuncio", nombre: "ID Anuncio DUC" },
        { id: "duc_import_date", nombre: "Fecha importación DUC" },
        { id: "duc_last_seen", nombre: "Última vez visto DUC" },
      ],
    },
    {
      id: "stock",
      nombre: "Stock",
      columnas: [
        { id: "license_plate", nombre: "Matrícula" },
        { id: "model", nombre: "Modelo" },
        { id: "vehicle_type", nombre: "Tipo de vehículo" },
        { id: "reception_date", nombre: "Fecha de recepción" },
        { id: "mechanical_status", nombre: "Estado mecánico" },
        { id: "mechanical_status_date", nombre: "Fecha estado mecánico" },
        { id: "body_status", nombre: "Estado carrocería" },
        { id: "body_status_date", nombre: "Fecha estado carrocería" },
        { id: "work_center", nombre: "Centro de trabajo" },
        { id: "external_provider", nombre: "Proveedor externo" },
        { id: "or_value", nombre: "Valor OR" },
        { id: "expense_charge", nombre: "Cargo de gasto" },
        { id: "expense_type_id", nombre: "Tipo de gasto" },
        { id: "location_id", nombre: "Ubicación" },
        { id: "nuevas_entradas_id", nombre: "ID Nueva Entrada" },
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
  ]

  // Columnas disponibles para mapeo (solo las más importantes)
  const columnasMapeo = [
    { id: "model", nombre: "Modelo" },
    { id: "vehicle_type", nombre: "Tipo de vehículo" },
    { id: "expense_charge", nombre: "Cargo de gasto" },
    { id: "expense_type_id", nombre: "Tipo de gasto" },
    { id: "location_id", nombre: "Ubicación" },
    { id: "notes", nombre: "Notas" },
    { id: "purchase_price", nombre: "Precio de compra" },
    { id: "origin", nombre: "Origen" },
    { id: "mechanical_status", nombre: "Estado mecánico" },
    { id: "body_status", nombre: "Estado carrocería" },
    { id: "work_center", nombre: "Centro de trabajo" },
    { id: "external_provider", nombre: "Proveedor externo" },
  ]

  // Obtener columnas de la tabla seleccionada
  const columnasTablaSeleccionada = tablasDisponibles.find((t) => t.id === tipoTabla)?.columnas || []

  // Procesar archivo Excel o CSV
  const procesarArchivo = async (file: File) => {
    setStatus("parsing")
    try {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Procesar archivo Excel
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        // Convertir a formato de array de strings
        const datos = jsonData.map((row: any) => 
          row.map((cell: any) => cell?.toString() || '')
        )
        
        setParsedData(datos)
        setStatus("mapping")
      } else if (file.name.endsWith('.csv')) {
        // Procesar archivo CSV
        const text = await file.text()
        const lineas = text.trim().split(/\r?\n/)
        const datos = lineas.map((linea) => linea.split(","))
        setParsedData(datos)
        setStatus("mapping")
      } else {
        throw new Error("Formato de archivo no soportado")
      }
    } catch (error) {
      setStatus("error")
      setMensaje("Error al procesar el archivo. Asegúrate de que sea un archivo Excel (.xlsx, .xls) o CSV válido.")
    }
  }

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

  // Procesar mapeo por matrícula
  const procesarMapeoMatricula = async () => {
    setMapeoStatus("processing")
    try {
      if (!columnaExcel || !columnaDestino) {
        setMapeoStatus("error")
        setMapeoMensaje("Debes seleccionar tanto la columna del Excel como la columna de destino.")
        return
      }

      // Preparar datos para enviar al servidor
      const headers = parsedData[0]
      const rows = parsedData.slice(1)

      const result = await mapearDatosPorMatricula({
        columnaExcel,
        columnaDestino,
        tablaDestino,
        headers,
        rows,
      })

      setMapeoResultado(result)
      setMapeoStatus("success")
    } catch (error) {
      console.error("Error al procesar mapeo:", error)
      setMapeoStatus("error")
      setMapeoMensaje("Error al procesar el mapeo. Inténtalo de nuevo.")
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

  // Reiniciar el proceso de mapeo
  const reiniciarMapeo = () => {
    setRawData("")
    setParsedData([])
    setColumnaExcel("")
    setColumnaDestino("")
    setTablaDestino("ambas")
    setMapeoStatus("idle")
    setMapeoMensaje("")
    setMapeoResultado({ actualizados: 0, errores: 0, noEncontrados: 0, detalles: [] })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Importación de datos desde Excel</CardTitle>
        <CardDescription>Copia y pega datos directamente desde Excel para importarlos al sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="importar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="importar">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Importar Datos
            </TabsTrigger>
            <TabsTrigger value="mapear">
              <Upload className="mr-2 h-4 w-4" />
              Mapear por Matrícula
            </TabsTrigger>
          </TabsList>

          {/* Pestaña de Importar Datos */}
          <TabsContent value="importar">
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
                              <TableHead key={index}>{celda || `Columna ${index + 1}`}</TableHead>
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
                                <SelectItem key={index} value={header || `columna_${index}`}>
                                  {header || `Columna ${index + 1}`}
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
          </TabsContent>

          {/* Pestaña de Mapear por Matrícula */}
          <TabsContent value="mapear">
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">¿Cómo funciona el mapeo por matrícula?</h3>
                <p className="text-sm text-blue-800">
                  1. Sube un archivo Excel (.xlsx, .xls) o CSV con una columna de matrícula (reconoce: "Matrícula", "MATRICULA", "License Plate", "Placa", etc.)
                  <br />
                  2. Selecciona qué columna del Excel quieres usar y a qué campo de la base de datos quieres mapearla
                  <br />
                  3. El sistema buscará cada matrícula en las tablas seleccionadas y actualizará el campo correspondiente
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="archivo">Sube un archivo Excel o CSV</Label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        procesarArchivo(file)
                      }
                    }}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="datosMapeo">O copia y pega datos desde Excel</Label>
                  <Textarea
                    id="datosMapeo"
                    placeholder="Pega aquí los datos copiados desde Excel..."
                    className="min-h-[200px] font-mono"
                    value={rawData}
                    onChange={(e) => setRawData(e.target.value)}
                  />
                </div>

                <Button
                  onClick={procesarDatosPegados}
                  disabled={!rawData.trim() || mapeoStatus === "processing"}
                  className="w-full"
                >
                  {mapeoStatus === "processing" ? (
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

              {parsedData.length > 0 && (
                <div className="space-y-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {parsedData[0].map((celda, index) => (
                            <TableHead key={index}>{celda || `Columna ${index + 1}`}</TableHead>
                          ))}
                        </TableRow>
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
                    <h3 className="text-lg font-medium">Configuración del mapeo</h3>

                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Columna del Excel a usar</Label>
                          <Select value={columnaExcel} onValueChange={setColumnaExcel}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona columna del Excel" />
                            </SelectTrigger>
                            <SelectContent>
                              {parsedData[0]?.map((header, index) => (
                                <SelectItem key={index} value={header || `columna_${index}`}>
                                  {header || `Columna ${index + 1}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Campo de destino</Label>
                          <Select value={columnaDestino} onValueChange={setColumnaDestino}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona campo de destino" />
                            </SelectTrigger>
                            <SelectContent>
                              {columnasMapeo.map((columna) => (
                                <SelectItem key={columna.id} value={columna.id}>
                                  {columna.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Tabla de destino</Label>
                        <Select value={tablaDestino} onValueChange={(value: "nuevas_entradas" | "stock" | "ambas") => setTablaDestino(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tabla de destino" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nuevas_entradas">Nuevas Entradas</SelectItem>
                            <SelectItem value="stock">Stock</SelectItem>
                            <SelectItem value="ambas">Ambas tablas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={reiniciarMapeo}>
                        Cancelar
                      </Button>
                      <Button onClick={procesarMapeoMatricula} disabled={mapeoStatus === "processing" || !columnaExcel || !columnaDestino}>
                        {mapeoStatus === "processing" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          "Actualizar datos"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Resultados del mapeo */}
              {mapeoStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{mapeoMensaje}</AlertDescription>
                </Alert>
              )}

              {mapeoStatus === "success" && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Mapeo completado</AlertTitle>
                    <AlertDescription>
                      Se han procesado {mapeoResultado.actualizados + mapeoResultado.errores + mapeoResultado.noEncontrados} registros.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-green-600">{mapeoResultado.actualizados}</CardTitle>
                        <CardDescription>Registros actualizados</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-yellow-600">{mapeoResultado.noEncontrados}</CardTitle>
                        <CardDescription>No encontrados</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-red-600">{mapeoResultado.errores}</CardTitle>
                        <CardDescription>Errores</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>

                  {mapeoResultado.detalles.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Detalles del proceso</h3>
                      <div className="bg-muted p-4 rounded-md max-h-[200px] overflow-y-auto">
                        <ul className="list-disc pl-5 space-y-1">
                          {mapeoResultado.detalles.map((detalle, index) => (
                            <li key={index} className="text-sm">
                              {detalle}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <Button onClick={reiniciarMapeo} className="w-full">
                    Procesar más datos
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
