"use client"

import { useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"
import { Check, ChevronsUpDown, AlertTriangle, X, Plus, Send } from "lucide-react"
import { cn } from "@/lib/utils"

// Importar la función de resolución automática de forma segura
let autoResolveIncident: any = null
try {
  const autoResolveModule = require("@/lib/auto-resolve-incidents")
  autoResolveIncident = autoResolveModule.autoResolveIncident
} catch (error) {
  console.warn("No se pudo cargar el módulo de resolución automática:", error)
}

// Esquema de validación para el formulario
const formSchema = z.object({
  license_plate: z.string().min(1, "La matrícula es obligatoria"),
  from_user_id: z.string().min(1, "El usuario que entrega es obligatorio"),
  item_type: z.string().min(1, "El tipo de elemento es obligatorio"),
  to_user_id: z.string().min(1, "El usuario que recibe es obligatorio"),
  reason: z.string().optional(),
})

// Tipos de elementos que se pueden entregar
const ITEM_TYPES = [
  { value: "first_key", label: "1. Primera llave", searchKey: "1", icon: "key-blue" },
  { value: "second_key", label: "2. Segunda llave", searchKey: "2", icon: "key-orange" },
  { value: "card_key", label: "3. Card Key", searchKey: "3", icon: "card-purple" },
  { value: "technical_sheet", label: "4. Ficha técnica", searchKey: "4", icon: "file-green" },
  { value: "circulation_permit", label: "5. Permiso de circulación", searchKey: "5", icon: "file-teal" },
]

// Usuarios especiales del sistema
const SPECIAL_USERS = [
  { id: "comerciales", full_name: "COMERCIALES" },
  { id: "taller", full_name: "TALLER" },
  { id: "limpieza", full_name: "LIMPIEZA" },
  { id: "custodia", full_name: "CUSTODIA" },
]

interface KeyManagementFormProps {
  onMovementRegistered?: () => void
}

export function KeyManagementForm({ onMovementRegistered }: KeyManagementFormProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [vehicles, setVehicles] = useState<any[]>([])
  const [validLicensePlates, setValidLicensePlates] = useState<string[]>([])
  const [licensePlateToVehicleId, setLicensePlateToVehicleId] = useState<Record<string, string>>({})
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingEntries, setPendingEntries] = useState<any[]>([])
  const [openLicensePlate, setOpenLicensePlate] = useState(false)
  const [openFromUser, setOpenFromUser] = useState(false)
  const [openItemType, setOpenItemType] = useState(false)
  const [openToUser, setOpenToUser] = useState(false)
  const [licenseError, setLicenseError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Referencias para navegación con teclado
  const licenseInputRef = useRef<HTMLInputElement>(null)
  const fromUserInputRef = useRef<HTMLButtonElement>(null)
  const itemTypeInputRef = useRef<HTMLButtonElement>(null)
  const toUserInputRef = useRef<HTMLButtonElement>(null)
  const reasonInputRef = useRef<HTMLInputElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  // Configurar el formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      license_plate: "",
      from_user_id: "",
      item_type: "",
      to_user_id: "",
      reason: "",
    },
  })

  // Función para verificar matrícula
  const verifyLicensePlate = (licensePlate: string) => {
    if (!licensePlate) {
      setLicenseError(null)
      return false
    }

    const upperLicense = licensePlate.toUpperCase()
    const isValid = validLicensePlates.includes(upperLicense)

    if (!isValid) {
      setLicenseError("La matrícula no existe en el sistema")
      return false
    } else {
      setLicenseError(null)
      return true
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true)
      setError(null)

      try {
        // Cargar usuarios con email
        const { data: usersData, error: usersError } = await supabase
          .from("profiles")
          .select("id, full_name, alias, email")
          .order("full_name")

        if (usersError) {
          console.error("Error cargando usuarios:", usersError)
          // Continuar sin fallar
        }

        // Cargar vehículos de nuevas_entradas con ID y matrícula
        const { data: nuevasEntradasData, error: nuevasEntradasError } = await supabase
          .from("nuevas_entradas")
          .select("id, license_plate")

        if (nuevasEntradasError) {
          console.error("Error cargando nuevas_entradas:", nuevasEntradasError)
          // Continuar sin fallar
        }

        // Cargar vehículos de sales_vehicles con ID y matrícula
        const { data: salesVehiclesData, error: salesVehiclesError } = await supabase
          .from("sales_vehicles")
          .select("id, license_plate")

        if (salesVehiclesError) {
          console.error("Error cargando sales_vehicles:", salesVehiclesError)
          // Continuar sin fallar
        }

        // Cargar vehículos de entregas con matrícula
        const { data: entregasData, error: entregasError } = await supabase.from("entregas").select("id, matricula")

        if (entregasError) {
          console.error("Error cargando entregas:", entregasError)
          // Continuar sin fallar
        }

        // Combinar todas las matrículas válidas y crear mapeo de matrícula a ID
        const licensePlateMap: Record<string, string> = {}
        const allVehicles: any[] = []

        // Procesar nuevas_entradas
        if (nuevasEntradasData) {
          nuevasEntradasData.forEach((vehicle) => {
            if (vehicle.license_plate) {
              const upperPlate = vehicle.license_plate.toUpperCase()
              licensePlateMap[upperPlate] = vehicle.id
              allVehicles.push(vehicle)
            }
          })
        }

        // Procesar sales_vehicles
        if (salesVehiclesData) {
          salesVehiclesData.forEach((vehicle) => {
            if (vehicle.license_plate) {
              const upperPlate = vehicle.license_plate.toUpperCase()
              licensePlateMap[upperPlate] = vehicle.id
              allVehicles.push(vehicle)
            }
          })
        }

        // Procesar entregas (usar matrícula como ID si no existe en otros)
        if (entregasData) {
          entregasData.forEach((entrega) => {
            if (entrega.matricula) {
              const upperPlate = entrega.matricula.toUpperCase()
              if (!licensePlateMap[upperPlate]) {
                licensePlateMap[upperPlate] = entrega.matricula
                allVehicles.push({ id: entrega.matricula, license_plate: entrega.matricula })
              }
            }
          })
        }

        const validPlates = Object.keys(licensePlateMap)
        setValidLicensePlates(validPlates)
        setLicensePlateToVehicleId(licensePlateMap)
        setVehicles(allVehicles)

        console.log(`✅ Matrículas cargadas: ${validPlates.length}`)

        // Combinar usuarios regulares con usuarios especiales
        const allUsers = [...(usersData || []), ...SPECIAL_USERS]
        setUsers(allUsers)

        console.log(`✅ Usuarios cargados: ${allUsers.length}`)

        // Cargar usuario actual usando la sesión de auth
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Buscar el perfil usando el ID del usuario autenticado
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()

          if (profileError) {
            console.error("Error cargando perfil:", profileError)
          } else if (profile) {
            setCurrentUser(profile)

            // Verificar si es admin
            const userIsAdmin =
              profile.role === "admin" || profile.role === "administrador" || user.email === "viciana84@gmail.com"

            setIsAdmin(userIsAdmin)

            // Si no es admin, establecer el usuario actual como el que entrega
            if (!userIsAdmin) {
              form.setValue("from_user_id", profile.id)
            }
          }
        }
      } catch (err: any) {
        console.error("Error loading data:", err)
        setError(err.message || "Error al cargar datos iniciales")
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [supabase, form])

  // Función para añadir una entrada pendiente
  const addPendingEntry = () => {
    const values = form.getValues()

    // Validar el formulario
    if (!values.license_plate || !values.from_user_id || !values.item_type || !values.to_user_id) {
      toast.error("Por favor, completa todos los campos obligatorios")
      return
    }

    // Verificar matrícula antes de añadir
    if (!verifyLicensePlate(values.license_plate)) {
      toast.error("La matrícula no es válida")
      return
    }

    // Obtener nombres para mostrar
    const vehicleLabel = values.license_plate
    const fromUserLabel = users.find((u) => u.id === values.from_user_id)?.full_name || values.from_user_id
    const itemTypeLabel = ITEM_TYPES.find((i) => i.value === values.item_type)?.label || values.item_type
    const toUserLabel = users.find((u) => u.id === values.to_user_id)?.full_name || values.to_user_id

    // Añadir a pendientes
    const newEntry = {
      ...values,
      vehicleLabel,
      fromUserLabel,
      itemTypeLabel,
      toUserLabel,
      id: Date.now().toString(),
    }

    setPendingEntries([...pendingEntries, newEntry])

    // Limpiar el formulario excepto la matrícula
    form.setValue("from_user_id", "")
    form.setValue("item_type", "")
    form.setValue("to_user_id", "")
    form.setValue("reason", "")

    // Si no es admin, establecer automáticamente el usuario actual
    if (!isAdmin && currentUser) {
      form.setValue("from_user_id", currentUser.id)
    }

    // Enfocar la matrícula para el siguiente registro
    setTimeout(() => {
      licenseInputRef.current?.focus()
    }, 100)
  }

  // Función para eliminar una entrada pendiente
  const removePendingEntry = (id: string) => {
    setPendingEntries(pendingEntries.filter((entry) => entry.id !== id))
  }

  // Función para obtener el ID del vehículo a partir de la matrícula
  const getVehicleIdFromLicensePlate = (licensePlate: string): string | null => {
    const upperLicense = licensePlate.toUpperCase()
    return licensePlateToVehicleId[upperLicense] || null
  }

  // Función para intentar resolver incidencias automáticamente
  const tryAutoResolveIncident = async (entry: any) => {
    if (!autoResolveIncident) {
      console.log("⚠️ Función de resolución automática no disponible")
      return
    }

    try {
      console.log(`🔄 Intentando resolver incidencias para ${entry.item_type}...`)
      const resolveResult = await autoResolveIncident(
        entry.license_plate,
        entry.item_type,
        entry.to_user_id,
        entry.reason || "Entrega registrada automáticamente",
      )

      if (resolveResult.success && resolveResult.resolvedCount > 0) {
        console.log(`✅ Resueltas ${resolveResult.resolvedCount} incidencias automáticamente`)
        toast.success(`🎉 Se resolvieron ${resolveResult.resolvedCount} incidencias automáticamente`)
      } else if (resolveResult.success) {
        console.log("ℹ️ No había incidencias pendientes de este tipo")
      } else {
        console.log("⚠️ Error en resolución automática:", resolveResult.error)
      }
    } catch (resolveError) {
      console.error("💥 Error inesperado en resolución automática:", resolveError)
      // No fallar el proceso principal por esto
    }
  }

  // Función para enviar todas las entradas pendientes
  const submitPendingEntries = async () => {
    if (pendingEntries.length === 0) {
      toast.error("No hay entradas pendientes para enviar")
      return
    }

    setSubmitting(true)

    try {
      // Procesar cada entrada pendiente
      for (const entry of pendingEntries) {
        console.log("Procesando entrada:", entry)
        console.log("Tipo de elemento:", entry.item_type)

        // Obtener el ID del vehículo a partir de la matrícula
        const vehicleId = getVehicleIdFromLicensePlate(entry.license_plate)
        if (!vehicleId) {
          throw new Error(`No se pudo encontrar el ID del vehículo para la matrícula ${entry.license_plate}`)
        }

        // Determinar si es un movimiento de llave o documento
        const isKeyMovement = ["first_key", "second_key", "card_key"].includes(entry.item_type)

        // Calcular la fecha límite para la confirmación (24 horas)
        const confirmationDeadline = new Date()
        confirmationDeadline.setHours(confirmationDeadline.getHours() + 24)

        if (isKeyMovement) {
          // Registrar el movimiento en la tabla key_movements
          const isFromSpecialUser = SPECIAL_USERS.some((su) => su.id === entry.from_user_id)
          const from_user_id_to_insert = isFromSpecialUser ? null : entry.from_user_id

          const isToSpecialUser = SPECIAL_USERS.some((su) => su.id === entry.to_user_id)
          const to_user_id_to_insert = isToSpecialUser ? null : entry.to_user_id

          const movementData = {
            vehicle_id: vehicleId,
            key_type: entry.item_type,
            from_user_id: from_user_id_to_insert,
            to_user_id: to_user_id_to_insert,
            reason: entry.reason || "",
            confirmation_deadline: confirmationDeadline.toISOString(),
          }

          const { error: movementError } = await supabase.from("key_movements").insert(movementData)

          if (movementError) {
            throw new Error(`Error al registrar movimiento: ${movementError.message}`)
          }

          // Actualizar o crear registro en vehicle_keys
          try {
            const { data: existingKey } = await supabase
              .from("vehicle_keys")
              .select("id")
              .eq("license_plate", entry.license_plate.toUpperCase())
              .maybeSingle()

            const isToSpecialUserForKey = SPECIAL_USERS.some((su) => su.id === entry.to_user_id)
            const toHolderId = isToSpecialUserForKey ? null : entry.to_user_id

            const keyUpdateData: Record<string, any> = {
              [`${entry.item_type}_status`]: "Entregada",
              [`${entry.item_type}_holder`]: toHolderId,
              updated_at: new Date().toISOString(),
            }

            if (existingKey) {
              await supabase
                .from("vehicle_keys")
                .update(keyUpdateData)
                .eq("license_plate", entry.license_plate.toUpperCase())
            } else {
              const newKeyData: Record<string, any> = {
                vehicle_id: vehicleId,
                license_plate: entry.license_plate.toUpperCase(),
                first_key_status: entry.item_type === "first_key" ? "Entregada" : "En concesionario",
                second_key_status: entry.item_type === "second_key" ? "Entregada" : "En concesionario",
                card_key_status: entry.item_type === "card_key" ? "Entregada" : "En concesionario",
              }

              if (entry.item_type === "first_key") newKeyData.first_key_holder = toHolderId
              if (entry.item_type === "second_key") newKeyData.second_key_holder = toHolderId
              if (entry.item_type === "card_key") newKeyData.card_key_holder = toHolderId

              await supabase.from("vehicle_keys").insert(newKeyData)
            }
          } catch (keyError) {
            console.error("Error al actualizar vehicle_keys:", keyError)
            // Continuar sin fallar
          }

          // Intentar resolución automática
          await tryAutoResolveIncident(entry)
        } else {
          // Es un movimiento de documento
          console.log("🔵 Procesando movimiento de documento:", entry.item_type)

          const isFromSpecialUser = SPECIAL_USERS.some((su) => su.id === entry.from_user_id)
          const from_user_id_to_insert = isFromSpecialUser ? null : entry.from_user_id

          const isToSpecialUser = SPECIAL_USERS.some((su) => su.id === entry.to_user_id)
          const to_user_id_to_insert = isToSpecialUser ? null : entry.to_user_id

          const movementData = {
            vehicle_id: vehicleId,
            document_type: entry.item_type,
            from_user_id: from_user_id_to_insert,
            to_user_id: to_user_id_to_insert,
            reason: entry.reason || "",
            confirmation_deadline: confirmationDeadline.toISOString(),
          }

          console.log("🔵 Datos del movimiento de documento:", movementData)

          const { error: movementError } = await supabase.from("document_movements").insert(movementData)

          if (movementError) {
            console.error("❌ Error al insertar movimiento de documento:", movementError)
            throw new Error(`Error al registrar movimiento: ${movementError.message}`)
          } else {
            console.log("✅ Movimiento de documento insertado correctamente")
          }

          // Actualizar o crear registro en vehicle_documents
          try {
            const { data: existingDoc } = await supabase
              .from("vehicle_documents")
              .select("id")
              .eq("license_plate", entry.license_plate.toUpperCase())
              .maybeSingle()

            const isToSpecialUserForDoc = SPECIAL_USERS.some((su) => su.id === entry.to_user_id)
            const toHolderIdForDoc = isToSpecialUserForDoc ? null : entry.to_user_id

            let docField: string
            let statusField: string

            if (entry.item_type === "technical_sheet") {
              docField = "technical_sheet_holder"
              statusField = "technical_sheet_status"
            } else if (entry.item_type === "circulation_permit") {
              docField = "circulation_permit_holder"
              statusField = "circulation_permit_status"
            } else {
              throw new Error(`Tipo de documento no soportado: ${entry.item_type}`)
            }

            const docUpdateData: Record<string, any> = {
              [docField]: toHolderIdForDoc,
              [statusField]: "Entregado",
              updated_at: new Date().toISOString(),
            }

            if (existingDoc) {
              await supabase
                .from("vehicle_documents")
                .update(docUpdateData)
                .eq("license_plate", entry.license_plate.toUpperCase())
            } else {
              const newDocData: Record<string, any> = {
                vehicle_id: vehicleId,
                license_plate: entry.license_plate.toUpperCase(),
                technical_sheet_status: "En concesionario",
                circulation_permit_status: "En concesionario",
              }

              if (entry.item_type === "technical_sheet") {
                newDocData.technical_sheet_holder = toHolderIdForDoc
                newDocData.technical_sheet_status = "Entregado"
              } else if (entry.item_type === "circulation_permit") {
                newDocData.circulation_permit_holder = toHolderIdForDoc
                newDocData.circulation_permit_status = "Entregado"
              }

              await supabase.from("vehicle_documents").insert(newDocData)
            }
          } catch (docError) {
            console.error("Error al actualizar vehicle_documents:", docError)
            // Continuar sin fallar
          }

          // Intentar resolución automática
          await tryAutoResolveIncident(entry)
        }
      }

      // Después de procesar todos los movimientos, enviar UN SOLO email con todo
      try {
        console.log("📧 Preparando envío de email consolidado...")

        // Agrupar movimientos por usuario que recibe
        const movimientosPorUsuario = new Map<
          string,
          {
            usuario_recibe: string
            email_recibe: string
            items: Array<{ matricula: string; material: string; observaciones?: string }>
          }
        >()

        // Procesar cada entrada para agrupar
        for (const entry of pendingEntries) {
          const userKey = entry.to_user_id
          const toUserEmail = users.find((u) => u.id === entry.to_user_id)?.email || null

          if (!movimientosPorUsuario.has(userKey)) {
            movimientosPorUsuario.set(userKey, {
              usuario_recibe: entry.toUserLabel,
              email_recibe: toUserEmail,
              items: [],
            })
          }

          movimientosPorUsuario.get(userKey)!.items.push({
            matricula: entry.license_plate,
            material: ITEM_TYPES.find((t) => t.value === entry.item_type)?.label || entry.item_type,
            observaciones: entry.reason || undefined, // Incluir observaciones aquí
          })
        }

        // Obtener email del usuario que entrega
        const fromUserEmail = users.find((u) => u.id === pendingEntries[0].from_user_id)?.email || null

        // Formatear fecha actual
        const now = new Date()
        const fechaFormateada = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`

        // Preparar datos consolidados del movimiento
        const consolidatedMovementData = {
          fecha: fechaFormateada,
          usuario_entrega: pendingEntries[0].fromUserLabel,
          email_entrega: fromUserEmail,
          movimientos: Array.from(movimientosPorUsuario.values()),
        }

        console.log("📧 Datos consolidados para email:", consolidatedMovementData)

        // Enviar email consolidado usando la API route
        const emailResponse = await fetch("/api/send-movement-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(consolidatedMovementData),
        })

        const emailResult = await emailResponse.json()

        if (emailResponse.ok && emailResult.success) {
          console.log("✅ Email consolidado enviado correctamente:", emailResult)
          toast.success("📧 Email de notificación enviado correctamente")
        } else {
          console.error("❌ Error enviando email consolidado:", emailResult)
          if (emailResult.message !== "Envío de emails deshabilitado") {
            toast.error(`Error enviando email: ${emailResult.message}`)
          }
        }
      } catch (emailError) {
        console.error("❌ Error crítico enviando email consolidado:", emailError)
        toast.error("Error enviando notificación por email")
      }

      toast.success("Todos los movimientos han sido registrados correctamente")
      setPendingEntries([])
      form.reset()
      setLicenseError(null)

      // Si no es admin, restablecer el usuario actual
      if (!isAdmin && currentUser) {
        form.setValue("from_user_id", currentUser.id)
      }

      // Notificar que se ha registrado un movimiento
      if (onMovementRegistered) {
        onMovementRegistered()
      }

      // Enfocar el primer campo
      licenseInputRef.current?.focus()
    } catch (err: any) {
      console.error("Error al registrar movimientos:", err)
      toast.error(err.message || "Error al registrar movimientos")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <BMWMSpinner size="md" />
        <p className="mt-4 text-muted-foreground">Cargando datos...</p>
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

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Matrícula */}
            <FormField
              control={form.control}
              name="license_plate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Matrícula</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Escribe la matrícula"
                      {...field}
                      ref={licenseInputRef}
                      className={cn(licenseError && "border-red-500")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          const isValid = verifyLicensePlate(field.value)
                          if (isValid) {
                            setTimeout(() => {
                              if (!isAdmin) {
                                setOpenItemType(true)
                              } else {
                                setOpenFromUser(true)
                              }
                            }, 100)
                          }
                        }
                      }}
                      onChange={(e) => {
                        const upperValue = e.target.value.toUpperCase()
                        field.onChange(upperValue)
                        if (upperValue) {
                          verifyLicensePlate(upperValue)
                        } else {
                          setLicenseError(null)
                        }
                      }}
                      onBlur={() => {
                        if (field.value) {
                          verifyLicensePlate(field.value)
                        }
                      }}
                    />
                  </FormControl>
                  {licenseError && <p className="text-sm text-red-500 mt-1">{licenseError}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Usuario que entrega */}
            <FormField
              control={form.control}
              name="from_user_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Usuario que entrega</FormLabel>
                  {!isAdmin ? (
                    <FormControl>
                      <Input value={currentUser?.full_name || ""} disabled className="bg-muted" />
                    </FormControl>
                  ) : (
                    <Popover open={openFromUser} onOpenChange={setOpenFromUser}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            ref={fromUserInputRef}
                            variant="outline"
                            role="combobox"
                            className={cn("justify-between", !field.value && "text-muted-foreground")}
                          >
                            {field.value
                              ? users.find((user) => user.id === field.value)?.full_name || field.value
                              : "Usuario que entrega"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        <Command>
                          <CommandInput placeholder="Buscar usuario..." autoFocus />
                          <CommandList>
                            <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
                            <CommandGroup className="max-h-60 overflow-y-auto">
                              {users.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={user.full_name}
                                  onSelect={() => {
                                    form.setValue("from_user_id", user.id)
                                    setOpenFromUser(false)
                                    setTimeout(() => {
                                      setOpenItemType(true)
                                    }, 100)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      user.id === field.value ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  {user.full_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de elemento */}
            <FormField
              control={form.control}
              name="item_type"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Material</FormLabel>
                  <Popover open={openItemType} onOpenChange={setOpenItemType}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          ref={itemTypeInputRef}
                          variant="outline"
                          role="combobox"
                          className={cn("justify-between", !field.value && "text-muted-foreground")}
                          onKeyDown={(e) => {
                            const key = e.key
                            if (["1", "2", "3", "4", "5"].includes(key)) {
                              e.preventDefault()
                              const selectedItem = ITEM_TYPES[Number.parseInt(key) - 1]
                              if (selectedItem) {
                                form.setValue("item_type", selectedItem.value)
                                setOpenItemType(false)
                                setTimeout(() => {
                                  setOpenToUser(true)
                                }, 100)
                              }
                            }
                          }}
                        >
                          {field.value
                            ? ITEM_TYPES.find((item) => item.value === field.value)?.label || field.value
                            : "Material"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Command
                        onKeyDown={(e) => {
                          const key = e.key
                          if (["1", "2", "3", "4", "5"].includes(key)) {
                            e.preventDefault()
                            const selectedItem = ITEM_TYPES[Number.parseInt(key) - 1]
                            if (selectedItem) {
                              form.setValue("item_type", selectedItem.value)
                              setOpenItemType(false)
                              setTimeout(() => {
                                setOpenToUser(true)
                              }, 100)
                            }
                          }
                        }}
                      >
                        <CommandInput placeholder="Buscar tipo..." autoFocus />
                        <CommandList>
                          <CommandEmpty>No se encontraron tipos.</CommandEmpty>
                          <CommandGroup>
                            {ITEM_TYPES.map((item) => (
                              <CommandItem
                                key={item.value}
                                value={`${item.searchKey} ${item.label}`}
                                onSelect={() => {
                                  form.setValue("item_type", item.value)
                                  setOpenItemType(false)
                                  setTimeout(() => {
                                    setOpenToUser(true)
                                  }, 100)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    item.value === field.value ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {item.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Usuario que recibe */}
            <FormField
              control={form.control}
              name="to_user_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Usuario que recibe</FormLabel>
                  <Popover open={openToUser} onOpenChange={setOpenToUser}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          ref={toUserInputRef}
                          variant="outline"
                          role="combobox"
                          className={cn("justify-between", !field.value && "text-muted-foreground")}
                        >
                          {field.value
                            ? users.find((user) => user.id === field.value)?.full_name || field.value
                            : "Usuario que recibe"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Command>
                        <CommandInput placeholder="Buscar usuario..." autoFocus />
                        <CommandList>
                          <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {users.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={user.full_name}
                                onSelect={() => {
                                  form.setValue("to_user_id", user.id)
                                  setOpenToUser(false)
                                  reasonInputRef.current?.focus()
                                }}
                              >
                                <Check
                                  className={cn("mr-2 h-4 w-4", user.id === field.value ? "opacity-100" : "opacity-0")}
                                />
                                {user.full_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Motivo en línea separada */}
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones (opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Indica el motivo o observaciones de la entrega"
                    {...field}
                    ref={reasonInputRef}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        addButtonRef.current?.click()
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Botón añadir debajo de observaciones */}
          <div className="flex justify-end">
            <Button type="button" ref={addButtonRef} onClick={addPendingEntry} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Añadir
            </Button>
          </div>
        </form>
      </Form>

      {/* Lista de entradas pendientes */}
      {pendingEntries.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Entradas pendientes ({pendingEntries.length})</h3>
            <Button variant="outline" size="sm" onClick={() => setPendingEntries([])}>
              Limpiar todo
            </Button>
          </div>

          <div className="border rounded-md divide-y">
            {pendingEntries.map((entry) => (
              <div key={entry.id} className="p-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium">{entry.vehicleLabel}</span>
                    <span className="mx-2 text-muted-foreground">•</span>
                    <span>{entry.itemTypeLabel}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    De: {entry.fromUserLabel} → Para: {entry.toUserLabel}
                  </div>
                  {entry.reason && (
                    <div className="text-sm mt-1">
                      <span className="text-muted-foreground">Observaciones:</span> {entry.reason}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => removePendingEntry(entry.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={submitPendingEntries} disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <BMWMSpinner size="sm" className="mr-2" />
                Registrando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Registrar {pendingEntries.length} movimiento{pendingEntries.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
