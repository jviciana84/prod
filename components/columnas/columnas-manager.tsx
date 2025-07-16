"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Database, 
  FileSpreadsheet, 
  Upload, 
  Plus, 
  Eye, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react"
import ColumnasExistentes from "./columnas-existentes"
import ExcelUploader from "./excel-uploader"
import MapeoColumnas from "./mapeo-columnas"

interface ColumnasManagerProps {
  nuevasEntradasColumns: any[]
  stockColumns: any[]
  userRoles?: string[]
}

export default function ColumnasManager({ 
  nuevasEntradasColumns, 
  stockColumns, 
  userRoles = [] 
}: ColumnasManagerProps) {
  const [activeTab, setActiveTab] = useState("existentes")
  const [excelData, setExcelData] = useState<any[]>([])
  const [excelColumns, setExcelColumns] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [mappings, setMappings] = useState<{[key: string]: string}>({})
  const [newColumnMappings, setNewColumnMappings] = useState<{[key: string]: {
    table: string
    columnName: string
    dataType: string
    isRequired: boolean
    defaultValue: string
  }}>({})

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Determinar si el usuario es administrador
  const isAdmin = userRoles.some(
    (role) => 
      role.toLowerCase() === "admin" || 
      role.toLowerCase() === "administración" ||
      role.toLowerCase() === "director" ||
      role.toLowerCase() === "supervisor"
  )

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

  // Manejar la carga del archivo Excel
  const handleExcelUpload = (data: any[], columns: string[]) => {
    setExcelData(data)
    setExcelColumns(columns)
    setActiveTab("mapeo")
    
    toast({
      title: "Archivo cargado correctamente",
      description: `Se encontraron ${columns.length} columnas en el archivo Excel`,
    })
  }

  // Crear nuevas columnas basadas en el mapeo
  const handleCreateColumns = async () => {
    if (Object.keys(mappings).length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos una columna para mapear",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      // Preparar los mapeos para las server actions
      const columnMappings = Object.entries(mappings).map(([excelColumn, mapping]) => {
        const mappingInfo = getMappingInfo(excelColumn)
        return {
          excelColumn,
          mapping,
          newColumnConfig: mappingInfo?.type === "new" ? newColumnMappings[excelColumn] : undefined
        }
      })

      // Importar la server action
      const { createNewColumns } = await import("@/server-actions/columnas-actions")
      
      const result = await createNewColumns(columnMappings)
      
      if (result.success) {
        toast({
          title: "Columnas creadas",
          description: result.message || "Las nuevas columnas se han creado correctamente",
        })
        
        // Limpiar el estado
        setExcelData([])
        setExcelColumns([])
        setMappings({})
        setNewColumnMappings({})
        setActiveTab("existentes")
        
        // Recargar la página para mostrar las nuevas columnas
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudieron crear las columnas. Inténtelo de nuevo.",
          variant: "destructive",
        })
      }
      
    } catch (error) {
      console.error("Error al crear columnas:", error)
      toast({
        title: "Error",
        description: "No se pudieron crear las columnas. Inténtelo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Información general */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Información General
          </CardTitle>
          <CardDescription>
            Esta herramienta te permite gestionar las columnas de las tablas nuevas_entradas y stock, 
            incluyendo la creación de nuevas columnas basadas en archivos Excel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Nuevas Entradas:</span>
              <Badge variant="secondary">{nuevasEntradasColumns.length} columnas</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Stock:</span>
              <Badge variant="secondary">{stockColumns.length} columnas</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="existentes" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Columnas Existentes
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Subir Excel
          </TabsTrigger>
          <TabsTrigger value="mapeo" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Mapeo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existentes" className="space-y-4">
          <ColumnasExistentes 
            nuevasEntradasColumns={nuevasEntradasColumns}
            stockColumns={stockColumns}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <ExcelUploader onExcelUpload={handleExcelUpload} />
        </TabsContent>

        <TabsContent value="mapeo" className="space-y-4">
          {excelColumns.length > 0 ? (
            <MapeoColumnas 
              excelColumns={excelColumns}
              nuevasEntradasColumns={nuevasEntradasColumns}
              stockColumns={stockColumns}
              mappings={mappings}
              setMappings={setMappings}
              newColumnMappings={newColumnMappings}
              setNewColumnMappings={setNewColumnMappings}
              onCreateColumns={handleCreateColumns}
              isProcessing={isProcessing}
            />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    Primero debes subir un archivo Excel para poder configurar el mapeo de columnas.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("upload")}
                  >
                    Ir a Subir Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 