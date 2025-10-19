"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from "@/lib/supabase/client"
import {
  FileText,
  Loader2,
  AlertCircle,
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
  Building,
  Save,
  Edit,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { formatDateForDisplay, formatDateForDatabase } from "@/lib/date-utils"

interface PdfDataDialogProps {
  vehicleId: string
  licensePlate: string
}

// Usar la nueva función de utilidades
const parseDate = formatDateForDatabase

// Función para obtener el nombre completo del concesionario
function getDealershipName(code: string | null): string {
  if (!code) return "Sin especificar"

  switch (code.toUpperCase()) {
    case "QM":
      return "Quadis Munich"
    case "MM":
      return "Motor Munich (histórico)"
    case "MMC":
      return "Motor Munich Cadí (histórico)"
    default:
      return code
  }
}

// Función para obtener el código desde el nombre
function getDealershipCode(name: string | null): string | null {
  if (!name) return null

  switch (name) {
    case "Quadis Munich":
      return "QM"
    case "Motor Munich":
      return "MM"
    case "Motor Munich Cadí":
      return "MMC"
    default:
      return name.length <= 5 ? name : null // Si es corto, asumir que es un código
  }
}

const dealershipOptions = [
  { code: "QM", name: "Quadis Munich" },
  { code: "MM", name: "Motor Munich" },
  { code: "MMC", name: "Motor Munich Cadí" },
]

const fieldDisplayConfig: Record<
  string,
  {
    label: string
    icon: React.ElementType
    category: "cliente" | "vehiculo" | "pedido" | "comercial"
    editable: boolean
    type?: "select" | "input" | "date"
  }
> = {
  "NOMBRE Y APELLIDOS O EMPRESA": { label: "Cliente/Empresa", icon: UserCircle, category: "cliente", editable: true },
  "D.N.I. Ó N.I.F.": { label: "DNI/NIF/CIF Cliente", icon: KeySquare, category: "cliente", editable: true },
  EMAIL: { label: "Email", icon: Mail, category: "cliente", editable: true },
  "TFNO. PARTICULAR": { label: "Teléfono", icon: Phone, category: "cliente", editable: true },
  DOMICILIO: { label: "Domicilio", icon: MapPin, category: "cliente", editable: true },
  CIUDAD: { label: "Ciudad", icon: MapPin, category: "cliente", editable: true },
  "C.P.": { label: "C.P.", icon: MapPin, category: "cliente", editable: true },
  PROVINCIA: { label: "Provincia", icon: MapPin, category: "cliente", editable: true },
  MARCA: { label: "Marca", icon: Car, category: "vehiculo", editable: true },
  "Nº DE MATRÍCULA": { label: "Matrícula", icon: Car, category: "vehiculo", editable: false },
  "Nº BASTIDOR": { label: "Bastidor", icon: Car, category: "vehiculo", editable: true },
  MODELO: { label: "Modelo", icon: Car, category: "vehiculo", editable: true },
  COLOR: { label: "Color", icon: Car, category: "vehiculo", editable: true },
  KILÓMETROS: { label: "Kilómetros", icon: Car, category: "vehiculo", editable: true },
  "PRIMERA FECHA MATRICULACIÓN": {
    label: "1ª Matriculación",
    icon: CalendarDays,
    category: "vehiculo",
    editable: true,
    type: "date",
  },
  "Nº PEDIDO": { label: "Nº Pedido", icon: Hash, category: "pedido", editable: true },
  "FECHA DE PEDIDO": { label: "Fecha Ped.", icon: CalendarDays, category: "pedido", editable: true, type: "date" },
  BANCO: { label: "Banco/Financ.", icon: Building, category: "pedido", editable: true },
  TOTAL: { label: "Total", icon: Banknote, category: "pedido", editable: true },
  DESCUENTO: { label: "Descuento", icon: BadgePercent, category: "pedido", editable: true },
  Comercial: { label: "Comercial", icon: Briefcase, category: "comercial", editable: true },
  "PORTAL ORIGEN": { label: "Origen", icon: Globe, category: "comercial", editable: true },
  dealership_code: { label: "Concesionario", icon: Building2, category: "comercial", editable: true, type: "select" },
}

const categoryTitles: Record<string, string> = {
  cliente: "Cliente",
  vehiculo: "Vehículo",
  pedido: "Pedido",
  comercial: "Comercial",
}

export function PdfDataDialog({ vehicleId, licensePlate }: PdfDataDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfData, setPdfData] = useState<any>(null)
  const [editedData, setEditedData] = useState<any>({})
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const supabase = createClientComponentClient()

  const loadPdfData = async () => {
    if (!open || pdfData) return

    setLoading(true)
    setError(null)

    try {
      // Primero obtenemos el ID de la extracción del PDF desde sales_vehicles
      const { data: vehicleData, error: vehicleError } = await supabase
        .from("sales_vehicles")
        .select("pdf_extraction_id")
        .eq("id", vehicleId)
        .single()

      if (vehicleError) {
        throw new Error(`Error al obtener datos del vehículo: ${vehicleError.message}`)
      }

      if (!vehicleData?.pdf_extraction_id) {
        throw new Error("Este vehículo no tiene datos de PDF asociados")
      }

      // Luego obtenemos los datos de la extracción
      const { data: extractionData, error: extractionError } = await supabase
        .from("pdf_extracted_data")
        .select("*")
        .eq("id", vehicleData.pdf_extraction_id)
        .single()

      if (extractionError) {
        throw new Error(`Error al obtener datos de extracción: ${extractionError.message}`)
      }

      if (!extractionData) {
        throw new Error("No se encontraron datos de extracción")
      }

      // Construir un objeto con los campos extraídos
      const extractedFields = {
        BANCO: extractionData.banco,
        Comercial: extractionData.comercial,
        TOTAL: extractionData.total,
        "Nº DE MATRÍCULA": extractionData.matricula,
        PROVINCIA: extractionData.provincia,
        "C.P.": extractionData.codigo_postal,
        CIUDAD: extractionData.ciudad,
        EMAIL: extractionData.email,
        "TFNO. PARTICULAR": extractionData.telefono,
        "D.N.I. Ó N.I.F.": extractionData.dni_nif,
        DOMICILIO: extractionData.domicilio,
        "PORTAL ORIGEN": extractionData.portal_origen,
        "NOMBRE Y APELLIDOS O EMPRESA": extractionData.nombre_cliente,
        "FECHA DE PEDIDO": formatDateForDisplay(extractionData.fecha_pedido),
        "Nº BASTIDOR": extractionData.numero_bastidor,
        MODELO: extractionData.modelo,
        DESCUENTO: extractionData.descuento,
        "Nº PEDIDO": extractionData.numero_pedido,
        MARCA: extractionData.marca,
        COLOR: extractionData.color,
        KILÓMETROS: extractionData.kilometros,
        "PRIMERA FECHA MATRICULACIÓN": formatDateForDisplay(extractionData.primera_fecha_matriculacion),
        dealership_code: extractionData.dealership_code,
      }

      const pdfDataObj = {
        extractedFields,
        fileName: extractionData.pdf_filename,
        createdAt: extractionData.created_at,
        extracted_fields: extractedFields,
        file_name: extractionData.pdf_filename,
        extraction_method: extractionData.extraction_method || "Automático",
        dealership: extractionData.dealership_code,
        pdf_extraction_id: vehicleData.pdf_extraction_id,
      }

      setPdfData(pdfDataObj)
      setEditedData({ ...extractedFields })
    } catch (err) {
      console.error("Error al cargar datos del PDF:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!pdfData?.pdf_extraction_id) {
      toast.error("No se puede guardar: ID de extracción no encontrado")
      return
    }

    setSaving(true)
    try {
      console.log("🔄 Iniciando guardado de datos editados...")
      console.log("📝 Datos editados:", editedData)

      // Actualizar pdf_extracted_data (SIN updated_at)
      const updateData = {
        banco: editedData.BANCO || null,
        comercial: editedData.Comercial || null,
        total: editedData.TOTAL
          ? Number.parseFloat(
              editedData.TOTAL.toString()
                .replace(/[^\d.,-]/g, "")
                .replace(",", "."),
            )
          : null,
        matricula: editedData["Nº DE MATRÍCULA"] || null,
        provincia: editedData.PROVINCIA || null,
        codigo_postal: editedData["C.P."] || null,
        ciudad: editedData.CIUDAD || null,
        email: editedData.EMAIL || null,
        telefono: editedData["TFNO. PARTICULAR"] || null,
        dni_nif: editedData["D.N.I. Ó N.I.F."] || null,
        domicilio: editedData.DOMICILIO || null,
        portal_origen: editedData["PORTAL ORIGEN"] || null,
        nombre_cliente: editedData["NOMBRE Y APELLIDOS O EMPRESA"] || null,
        fecha_pedido: parseDate(editedData["FECHA DE PEDIDO"]), // ✅ CONVERTIR FECHA
        numero_bastidor: editedData["Nº BASTIDOR"] || null,
        modelo: editedData.MODELO || null,
        descuento: editedData.DESCUENTO
          ? Number.parseFloat(
              editedData.DESCUENTO.toString()
                .replace(/[^\d.,-]/g, "")
                .replace(",", "."),
            )
          : null,
        numero_pedido: editedData["Nº PEDIDO"] || null,
        marca: editedData.MARCA || null,
        color: editedData.COLOR || null,
        kilometros: editedData.KILÓMETROS
          ? Number.parseInt(editedData.KILÓMETROS.toString().replace(/[^\d]/g, ""))
          : null,
        primera_fecha_matriculacion: parseDate(editedData["PRIMERA FECHA MATRICULACIÓN"]), // ✅ CONVERTIR FECHA
        dealership_code: editedData.dealership_code || editedData["dealership_code"] || "MM",
      }

      console.log("💾 Actualizando pdf_extracted_data con:", updateData)

      // Actualizar sales_vehicles con los nuevos datos
      const salesUpdateData = {
        client_name: editedData["NOMBRE Y APELLIDOS O EMPRESA"] || null,
        client_dni: editedData["D.N.I. Ó N.I.F."] || null,
        client_email: editedData.EMAIL || null,
        client_phone: editedData["TFNO. PARTICULAR"] || null,
        client_address: editedData.DOMICILIO || null,
        client_city: editedData.CIUDAD || null,
        client_province: editedData.PROVINCIA || null,
        client_postal_code: editedData["C.P."] || null,
        vin: editedData["Nº BASTIDOR"] || null,
        model: editedData.MODELO ? editedData.MODELO.replace(/^(BMW|MINI)\s+/i, "").trim() : null,
        brand: editedData.MARCA || null,
        color: editedData.COLOR || null,
        mileage: editedData.KILÓMETROS ? Number.parseInt(editedData.KILÓMETROS.toString().replace(/[^\d]/g, "")) : null,
        registration_date: parseDate(editedData["PRIMERA FECHA MATRICULACIÓN"]),
        bank: editedData.BANCO || null,
        origin_portal: editedData["PORTAL ORIGEN"] || null,
        price: editedData.TOTAL
          ? Number.parseFloat(
              editedData.TOTAL.toString()
                .replace(/[^\d.,-]/g, "")
                .replace(",", "."),
            )
          : null,
        order_number: editedData["Nº PEDIDO"] || null,
        order_date: parseDate(editedData["FECHA DE PEDIDO"]),
        discount: editedData.DESCUENTO || null,
        dealership_code: editedData.dealership_code || editedData["dealership_code"] || "MM",
        updated_at: new Date().toISOString(),
      }

      console.log("🚗 Actualizando sales_vehicles con:", salesUpdateData)

      // Actualizar via API Route
      const response = await fetch("/api/sales/update-pdf-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfExtractionId: pdfData.pdf_extraction_id,
          pdfData: updateData,
          vehicleId,
          salesData: salesUpdateData,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Error actualizando datos")
      }

      console.log("✅ Datos actualizados correctamente via API Route")

      // Actualizar el estado local
      setPdfData({
        ...pdfData,
        extracted_fields: { ...editedData },
        extractedFields: { ...editedData },
        dealership: editedData.dealership_code,
      })

      setIsEditing(false)
      toast.success("✅ Datos guardados correctamente")
    } catch (err) {
      console.error("❌ Error guardando datos:", err)
      toast.error(err instanceof Error ? err.message : "Error guardando datos")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedData({ ...pdfData.extracted_fields })
    setIsEditing(false)
  }

  useEffect(() => {
    if (open) {
      loadPdfData()
    }
  }, [open])

  const categorizedFields = () => {
    if (!pdfData?.extracted_fields) return {}

    return Object.entries(fieldDisplayConfig).reduce(
      (acc, [key, config]) => {
        const category = config.category
        if (!acc[category]) acc[category] = []

        const value = isEditing ? editedData[key] : pdfData.extracted_fields[key]
        acc[category].push({
          key,
          label: config.label,
          icon: config.icon,
          value: String(value === undefined || value === null ? "" : value),
          editable: config.editable,
          type: config.type || "input",
        })
        return acc
      },
      {} as Record<
        string,
        { key: string; label: string; icon: React.ElementType; value: string; editable: boolean; type: string }[]
      >,
    )
  }

  const renderField = (field: {
    key: string
    label: string
    icon: React.ElementType
    value: string
    editable: boolean
    type: string
  }) => (
    <div key={field.key} className="mb-1.5">
      <Label className="flex items-center text-[11px] font-medium text-muted-foreground mb-0.5">
        <field.icon className="mr-1.5 h-3 w-3 text-muted-foreground" />
        {field.label}
      </Label>
      {isEditing && field.editable ? (
        field.type === "select" && field.key === "dealership_code" ? (
          <Select
            value={editedData[field.key] || editedData.dealership_code || "MM"}
            onValueChange={(value) =>
              setEditedData({
                ...editedData,
                [field.key]: value,
                dealership_code: value,
              })
            }
          >
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="Seleccionar concesionario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="QM">Quadis Munich (QM)</SelectItem>
              <SelectItem value="MM">Motor Munich (MM)</SelectItem>
              <SelectItem value="MMC">Motor Munich Cadí (MMC)</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={editedData[field.key] || ""}
            onChange={(e) => setEditedData({ ...editedData, [field.key]: e.target.value })}
            className="text-xs h-8"
            placeholder={field.type === "date" ? "DD/MM/AAAA" : `Ingrese ${field.label.toLowerCase()}`}
          />
        )
      ) : (
        <p
          className={cn(
            "text-xs p-1.5 rounded-md border min-h-[32px] flex items-center break-all",
            field.value && field.value.trim() !== ""
              ? "text-foreground bg-background border-border"
              : "text-red-400 bg-red-950/20 border-red-800 font-semibold italic",
          )}
        >
          {field.value && field.value.trim() !== ""
            ? field.key === "dealership_code"
              ? getDealershipName(field.value)
              : field.value
            : "⚠️ N/A - Campo vacío"}
        </p>
      )}
    </div>
  )

  const fieldsWithData = pdfData?.extracted_fields
    ? Object.values(pdfData.extracted_fields).filter((value) => value && String(value).trim() !== "").length
    : 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30">
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Datos del PDF - {licensePlate}
                {isEditing && <span className="text-orange-500">(Editando)</span>}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Editando información extraída del pedido PDF para este vehículo"
                  : "Información extraída del pedido PDF para este vehículo"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                    Guardar
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Cargando datos del PDF...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-6 w-6 mr-2" />
            <span>{error}</span>
          </div>
        ) : pdfData ? (
          <div className="space-y-4">
            {/* Información del archivo y estadísticas */}
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="font-semibold">Archivo:</span>
                  <p className="truncate" title={pdfData.file_name}>
                    {pdfData.file_name || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold">Método:</span>
                  <p>{pdfData.extraction_method || "N/A"}</p>
                </div>
                <div>
                  <span className="font-semibold">Campos:</span>
                  <p>
                    {fieldsWithData}/{Object.keys(fieldDisplayConfig).length}
                  </p>
                </div>
                <div>
                  <span className="font-semibold">Fecha:</span>
                  <p>{pdfData.createdAt ? new Date(pdfData.createdAt).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Campos extraídos */}
            <div className="p-2 rounded-md bg-background border border-border">
              {Object.entries(categorizedFields()).map(([categoryKey, fields]) => (
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
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <FileText className="h-6 w-6 mr-2" />
            <span>No hay datos de PDF disponibles</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
