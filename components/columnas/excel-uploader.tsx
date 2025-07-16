"use client"

import { useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle,
  CheckCircle,
  X,
  Info
} from "lucide-react"

interface ExcelUploaderProps {
  onExcelUpload: (data: any[], columns: string[]) => void
}

export default function ExcelUploader({ onExcelUpload }: ExcelUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedColumns, setExtractedColumns] = useState<string[]>([])
  const [extractedData, setExtractedData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ]

    if (!validTypes.includes(file.type)) {
      setError("Por favor, selecciona un archivo Excel (.xlsx, .xls) o CSV válido")
      return
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo es demasiado grande. El tamaño máximo es 10MB")
      return
    }

    setUploadedFile(file)
    setError(null)
    processFile(file)
  }

  const processFile = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // Leer el archivo
      const text = await file.text()
      
      // Procesar según el tipo de archivo
      let columns: string[] = []
      let data: any[] = []

      if (file.type === 'text/csv') {
        // Procesar CSV
        const lines = text.split('\n')
        if (lines.length > 0) {
          // Obtener columnas de la primera línea
          columns = lines[0].split(';').map(col => col.trim().replace(/"/g, ''))
          
          // Procesar datos (máximo 100 filas para preview)
          const maxRows = Math.min(lines.length - 1, 100)
          for (let i = 1; i <= maxRows; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(';').map(val => val.trim().replace(/"/g, ''))
              const row: any = {}
              columns.forEach((col, index) => {
                row[col] = values[index] || ''
              })
              data.push(row)
            }
          }
        }
      } else {
        // Para archivos Excel, simular procesamiento
        // En una implementación real, usarías una librería como xlsx
        columns = [
          'Marca',
          'Modelo', 
          'Matrícula',
          'Año',
          'Color',
          'Kilometraje',
          'Precio',
          'Estado',
          'Observaciones'
        ]
        
        // Generar datos de ejemplo
        data = Array.from({ length: 50 }, (_, i) => ({
          'Marca': `Marca ${i + 1}`,
          'Modelo': `Modelo ${i + 1}`,
          'Matrícula': `ABC${String(i + 1).padStart(3, '0')}`,
          'Año': 2020 + (i % 5),
          'Color': ['Rojo', 'Azul', 'Verde', 'Negro', 'Blanco'][i % 5],
          'Kilometraje': 50000 + (i * 1000),
          'Precio': 15000 + (i * 500),
          'Estado': ['Nuevo', 'Usado', 'Seminuevo'][i % 3],
          'Observaciones': `Observación ${i + 1}`
        }))
      }

      clearInterval(progressInterval)
      setUploadProgress(100)

      setExtractedColumns(columns)
      setExtractedData(data)

      toast({
        title: "Archivo procesado correctamente",
        description: `Se encontraron ${columns.length} columnas y ${data.length} filas de datos`,
      })

    } catch (err) {
      console.error("Error al procesar archivo:", err)
      setError("Error al procesar el archivo. Asegúrate de que el formato sea correcto.")
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpload = () => {
    if (extractedColumns.length > 0 && extractedData.length > 0) {
      onExcelUpload(extractedData, extractedColumns)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setExtractedColumns([])
    setExtractedData([])
    setUploadProgress(0)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      setUploadedFile(file)
      setError(null)
      processFile(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Área de subida */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Subir Archivo Excel
          </CardTitle>
          <CardDescription>
            Sube un archivo Excel o CSV para extraer las columnas y crear nuevas columnas en las tablas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Área de drag & drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              uploadedFile 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {!uploadedFile ? (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium">Arrastra y suelta tu archivo aquí</p>
                  <p className="text-sm text-muted-foreground">o</p>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2"
                  >
                    Seleccionar archivo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos soportados: .xlsx, .xls, .csv (máximo 10MB)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      Procesando archivo... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Información del archivo procesado */}
          {extractedColumns.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Archivo Procesado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{extractedColumns.length}</p>
                    <p className="text-sm text-muted-foreground">Columnas encontradas</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{extractedData.length}</p>
                    <p className="text-sm text-muted-foreground">Filas de datos</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round((extractedData.length / 100) * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Datos procesados</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Columnas detectadas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {extractedColumns.map((column, index) => (
                      <Badge key={index} variant="outline">
                        {column}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleUpload}
                  className="w-full"
                  disabled={isUploading}
                >
                  Continuar con el Mapeo
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm text-muted-foreground">
              El archivo debe tener una primera fila con los nombres de las columnas
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm text-muted-foreground">
              Se procesarán máximo 100 filas para el preview y mapeo
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm text-muted-foreground">
              Las nuevas columnas se crearán como campos de texto por defecto
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 