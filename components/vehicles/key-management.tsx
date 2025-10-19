"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
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
import { Key, AlertTriangle, Clock, CheckCircle2, User, ArrowRight } from "lucide-react"
import { autoResolveIncident } from "@/lib/auto-resolve-incidents"

// Esquema de validación para el formulario de movimiento de llaves
const keyMovementSchema = z.object({
  keyType: z.string({
    required_error: "Selecciona el tipo de llave",
  }),
  toUserId: z.string({
    required_error: "Selecciona el destinatario",
  }),
  reason: z.string().min(3, {
    message: "La razón debe tener al menos 3 caracteres",
  }),
})

type KeyMovementFormValues = z.infer<typeof keyMovementSchema>

interface VehicleKeyManagementProps {
  vehicleId: string
  vehicle: any
}

// Exportación nombrada para mantener compatibilidad con el código existente
export function VehicleKeyManagement({ vehicleId, vehicle }: VehicleKeyManagementProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [keyData, setKeyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedKeyType, setSelectedKeyType] = useState<string | null>(null)

  // Configurar el formulario
  const form = useForm<KeyMovementFormValues>({
    resolver: zodResolver(keyMovementSchema),
    defaultValues: {
      keyType: "",
      toUserId: "",
      reason: "",
    },
  })

  // Cargar datos de las llaves
  useEffect(() => {
    const fetchKeyData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Verificar si ya existe un registro para este vehículo
        const { data: existingKeys, error: keysError } = await supabase
          .from("vehicle_keys")
          .select("*")
          .eq("vehicle_id", vehicleId)
          .maybeSingle()

        if (keysError && keysError.code !== "PGRST116") {
          // PGRST116 es el código para "no se encontraron resultados"
          throw new Error(`Error al cargar datos de llaves: ${keysError.message}`)
        }

        if (existingKeys) {
          setKeyData(existingKeys)
        } else {
          // Si no existe, creamos un nuevo registro
          const licencePlate = vehicle.license_plate || ""

          // Crear cliente fresco para evitar zombie client
          const supabase = createClientComponentClient()
          const { data: newKeyData, error: createError } = await supabase
            .from("vehicle_keys")
            .insert({
              vehicle_id: vehicleId,
              license_plate: licencePlate,
              first_key_status: "En concesionario",
              second_key_status: "En concesionario",
              card_key_status: "En concesionario",
            })
            .select()
            .single()

          if (createError) {
            throw new Error(`Error al crear registro de llaves: ${createError.message}`)
          }

          // Recargar los datos para obtener el registro completo
          const { data: createdKeys, error: fetchError } = await supabase
            .from("vehicle_keys")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .single()

          if (fetchError) {
            throw new Error(`Error al cargar datos de llaves: ${fetchError.message}`)
          }

          setKeyData(createdKeys)
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
        setError(err.message || "Error al cargar datos de llaves")
      } finally {
        setLoading(false)
      }
    }

    if (vehicleId) {
      fetchKeyData()
    }
  }, [vehicleId, supabase, vehicle])

  // Función para obtener el nombre del usuario por ID
  const getUserName = (userId: string | null) => {
    if (!userId) return "No asignado"
    const user = users.find((u) => u.id === userId)
    return user ? user.full_name : "Usuario desconocido"
  }

  // Función para manejar el envío del formulario
  const onSubmit = async (data: KeyMovementFormValues) => {
    setIsSubmitting(true)

    try {
      // Verificar que tenemos los datos necesarios
      if (!keyData || !vehicleId) {
        throw new Error("Faltan datos necesarios para registrar el movimiento")
      }

      // Calcular la fecha límite para la confirmación (24 horas)
      const confirmationDeadline = new Date()
      confirmationDeadline.setHours(confirmationDeadline.getHours() + 24)

      // Registrar el movimiento en la tabla key_movements (supabase ya creado arriba)
      const { error: movementError } = await supabase.from("key_movements").insert({
        vehicle_id: vehicleId,
        key_type: data.keyType,
        from_user_id: null, // Desde el concesionario (null)
        to_user_id: data.toUserId,
        reason: data.reason,
        confirmation_deadline: confirmationDeadline.toISOString(),
      })

      if (movementError) {
        throw new Error(`Error al registrar movimiento: ${movementError.message}`)
      }

      // Actualizar el estado de la llave en vehicle_keys
      const updateData: Record<string, any> = {
        [`${data.keyType}_status`]: "Entregada",
        [`${data.keyType}_holder`]: data.toUserId,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase.from("vehicle_keys").update(updateData).eq("vehicle_id", vehicleId)

      if (updateError) {
        throw new Error(`Error al actualizar estado de llave: ${updateError.message}`)
      }

      // Resolver automáticamente las incidencias relacionadas
      const resolveResult = await autoResolveIncident(vehicleId, data.keyType as any, data.toUserId, data.reason)

      if (resolveResult.success && resolveResult.resolvedCount && resolveResult.resolvedCount > 0) {
        toast.success(`Movimiento registrado y ${resolveResult.resolvedCount} incidencias resueltas automáticamente`)
      } else {
        toast.success("Movimiento de llave registrado correctamente")
      }

      // Actualizar la UI
      setKeyData({
        ...keyData,
        ...updateData,
      })

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

  // Función para abrir el diálogo con un tipo de llave preseleccionado
  const handleOpenDialog = (keyType: string) => {
    setSelectedKeyType(keyType)
    form.setValue("keyType", keyType)
    setOpenDialog(true)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <BMWMSpinner size="md" />
        <p className="mt-4 text-muted-foreground">Cargando información de llaves...</p>
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

  // Mapeo de tipos de llave a nombres legibles
  const keyTypeNames: Record<string, string> = {
    first_key: "Primera llave",
    second_key: "Segunda llave",
    card_key: "Card Key",
  }

  // Función para obtener el color según el estado
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "en concesionario":
        return "bg-green-100 text-green-600"
      case "entregada":
        return "bg-amber-100 text-amber-600"
      case "perdida":
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
      case "entregada":
        return <User className="h-5 w-5" />
      case "perdida":
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Primera llave */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Key className="mr-2 h-5 w-5" />
              Primera llave
            </CardTitle>
            <CardDescription>Llave principal del vehículo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getStatusColor(
                  keyData?.first_key_status || "En concesionario",
                )}`}
              >
                {getStatusIcon(keyData?.first_key_status || "En concesionario")}
              </div>
              <div>
                <p className="font-medium">{keyData?.first_key_status || "En concesionario"}</p>
                <p className="text-sm text-muted-foreground">
                  {keyData?.first_key_holder ? `Asignada a: ${getUserName(keyData.first_key_holder)}` : "No asignada"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOpenDialog("first_key")}
              disabled={keyData?.first_key_status === "Perdida"}
            >
              {keyData?.first_key_status === "En concesionario" ? "Entregar llave" : "Cambiar asignación"}
            </Button>
          </CardFooter>
        </Card>

        {/* Segunda llave */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Key className="mr-2 h-5 w-5" />
              Segunda llave
            </CardTitle>
            <CardDescription>Llave de repuesto del vehículo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getStatusColor(
                  keyData?.second_key_status || "En concesionario",
                )}`}
              >
                {getStatusIcon(keyData?.second_key_status || "En concesionario")}
              </div>
              <div>
                <p className="font-medium">{keyData?.second_key_status || "En concesionario"}</p>
                <p className="text-sm text-muted-foreground">
                  {keyData?.second_key_holder ? `Asignada a: ${getUserName(keyData.second_key_holder)}` : "No asignada"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOpenDialog("second_key")}
              disabled={keyData?.second_key_status === "Perdida"}
            >
              {keyData?.second_key_status === "En concesionario" ? "Entregar llave" : "Cambiar asignación"}
            </Button>
          </CardFooter>
        </Card>

        {/* Card Key */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Key className="mr-2 h-5 w-5" />
              Card Key
            </CardTitle>
            <CardDescription>Tarjeta digital del vehículo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getStatusColor(
                  keyData?.card_key_status || "En concesionario",
                )}`}
              >
                {getStatusIcon(keyData?.card_key_status || "En concesionario")}
              </div>
              <div>
                <p className="font-medium">{keyData?.card_key_status || "En concesionario"}</p>
                <p className="text-sm text-muted-foreground">
                  {keyData?.card_key_holder ? `Asignada a: ${getUserName(keyData.card_key_holder)}` : "No asignada"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOpenDialog("card_key")}
              disabled={keyData?.card_key_status === "Perdida"}
            >
              {keyData?.card_key_status === "En concesionario" ? "Entregar llave" : "Cambiar asignación"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Diálogo para registrar movimiento de llave */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar movimiento de llave</DialogTitle>
            <DialogDescription>
              Registra la entrega de la {selectedKeyType ? keyTypeNames[selectedKeyType] : "llave"} a un usuario.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="keyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de llave</FormLabel>
                    <Select disabled={!!selectedKeyType} onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de llave" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="first_key">Primera llave</SelectItem>
                        <SelectItem value="second_key">Segunda llave</SelectItem>
                        <SelectItem value="card_key">Card Key</SelectItem>
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
                    <FormDescription>Persona que recibirá la llave</FormDescription>
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

// Exportación predeterminada que reutiliza el componente VehicleKeyManagement
export default function KeyManagement(props: VehicleKeyManagementProps) {
  return <VehicleKeyManagement {...props} />
}
