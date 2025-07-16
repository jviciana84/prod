"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Settings, 
  Database, 
  Plus, 
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2
} from "lucide-react"

interface MapeoColumnasProps {
  excelColumns: string[]
  nuevasEntradasColumns: any[]
  stockColumns: any[]
  mappings: {[key: string]: string}
  setMappings: (mappings: {[key: string]: string}) => void
  newColumnMappings: {[key: string]: {
    table: string
    columnName: string
    dataType: string
    isRequired: boolean
    defaultValue: string
  }}
  setNewColumnMappings: (mappings: {[key: string]: {
    table: string
    columnName: string
    dataType: string
    isRequired: boolean
    defaultValue: string
  }}) => void
  onCreateColumns: () => void
  isProcessing: boolean
}

export default function MapeoColumnas({ 
  excelColumns, 
  nuevasEntradasColumns, 
  stockColumns, 
  mappings, 
  setMappings, 
  newColumnMappings,
  setNewColumnMappings,
  onCreateColumns,
  isProcessing 
}: MapeoColumnasProps) {
  const [selectedTable, setSelectedTable] = useState<string>("nuevas_entradas")
  
  const { toast } = useToast()

  // Obtener nombres de columnas existentes
  const existingNuevasEntradasColumns = nuevasEntradasColumns.map(col => col.column_name)
  const existingStockColumns = stockColumns.map(col => col.column_name)

  // Manejar mapeo a columna existente
  const handleExistingMapping = (excelColumn: string, existingColumn: string) => {
    if (existingColumn === "none") {
      const newMappings = { ...mappings }
      delete newMappings[excelColumn]
      setMappings(newMappings)
    } else {
      setMappings({
        ...mappings,
        [excelColumn]: existingColumn
      })
    }
  }

  // Manejar mapeo a nueva columna
  const handleNewColumnMapping = (excelColumn: string, table: string, columnName: string) => {
    if (!columnName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la columna no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    // Validar que el nombre de columna no exista ya
    const existingColumns = table === "nuevas_entradas" ? existingNuevasEntradasColumns : existingStockColumns
    if (existingColumns.includes(columnName)) {
      toast({
        title: "Error",
        description: `La columna "${columnName}" ya existe en la tabla ${table}`,
        variant: "destructive",
      })
      return
    }

    setNewColumnMappings({
      ...newColumnMappings,
      [excelColumn]: {
        table,
        columnName: columnName.trim(),
        dataType: "text",
        isRequired: false,
        defaultValue: ""
      }
    })

    // Actualizar mappings principales
    setMappings({
      ...mappings,
      [excelColumn]: `new:${table}:${columnName.trim()}`
    })
  }

  // Eliminar mapeo de nueva columna
  const handleRemoveNewColumnMapping = (excelColumn: string) => {
    const newMappings = { ...mappings }
    delete newMappings[excelColumn]
    setMappings(newMappings)

    const newNewColumnMappings = { ...newColumnMappings }
    delete newNewColumnMappings[excelColumn]
    setNewColumnMappings(newNewColumnMappings)
  }

  // Obtener información del mapeo
  const getMappingInfo = (excelColumn: string) => {
    const mapping = mappings[excelColumn]
    if (!mapping) return null

    if (mapping.startsWith("new:")) {
      const [, table, columnName] = mapping.split(":")
      return { type: "new", table, columnName }
    } else {
      return { type: "existing", column: mapping }
    }
  }

  // Contar mapeos por tipo
  const existingMappingsCount = Object.values(mappings).filter(m => !m.startsWith("new:")).length
  const newMappingsCount = Object.values(mappings).filter(m => m.startsWith("new:")).length

  return (
    <div className="space-y-6">
      {/* Resumen de mapeos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Resumen de Mapeos
          </CardTitle>
          <CardDescription>
            Configura cómo se mapearán las columnas del Excel con las tablas de la base de datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{excelColumns.length}</p>
              <p className="text-sm text-muted-foreground">Columnas del Excel</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{existingMappingsCount}</p>
              <p className="text-sm text-muted-foreground">Mapeos a columnas existentes</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{newMappingsCount}</p>
              <p className="text-sm text-muted-foreground">Nuevas columnas a crear</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de mapeos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" />
            Configurar Mapeos
          </CardTitle>
          <CardDescription>
            Para cada columna del Excel, selecciona si mapear a una columna existente o crear una nueva
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {excelColumns.map((excelColumn) => {
            const mappingInfo = getMappingInfo(excelColumn)
            
            return (
              <div key={excelColumn} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-medium">
                      {excelColumn}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {mappingInfo && (
                    <div className="flex items-center gap-2">
                      {mappingInfo.type === "existing" ? (
                        <Badge variant="secondary" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mapeado a: {mappingInfo.column}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-purple-600">
                          <Plus className="h-3 w-3 mr-1" />
                          Nueva columna: {mappingInfo.columnName}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mapeo a columna existente */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Mapear a columna existente:</Label>
                    <Select
                      value={mappingInfo?.type === "existing" ? mappingInfo.column : "none"}
                      onValueChange={(value) => handleExistingMapping(excelColumn, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar columna existente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No mapear</SelectItem>
                        <SelectItem value="brand">brand (Marca)</SelectItem>
                        <SelectItem value="model">model (Modelo)</SelectItem>
                        <SelectItem value="license_plate">license_plate (Matrícula)</SelectItem>
                        <SelectItem value="purchase_date">purchase_date (Fecha Compra)</SelectItem>
                        <SelectItem value="reception_date">reception_date (Fecha Recepción)</SelectItem>
                        <SelectItem value="notes">notes (Notas)</SelectItem>
                        <SelectItem value="price">price (Precio)</SelectItem>
                        <SelectItem value="status">status (Estado)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Crear nueva columna */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">O crear nueva columna:</Label>
                    <div className="flex gap-2">
                      <Select
                        value={mappingInfo?.type === "new" ? mappingInfo.table : selectedTable}
                        onValueChange={(value) => {
                          setSelectedTable(value)
                          if (mappingInfo?.type === "new") {
                            handleNewColumnMapping(excelColumn, value, mappingInfo.columnName)
                          }
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nuevas_entradas">nuevas_entradas</SelectItem>
                          <SelectItem value="stock">stock</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Nombre de la columna"
                        value={mappingInfo?.type === "new" ? mappingInfo.columnName : ""}
                        onChange={(e) => handleNewColumnMapping(excelColumn, selectedTable, e.target.value)}
                        className="flex-1"
                      />
                      {mappingInfo?.type === "new" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveNewColumnMapping(excelColumn)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Configuración adicional para nuevas columnas */}
                {mappingInfo?.type === "new" && (
                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-medium text-sm">Configuración de la nueva columna:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Tipo de dato:</Label>
                        <Select
                          value={newColumnMappings[excelColumn]?.dataType || "text"}
                          onValueChange={(value) => {
                            setNewColumnMappings({
                              ...newColumnMappings,
                              [excelColumn]: {
                                ...newColumnMappings[excelColumn],
                                dataType: value
                              }
                            })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto (VARCHAR)</SelectItem>
                            <SelectItem value="integer">Número entero (INTEGER)</SelectItem>
                            <SelectItem value="decimal">Número decimal (NUMERIC)</SelectItem>
                            <SelectItem value="boolean">Booleano (BOOLEAN)</SelectItem>
                            <SelectItem value="date">Fecha (DATE)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Requerido:</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newColumnMappings[excelColumn]?.isRequired || false}
                            onCheckedChange={(checked) => {
                              setNewColumnMappings({
                                ...newColumnMappings,
                                [excelColumn]: {
                                  ...newColumnMappings[excelColumn],
                                  isRequired: checked
                                }
                              })
                            }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {newColumnMappings[excelColumn]?.isRequired ? "Sí" : "No"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Valor por defecto:</Label>
                        <Input
                          placeholder="Opcional"
                          value={newColumnMappings[excelColumn]?.defaultValue || ""}
                          onChange={(e) => {
                            setNewColumnMappings({
                              ...newColumnMappings,
                              [excelColumn]: {
                                ...newColumnMappings[excelColumn],
                                defaultValue: e.target.value
                              }
                            })
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {Object.keys(mappings).length > 0 
                  ? `Listo para crear ${newMappingsCount} nuevas columnas y mapear ${existingMappingsCount} existentes`
                  : "No hay mapeos configurados"
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Las nuevas columnas se crearán en las tablas correspondientes
              </p>
            </div>
            <Button 
              onClick={onCreateColumns}
              disabled={Object.keys(mappings).length === 0 || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Crear Columnas
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Información sobre el Mapeo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm text-muted-foreground">
              Las columnas mapeadas a columnas existentes actualizarán los datos existentes
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm text-muted-foreground">
              Las nuevas columnas se crearán automáticamente en las tablas seleccionadas
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm text-muted-foreground">
              Los nombres de columnas deben seguir las convenciones de PostgreSQL (snake_case)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 