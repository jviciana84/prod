"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { FileText, AlertTriangle, Clock, CheckCircle2, User, ArrowRight } from "lucide-react"
import { autoResolveIncident } from "@/lib/auto-resolve-incidents"

// Esquema de validación para el formulario de movimiento de documentos
const documentMovementSchema = z.object({
  documentType: z.string({
    required_error: "Selecciona el tipo de documento",
  }),
  toUserId: z.string({
    required_error: "Selecciona el destinatario",
  }),
  reason: z.string().min(3, {
    message: "La razón debe tener al menos 3 caracteres",
  }),
})

type DocumentMovementFormValues = z.infer<typeof documentMovementSchema>

interface VehicleDocumentManagementProps {
  vehicleId: string
  vehicle: any
}

// Exportación nombrada para mantener compatibilidad con el código existente
export function VehicleDocumentManagement({ vehicleId, vehicle }: VehicleDocumentManagementProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [documentData, setDocumentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null)

  // Configurar el formulario
  const form = useForm<DocumentMovementFormValues>({
    resolver: zodResolver(documentMovementSchema),
    defaultValues: {
      documentType: "",
      toUserId: "",
      reason: "",
    },
  })

  // Cargar datos de los documentos
  useEffect(() => {
    const fetchDocumentData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Verificar si ya existe un registro para este vehículo
        const { data: existingDocs, error: docsError } = await supabase
          .from("vehicle_documents")
          .select("*")
          .eq("vehicle_id", vehicleId)
          .maybeSingle()

        if (docsError && docsError.code !== "PGRST116") {
          // PGRST116 es el código para "no se encontraron resultados"
          throw new Error(`Error al cargar datos de documentos: ${docsError.message}`)
        }

        if (existingDocs) {
          setDocumentData(existingDocs)
        } else {
          // Si no existe, creamos un nuevo registro
          const licencePlate = vehicle.license_plate || ""

          const { data: newDocData, error: createError } = await supabase
            .from("vehicle_documents")
            .insert({
              vehicle_id: vehicleId,
              license_plate: licencePlate,
              technical_sheet_status: "En concesionario",
            })
            .select()
            .single()

          if (createError) {
            throw new Error(`Error al crear registro de documentos: ${createError.message}`)
          }

          // Recargar los datos para obtener el registro completo
          const { data: createdDocs, error: fetchError } = await supabase
            .from("vehicle_documents")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .single()

          if (fetchError) {
            throw new Error(`Error al cargar datos de documentos: ${fetchError.message}`)
          }

          setDocumentData(createdDocs)
        }

        // Cargar usuarios para el selector
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("id, full_name, alias")
          .order("full_name")

        if (userError) {
          throw new Error(`Error al cargar usuarios: ${userError.message}`)
        }

        setUsers(userData || [])
      } catch (err: any) {
        console.error("Error:", err)
        setError(err.message || "Error al cargar datos de documentos")
      } finally {
        setLoading(false)
      }
    }

    if (vehicleId) {
      fetchDocumentData()
    }
  }, [vehicleId, supabase, vehicle])

  // Función para obtener el nombre del usuario por ID
  const getUserName = (userId: string | null) => {
    if (!userId) return "No asignado"
    const user = users.find((u) => u.id === userId)
    return user ? user.full_name : "Usuario desconocido"
  }

  // Función para manejar el envío del formulario
  const onSubmit = async (data: DocumentMovementFormValues) => {
    setIsSubmitting(true)

    try {
      // Verificar que tenemos los datos necesarios
      if (!documentData || !vehicleId) {
        throw new Error("Faltan datos necesarios para registrar el movimiento")
      }

      // Calcular la fecha límite para la confirmación (24 horas)
      const confirmationDeadline = new Date()
      confirmationDeadline.setHours(confirmationDeadline.getHours() + 24)

      // Registrar el movimiento en la tabla document_movements
      const { error: movementError } = await supabase.from("document_movements").insert({
        vehicle_id: vehicleId,
        document_type: data.documentType,
        from_user_id: null, // Desde el concesionario (null)
        to_user_id: data.toUserId,
        reason: data.reason,
        confirmation_deadline: confirmationDeadline.toISOString(),
      })

      if (movementError) {
        throw new Error(`Error al registrar movimiento: ${movementError.message}`)
      }

      // Actualizar el estado del documento en vehicle_documents
      const updateData: Record<string, any> = {
        [`${data.documentType}_status`]: "Entregado",
        [`${data.documentType}_holder`]: data.toUserId,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from("vehicle_documents")
        .update(updateData)
        .eq("vehicle_id", vehicleId)

      if (updateError) {
        throw new Error(`Error al actualizar estado de documento: ${updateError.message}`)
      }

      // Actualizar la UI
      setDocumentData({
        ...documentData,
        ...updateData,
      })

      // Resolver automáticamente las incidencias relacionadas
      const resolveResult = await autoResolveIncident(vehicleId, data.documentType as any, data.toUserId, data.reason)

      if (resolveResult.success && resolveResult.resolvedCount && resolveResult.resolvedCount > 0) {
        toast.success(`Movimiento registrado y ${resolveResult.resolvedCount} incidencias resueltas automáticamente`)
      } else {
        toast.success("Movimiento de documento registrado correctamente")
      }

      form.reset()
      setOpenDialog(false)

      // Recargar los datos
      router.refresh()
    } catch (err: any) {
      console.error("Error al registrar movimiento:", err)
      toast.error(err.message || "Error al registrar movimiento")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para abrir el diálogo con un tipo de documento preseleccionado
  const handleOpenDialog = (documentType: string) => {
    setSelectedDocumentType(documentType)
    form.setValue("documentType", documentType)
    setOpenDialog(true)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <BMWMSpinner size="md" />
        <p className="mt-4 text-muted-foreground">Cargando información de documentos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // Mapeo de tipos de documento a nombres legibles
  const documentTypeNames: Record<string, string> = {
    technical_sheet: "Ficha técnica",
  }

  // Función para obtener el color según el estado
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "en concesionario":
        return "bg-green-100 text-green-600"
      case "entregado":
        return "bg-amber-100 text-amber-600"
      case "perdido":
        return "bg-red-100 text-red-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  // Función para obtener el icono según el estado
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "en concesionario":
        return <CheckCircle2 className="h-5 w-5" />
      case "entregado":
        return <User className="h-5 w-5" />
      case "perdido":
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        {/* Ficha técnica */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Ficha técnica
            </CardTitle>
            <CardDescription>Documentación técnica oficial del vehículo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getStatusColor(
                  documentData?.technical_sheet_status || "En concesionario",
                )}`}
              >
                {getStatusIcon(documentData?.technical_sheet_status || "En concesionario")}
              </div>
              <div>
                <p className="font-medium">{documentData?.technical_sheet_status || "En concesionario"}</p>
                <p className="text-sm text-muted-foreground">
                  {documentData?.technical_sheet_holder
                    ? `Asignada a: ${getUserName(documentData.technical_sheet_holder)}`
                    : "No asignada"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOpenDialog("technical_sheet")}
              disabled={documentData?.technical_sheet_status === "Perdido"}
            >
              {documentData?.technical_sheet_status === "En concesionario"
                ? "Entregar documento"
                : "Cambiar asignación"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Diálogo para registrar movimiento de documento */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar movimiento de documento</DialogTitle>
            <DialogDescription>
              Registra la entrega de {selectedDocumentType ? documentTypeNames[selectedDocumentType] : "documento"} a un
              usuario.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de documento</FormLabel>
                    <Select disabled={!!selectedDocumentType} onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de documento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="technical_sheet">Ficha técnica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entregar a</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el destinatario" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Persona que recibirá el documento</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Indica el motivo de la entrega" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <BMWMSpinner size="sm" className="mr-2" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      Registrar entrega
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Exportación predeterminada que reutiliza el componente VehicleDocumentManagement
export default function DocumentManagement(props: VehicleDocumentManagementProps) {
  return <VehicleDocumentManagement {...props} />
}
