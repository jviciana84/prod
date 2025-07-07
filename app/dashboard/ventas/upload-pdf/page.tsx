"use client"

import type React from "react"
import { useState, useRef, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  if (!text) return "Motor Munich (MM)" // Default

  // Buscar los CIFs o números de tomo del concesionario en el texto del PDF
  if (
    text.includes("58800111") ||
    text.includes("A-58800111") ||
    text.includes("A58800111") ||
    text.includes("Tomo 10038") ||
    text.includes("TOMO 10038")
  ) {
    return "Motor Munich (MM)"
  } else if (
    text.includes("67276543") ||
    text.includes("B-67276543") ||
    text.includes("B67276543") ||
    text.includes("Tomo 46544") ||
    text.includes("TOMO 46544")
  ) {
    return "Motor Munich Cadí (MMC)"
  }

  // Si no encuentra ningún identificador específico, usar MM como default
  return "Motor Munich (MM)"
}

const dealershipOptions = [
  { value: "Motor Munich Cadí (MMC)", label: "Motor Munich Cadí (MMC)" },
  { value: "Motor Munich (MM)", label: "Motor Munich (MM)" },
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

export default function UploadPdfPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedFields, setEditedFields] = useState<Record<string, string>>({})
  const [dragActive, setDragActive] = useState(false)
  const [selectedDealership, setSelectedDealership] = useState<string>("")

  useEffect(() => {
    if (result) {
      // Detectar concesionario basado en el texto del PDF, no en el CIF del cliente
      const dealership = detectDealershipFromText(result.text || "")
      setSelectedDealership(dealership)
      console.log("Concesionario detectado:", dealership)
    } else {
      setSelectedDealership("")
    }
  }, [result])

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const selectedFile = files[0]
      if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setError("Por favor, selecciona un archivo PDF válido.")
        setFile(null)
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("El archivo es demasiado grande (máx. 10MB).")
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
      setResult(null)
      setSaved(false)
      setEditMode(false)
      setSelectedDealership("")
    }
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
    if (!file) {
      setError("Por favor, selecciona un archivo PDF.")
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/test-pdf-extract", { method: "POST", body: formData })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Error procesando el archivo PDF.")

      console.log("Datos extraídos:", data)

      setResult(data)
      setEditedFields(data.extractedFields || {})

      // Detectar concesionario del texto del PDF
      const dealership = detectDealershipFromText(data.text || "")
      setSelectedDealership(dealership)

      toast.success("PDF procesado con éxito", { description: "Datos extraídos del pedido." })
    } catch (err: any) {
      setError(err.message || "Error desconocido al procesar el PDF.")
      toast.error("Error al procesar PDF", { description: err.message })
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
    // NO modificar el CIF del cliente cuando cambia el concesionario
  }

  const handleSaveData = async () => {
    if (!result) {
      setError("No hay datos extraídos para guardar.")
      return
    }
    setSaving(true)
    setError(null)

    try {
      const fieldsToSave = editMode ? editedFields : result.extractedFields

      const dataToSave = {
        extractedFields: fieldsToSave,
        originalText: result.text,
        fileName: file?.name,
        method: result.method,
        selectedDealership: selectedDealership,
      }

      console.log("📤 Enviando datos al servidor:", dataToSave)

      const response = await fetch("/api/save-pdf-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("❌ Error del servidor:", data)

        // Manejar errores específicos
        if (response.status === 401) {
          setError("Error de autenticación. Por favor, recarga la página e intenta de nuevo.")
          // Limpiar cookies corruptas
          document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
          })
          setTimeout(() => window.location.reload(), 2000)
          return
        }

        throw new Error(data.error || `Error del servidor (${response.status})`)
      }

      console.log("✅ Respuesta del servidor:", data)
      setSaved(true)
      toast.success("Venta registrada correctamente", { description: "Los datos del pedido se han guardado." })
      setTimeout(() => router.push("/dashboard/ventas"), 2000)
    } catch (err: any) {
      console.error("❌ Error completo:", err)
      setError(err.message || "Error desconocido al guardar los datos.")
      toast.error("Error al guardar datos", { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setSaved(false)
    setEditMode(false)
    setEditedFields({})
    setSelectedDealership("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const categorizedFieldsForDisplay = useMemo(() => {
    if (!result) return {}
    const sourceFields = editMode ? editedFields : result.extractedFields || {}

    return Object.entries(fieldDisplayConfig).reduce(
      (acc, [key, config]) => {
        const category = config.category
        if (!acc[category]) acc[category] = []
        acc[category].push({
          key,
          label: config.label,
          icon: config.icon,
          value: String(sourceFields[key] === undefined || sourceFields[key] === null ? "" : sourceFields[key]),
        })
        return acc
      },
      {} as Record<string, { key: string; label: string; icon: React.ElementType; value: string }[]>,
    )
  }, [result, editMode, editedFields])

  const renderField = (field: { key: string; label: string; icon: React.ElementType; value: string }) => (
    <div key={field.key} className="mb-1.5">
      <Label htmlFor={field.key} className="flex items-center text-[11px] font-medium text-muted-foreground mb-0.5">
        <field.icon className="mr-1.5 h-3 w-3 text-muted-foreground" />
        {field.label}
      </Label>
      {editMode ? (
        <Input
          id={field.key}
          value={field.value}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          className="h-8 bg-background border-border text-foreground placeholder-muted-foreground text-xs px-2"
          disabled={saved || saving}
        />
      ) : (
        <p
          className={cn(
            "text-xs p-1.5 rounded-md border min-h-[32px] flex items-center break-all",
            field.value && field.value.trim() !== ""
              ? "text-foreground bg-background border-border"
              : "text-red-400 bg-red-950/20 border-red-800 font-semibold italic",
          )}
        >
          {field.value && field.value.trim() !== "" ? field.value : "⚠️ N/A - Campo vacío"}
        </p>
      )}
    </div>
  )

  const categoryTitles: Record<string, string> = {
    cliente: "Cliente",
    vehiculo: "Vehículo",
    pedido: "Pedido",
    comercial: "Comercial",
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-6 px-2 sm:px-4 lg:px-6">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Procesar Pedido PDF</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">Sube PDF para extraer datos de venta.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center border-input hover:bg-accent text-xs px-3 py-1.5 h-auto"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Volver
        </Button>
      </header>
      {error && (
        <Alert variant="destructive" className="mb-4 bg-red-900/80 border-red-700 text-red-200 text-xs p-2.5">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertTitle className="font-semibold">Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!result ? (
        <Card
          className={cn(
            "transition-all shadow-lg bg-card border-border",
            dragActive ? "border-slate-500 ring-1 ring-slate-500" : "",
          )}
          onDragEnter={(e) => handleDragEvent(e, "dragenter")}
          onDragLeave={(e) => handleDragEvent(e, "dragleave")}
          onDragOver={(e) => handleDragEvent(e, "dragover")}
          onDrop={(e) => handleDragEvent(e, "drop")}
        >
          <CardHeader className="border-b border-border p-3 sm:p-4">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <FileUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" /> Subir PDF
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Arrastra o selecciona un archivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-6 sm:py-8 px-3 sm:px-4">
            <div
              className={cn(
                "flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed rounded-md text-center cursor-pointer transition-colors",
                "bg-input border-input hover:border-slate-500",
              )}
              onClick={() => !loading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="pdf-upload-input"
                accept=".pdf"
                onChange={(e) => handleFileChange(e.target.files)}
                className="hidden"
                disabled={loading}
              />
              {file ? (
                <div className="flex flex-col items-center gap-1.5">
                  <FileCheck2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-400" />
                  <p className="font-semibold text-xs sm:text-sm">{file.name}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      resetForm()
                    }}
                    className="text-red-400 hover:text-red-300 text-[11px] sm:text-xs h-auto py-0.5 px-1"
                  >
                    <X className="mr-1 h-3 w-3" /> Quitar
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <FilePlus2 className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                  <p className="font-medium text-xs sm:text-sm">
                    {dragActive ? "Suelta aquí" : "Selecciona o arrastra PDF"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Máx. 10MB</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t border-border p-3 sm:p-4 bg-card">
            <Button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="w-full sm:w-auto ml-auto bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 py-1.5 h-auto"
            >
              {loading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-3.5 w-3.5" />
              )}
              {loading ? "Procesando..." : "Procesar"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="shadow-lg bg-card border-border">
            <CardHeader className="border-b border-border p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle className="text-base sm:text-lg">Resultados de Extracción</CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                    disabled={saved || saving}
                    className="border-input hover:bg-accent text-xs px-2.5 py-1 h-auto"
                  >
                    <Edit2 className="mr-1.5 h-3.5 w-3.5" /> {editMode ? "Ver" : "Editar"}
                  </Button>
                  <Button
                    onClick={handleSaveData}
                    disabled={saving || saved}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-2.5 py-1 h-auto"
                  >
                    {saving ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {saved ? "Guardado" : saving ? "Guardando..." : "Guardar"}
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
              {saved && (
                <Alert variant="success" className="mb-3 bg-green-800/80 border-green-700 text-green-200 text-xs p-2">
                  <Check className="h-3.5 w-3.5" /> <AlertTitle className="font-semibold">Guardado</AlertTitle>
                  <AlertDescription>Redirigiendo...</AlertDescription>
                </Alert>
              )}
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
                  <Select value={selectedDealership} onValueChange={handleDealershipChange} disabled={saved || saving}>
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
                    {Object.entries(categorizedFieldsForDisplay).map(([categoryKey, fields]) => (
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
                disabled={saving}
                className="w-full sm:w-auto border-input hover:bg-accent text-xs px-3 py-1.5 h-auto"
              >
                Procesar Otro
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/ventas")}
                className="w-full sm:w-auto border-input hover:bg-accent text-xs px-3 py-1.5 h-auto"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Ir a Ventas
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
