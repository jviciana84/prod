"use client"

import type React from "react"
import { useState, useRef, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  Loader2,
  Check,
  Upload,
  Edit2,
  Save,
  ArrowLeft,
  FileUp,
  FilePlus2,
  FileCheck2,
  Paperclip,
  X,
  Building,
  UserCircle,
  Car,
  BadgePercent,
  Banknote,
  CalendarDays,
  Hash,
  Mail,
  Phone,
  MapPin,
  KeySquare,
  Briefcase,
  Globe,
  Building2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Actualizar la función detectDealershipFromText para incluir los números de tomo
const detectDealershipFromText = (text: string): string => {
  if (!text) return "Quadis Munich (QM)" // Default - Motor Munich ahora es Quadis Munich

  // Buscar los CIFs o números de tomo del concesionario en el texto del PDF
  // Todo ahora se detecta como Quadis Munich (QM)
  if (
    text.includes("58800111") ||
    text.includes("A-58800111") ||
    text.includes("A58800111") ||
    text.includes("Tomo 10038") ||
    text.includes("TOMO 10038")
  ) {
    return "Quadis Munich (QM)"
  } else if (
    text.includes("67276543") ||
    text.includes("B-67276543") ||
    text.includes("B67276543") ||
    text.includes("Tomo 46544") ||
    text.includes("TOMO 46544")
  ) {
    return "Quadis Munich (QM)"
  }

  // Si no encuentra ningún identificador específico, usar QM como default
  return "Quadis Munich (QM)"
}

const dealershipOptions = [
  { value: "Quadis Munich (QM)", label: "Quadis Munich (QM)" },
  { value: "Motor Munich (MM)", label: "Motor Munich (MM)" },
  { value: "Motor Munich Cadí (MMC)", label: "Motor Munich Cadí (MMC)" },
]

const fieldDisplayConfig: Record<
  string,
  { label: string; icon: React.ElementType; category: "cliente" | "vehiculo" | "pedido" | "comercial" }
> = {
  "NOMBRE Y APELLIDOS O EMPRESA": { label: "Cliente/Empresa", icon: UserCircle, category: "cliente" },
  "D.N.I. Ó N.I.F.": { label: "DNI/NIF/CIF Cliente", icon: KeySquare, category: "cliente" },
  EMAIL: { label: "Email", icon: Mail, category: "cliente" },
  "TFNO. PARTICULAR": { label: "Teléfono", icon: Phone, category: "cliente" },
  DOMICILIO: { label: "Domicilio", icon: MapPin, category: "cliente" },
  CIUDAD: { label: "Ciudad", icon: MapPin, category: "cliente" },
  "C.P.": { label: "C.P.", icon: MapPin, category: "cliente" },
  PROVINCIA: { label: "Provincia", icon: MapPin, category: "cliente" },
  MARCA: { label: "Marca", icon: Car, category: "vehiculo" },
  "Nº DE MATRÍCULA": { label: "Matrícula", icon: Car, category: "vehiculo" },
  "Nº BASTIDOR": { label: "Bastidor", icon: Car, category: "vehiculo" },
  MODELO: { label: "Modelo", icon: Car, category: "vehiculo" },
  COLOR: { label: "Color", icon: Car, category: "vehiculo" },
  KILÓMETROS: { label: "Kilómetros", icon: Car, category: "vehiculo" },
  "PRIMERA FECHA MATRICULACIÓN": { label: "1ª Matriculación", icon: CalendarDays, category: "vehiculo" },
  "Nº PEDIDO": { label: "Nº Pedido", icon: Hash, category: "pedido" },
  "FECHA DE PEDIDO": { label: "Fecha Ped.", icon: CalendarDays, category: "pedido" },
  BANCO: { label: "Banco/Financ.", icon: Building, category: "pedido" },
  TOTAL: { label: "Total", icon: Banknote, category: "pedido" },
  DESCUENTO: { label: "Descuento", icon: BadgePercent, category: "pedido" },
  Comercial: { label: "Comercial", icon: Briefcase, category: "comercial" },
  "PORTAL ORIGEN": { label: "Origen", icon: Globe, category: "comercial" },
}

interface PdfUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PdfUploadModal({ isOpen, onClose }: PdfUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [editedFields, setEditedFields] = useState<Record<string, string>>({})
  const [editMode, setEditMode] = useState(false)
  const [selectedDealership, setSelectedDealership] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Limpiar completamente el estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen])

  // Procesar automáticamente cuando se selecciona un archivo
  useEffect(() => {
    if (file && !loading && !result) {
      console.log(`=== DEBUG: Archivo detectado en useEffect, iniciando procesamiento ===`)
      handleSubmit()
    }
  }, [file])

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const selectedFile = files[0]
    
    // Validación básica de tipo de archivo
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Por favor, selecciona un archivo PDF válido.")
      return
    }

    console.log(`=== DEBUG: Archivo seleccionado ===`)
    console.log(`Nombre: ${selectedFile.name}`)
    console.log(`Tamaño: ${selectedFile.size} bytes`)
    console.log(`Tipo: ${selectedFile.type}`)

    // Limpiar completamente el estado antes de procesar el nuevo archivo
    setFile(selectedFile)
    setError(null)
    setResult(null)
    setEditedFields({})
    setEditMode(false)
    setSelectedDealership("")
    setDragActive(false)
    
    console.log(`=== DEBUG: Estado limpiado, archivo establecido ===`)
    // NO llamar handleSubmit aquí, se llamará automáticamente en useEffect
  }

  const handleDragEvent = (e: React.DragEvent, type: "dragenter" | "dragover" | "dragleave" | "drop") => {
    e.preventDefault()
    e.stopPropagation()
    if (loading || result) return

    switch (type) {
      case "dragenter":
      case "dragover":
        setDragActive(true)
        break
      case "dragleave":
        setDragActive(false)
        break
      case "drop":
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFileChange(e.dataTransfer.files)
        }
        break
    }
  }

  const handleSubmit = async () => {
    console.log(`=== DEBUG: handleSubmit iniciado ===`)
    console.log(`File state:`, file)
    console.log(`File name:`, file?.name)
    console.log(`File size:`, file?.size)
    
    if (!file) {
      console.error(`=== DEBUG: No hay archivo en el estado ===`)
      setError("Por favor, selecciona un archivo PDF.")
      return
    }
    
    console.log(`=== DEBUG: Archivo válido, iniciando procesamiento ===`)
    setLoading(true)
    setError(null)
    setResult(null)
    setEditedFields({}) // Limpiar campos editados
    setEditMode(false) // Resetear modo de edición

    try {
      console.log(`=== DEBUG: Procesando archivo ===`)
      console.log(`Nombre: ${file.name}`)
      console.log(`Tamaño: ${file.size} bytes`)
      console.log(`Tipo: ${file.type}`)
      console.log(`Última modificación: ${new Date(file.lastModified).toISOString()}`)
      
      // NUEVO: Extraer texto en el CLIENTE (navegador)
      console.log(`📄 Extrayendo texto del PDF en el navegador...`)
      const { extractTextFromPDFClient } = await import("@/lib/pdf-client-extractor")
      const extractedText = await extractTextFromPDFClient(file)
      console.log(`✅ Texto extraído (${extractedText.length} caracteres)`)
      
      // Enviar solo el TEXTO al servidor
      console.log(`Enviando texto a la API...`)
      const startTime = Date.now()
      const response = await fetch("/api/test-pdf-extract", { 
        method: "POST", 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractedText })
      })
      const endTime = Date.now()
      
      console.log(`=== DEBUG: Respuesta de la API ===`)
      console.log(`Tiempo de respuesta: ${endTime - startTime}ms`)
      console.log(`Status: ${response.status}`)
      console.log(`OK: ${response.ok}`)
      console.log(`Headers:`, Object.fromEntries(response.headers.entries()))
      
      const data = await response.json()
      console.log(`Datos de respuesta:`, data)

      if (!response.ok) {
        console.error("Error en la respuesta:", data)
        // Limpiar todo el estado en caso de error
        setResult(null)
        setEditedFields({})
        setEditMode(false)
        setSelectedDealership("")
        throw new Error(data.error || `Error procesando el archivo PDF. Código: ${response.status}`)
      }

      // Verificar que los datos extraídos sean válidos
      if (!data.extractedFields || Object.keys(data.extractedFields).length === 0) {
        console.error("No se extrajeron campos válidos:", data)
        throw new Error("No se pudieron extraer datos del PDF. El archivo puede estar corrupto o no ser un PDF válido.")
      }

      console.log("Datos extraídos exitosamente:", data)

      setResult(data)
      setEditedFields(data.extractedFields || {})

      // Detectar concesionario del texto del PDF
      const dealership = detectDealershipFromText(data.text || "")
      setSelectedDealership(dealership)

      toast.success("PDF procesado con éxito", { description: "Datos extraídos del pedido." })
    } catch (err: any) {
      console.error("=== DEBUG: Error completo ===", err)
      const errorMessage = err.message || "Error desconocido al procesar el PDF."
      setError(errorMessage)
      // Asegurar que todo esté limpio en caso de error
      setResult(null)
      setEditedFields({})
      setEditMode(false)
      setSelectedDealership("")
      toast.error("Error al procesar PDF", { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldKey: string, value: string) => {
    const newEditedFields = { ...editedFields, [fieldKey]: value }
    setEditedFields(newEditedFields)
  }

  const handleDealershipChange = (value: string) => {
    setSelectedDealership(value)
  }

  const handleSaveData = async () => {
    if (!result) return

    setLoading(true)
    try {
      // Combinar campos originales con campos editados
      const finalFields = { ...result.extractedFields, ...editedFields }
      
      // Si no hay BANCO o TIPO FINANCIACIÓN, establecer "Contado" por defecto
      if (!finalFields["BANCO"] || finalFields["BANCO"].trim() === "") {
        finalFields["BANCO"] = "Contado"
      }
      if (!finalFields["TIPO FINANCIACIÓN"] || finalFields["TIPO FINANCIACIÓN"].trim() === "") {
        finalFields["TIPO FINANCIACIÓN"] = "Contado"
      }

      const saveData = {
        extractedFields: finalFields,
        originalText: result.text,
        fileName: file?.name,
        method: result.method,
        selectedDealership: selectedDealership,
      }

      console.log("📤 Enviando datos al servidor:", saveData)

      const response = await fetch("/api/save-pdf-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error guardando los datos.")
      }

      toast.success("Datos guardados correctamente", { description: "La información ha sido procesada y guardada." })
      onClose()
      resetForm()
    } catch (err: any) {
      toast.error("Error al guardar", { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setError(null)
    setResult(null)
    setEditedFields({})
    setEditMode(false)
    setSelectedDealership("")
    setDragActive(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const renderField = (field: { key: string; label: string; icon: React.ElementType; value: string }) => {
    // Usar el valor editado si existe, sino el valor original
    const displayValue = editMode ? (editedFields[field.key] ?? field.value) : field.value
    
    return (
      <div key={field.key} className="mb-1.5">
        <Label htmlFor={field.key} className="flex items-center text-[11px] font-medium text-muted-foreground mb-0.5">
          <field.icon className="mr-1.5 h-3 w-3 text-muted-foreground" />
          {field.label}
        </Label>
        {editMode ? (
          <Input
            id={field.key}
            value={displayValue}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="h-8 bg-background border-border text-foreground placeholder-muted-foreground text-xs px-2"
            disabled={loading}
          />
        ) : (
          <p
            className={cn(
              "text-xs p-1.5 rounded-md border min-h-[32px] flex items-center break-all",
              displayValue && displayValue.trim() !== ""
                ? "text-foreground bg-background border-border"
                : "text-red-400 bg-red-950/20 border-red-800 font-semibold italic",
            )}
          >
            {displayValue && displayValue.trim() !== "" ? displayValue : "⚠️ N/A - Campo vacío"}
          </p>
        )}
      </div>
    )
  }

  const categoryTitles: Record<string, string> = {
    cliente: "Cliente",
    vehiculo: "Vehículo",
    pedido: "Pedido",
    comercial: "Comercial",
  }

  const groupedFields = useMemo(() => {
    if (!result?.extractedFields) return {}

    const groups: Record<string, Array<{ key: string; label: string; icon: React.ElementType; value: string }>> = {
      cliente: [],
      vehiculo: [],
      pedido: [],
      comercial: [],
    }

    // Crear un array ordenado de las claves según fieldDisplayConfig
    const orderedKeys = Object.keys(fieldDisplayConfig)

    // Procesar los campos en el orden definido
    orderedKeys.forEach((key) => {
      const config = fieldDisplayConfig[key]
      const value = result.extractedFields[key]
      
      if (config && value !== undefined) {
        groups[config.category].push({
          key,
          label: config.label,
          icon: config.icon,
          value: value as string,
        })
      }
    })

    return groups
  }, [result?.extractedFields])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Procesar PDF de Venta
          </DialogTitle>
          <DialogDescription>
            Sube un PDF de pedido para extraer y procesar automáticamente los datos de la venta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Área de Upload */}
          {!result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileUp className="h-5 w-5" />
                  Subir PDF
                </CardTitle>
                <CardDescription>
                  Arrastra y suelta un archivo PDF o haz clic para seleccionarlo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                    dragActive
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-gray-300 dark:border-gray-600",
                    "hover:border-blue-400 dark:hover:border-blue-400"
                  )}
                  onDragEnter={(e) => handleDragEvent(e, "dragenter")}
                  onDragOver={(e) => handleDragEvent(e, "dragover")}
                  onDragLeave={(e) => handleDragEvent(e, "dragleave")}
                  onDrop={(e) => handleDragEvent(e, "drop")}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e.target.files)}
                    className="hidden"
                  />
                  <div className="relative mx-auto w-12 h-12 mb-4">
                    {loading ? (
                      <>
                        <div className="absolute inset-0 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Upload className="h-8 w-8 text-blue-600" />
                        </div>
                      </>
                    ) : (
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <p className="text-lg font-medium mb-2">
                    {file ? file.name : "Arrastra tu PDF aquí o haz clic para seleccionar"}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Solo se aceptan archivos PDF
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="mb-4"
                  >
                    <FilePlus2 className="h-4 w-4 mr-2" />
                    Seleccionar PDF
                  </Button>
                  {file && (
                    <div className="flex items-center justify-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {file.name} seleccionado
                      </span>
                    </div>
                  )}
                </div>

                {error && (
                  <Alert className="mt-4" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resultados */}
          {result && (
            <Card className="shadow-lg bg-card border-border">
              <CardHeader className="border-b border-border p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="text-base sm:text-lg">Resultados de Extracción</CardTitle>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode(!editMode)}
                      disabled={loading}
                      className="border-input hover:bg-accent text-xs px-2.5 py-1 h-auto"
                    >
                      <Edit2 className="mr-1.5 h-3.5 w-3.5" /> {editMode ? "Ver" : "Editar"}
                    </Button>
                    <Button
                      onClick={handleSaveData}
                      disabled={loading}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-2.5 py-1 h-auto"
                    >
                      {loading ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {loading ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </div>
                {file && (
                  <CardDescription className="flex items-center gap-1.5 pt-1.5 text-[11px] sm:text-xs text-muted-foreground">
                    <Paperclip className="h-3.5 w-3.5" /> {file.name}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-3 px-2 sm:px-3">
                <Alert className="mb-3 text-[11px] sm:text-xs p-2 bg-background border-border text-foreground">
                  <AlertDescription>
                    <span className="font-semibold text-foreground">Método:</span> {result.method} |{" "}
                    <span className="font-semibold text-foreground">Págs:</span> {result.pages || "N/A"} |{" "}
                    <span className="font-semibold text-foreground">Campos:</span>{" "}
                    {
                      Object.values(result.extractedFields || {}).filter((value) => value && String(value).trim() !== "")
                        .length
                    }
                    /{Object.keys(fieldDisplayConfig).length}
                  </AlertDescription>
                </Alert>

                {/* Concesionario editable - SEPARADO de los datos del cliente */}
                <div className="mb-3 p-2 rounded-md bg-background border border-border">
                  <h4 className="text-xs font-semibold flex items-center text-foreground mb-1">
                    <Building2 className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> Concesionario Vendedor
                  </h4>
                  {editMode ? (
                    <Select value={selectedDealership} onValueChange={handleDealershipChange} disabled={loading}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Seleccionar concesionario" />
                      </SelectTrigger>
                      <SelectContent>
                        {dealershipOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-foreground">{selectedDealership || "Motor Munich (MM)"}</p>
                  )}
                </div>

                <Tabs defaultValue="fields" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-3 h-8 text-xs bg-muted">
                    <TabsTrigger
                      value="fields"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground h-full text-center"
                    >
                      Campos
                    </TabsTrigger>
                    <TabsTrigger
                      value="text"
                      className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground h-full text-center"
                    >
                      Texto PDF
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="fields">
                    <div className="p-2 rounded-md bg-background border border-border">
                      {Object.entries(groupedFields).map(([categoryKey, fields]) => (
                        <div key={categoryKey} className="mb-2 last:mb-0">
                          <h3 className="text-xs font-semibold text-foreground mb-1 border-b border-border pb-0.5">
                            {categoryTitles[categoryKey]}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-0">
                            {fields.map(renderField)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="text">
                    <div className="p-2 rounded-md bg-background border border-border">
                      <h3 className="text-xs font-semibold text-foreground mb-1">Texto Completo del PDF</h3>
                      <textarea
                        value={result.text || "No se pudo extraer texto."}
                        readOnly
                        className="w-full h-[200px] sm:h-[250px] p-1.5 border rounded-md text-[10px] font-mono focus:ring-1 bg-background border-border text-foreground placeholder-muted-foreground focus:ring-ring"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t p-3 sm:p-4 border-border bg-card">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                  className="w-full sm:w-auto border-input hover:bg-accent text-xs px-3 py-1.5 h-auto"
                >
                  Procesar Otro
                </Button>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                    disabled={loading}
                    className="border-input hover:bg-accent text-xs px-2.5 py-1 h-auto"
                  >
                    <Edit2 className="mr-1.5 h-3.5 w-3.5" /> {editMode ? "Ver" : "Editar"}
                  </Button>
                  <Button
                    onClick={handleSaveData}
                    disabled={loading}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-2.5 py-1 h-auto"
                  >
                    {loading ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {loading ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-input hover:bg-accent text-xs px-3 py-1.5 h-auto"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Cerrar
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 