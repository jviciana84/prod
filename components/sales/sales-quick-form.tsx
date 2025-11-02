"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Check, ChevronsUpDown, Search, AlertCircle, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClientComponentClient } from "@/lib/supabase/client"
import { fixCorruptedCookies, clearCorruptedSession } from "@/utils/fix-auth"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandList, CommandInput, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BMWMSpinner } from "@/components/ui/bmw-m-spinner"

// Validación de matrícula española (formatos antiguos y nuevos)
const matriculaRegex = /^(\d{4}[A-Z]{3}|[A-Z]{2}\d{4}[A-Z])$/

// Actualizar el esquema de validación para incluir el campo de tipo de documento
const salesFormSchema = z.object({
  matricula: z
    .string()
    .min(1, "La matrícula es obligatoria")
    .refine((val) => matriculaRegex.test(val.toUpperCase()), {
      message: "Formato de matrícula inválido. Use 1234ABC o AB1234C",
    }),
  modelo: z.string().min(1, "El modelo es obligatorio"),
  asesor: z.string().min(1, "El asesor es obligatorio"),
  formaPago: z.string().min(1, "La forma de pago es obligatoria"),
  tipoDoc: z.string().min(1, "El tipo de documento es obligatorio"),
  precio: z.string().min(1, "El precio es obligatorio"),
})

// Actualizar el tipo SalesFormValues
type SalesFormValues = z.infer<typeof salesFormSchema>

// Opciones para los selectores
const FORMAS_PAGO = [
  { label: "Contado", value: "Contado" },
  { label: "Financiación", value: "Financiación" },
  { label: "Externa", value: "Externa" },
]

const TIPOS_DOCUMENTO = [
  { label: "DNI", value: "DNI" },
  { label: "NIE", value: "NIE" },
  { label: "CIF", value: "CIF" },
]

export function SalesQuickForm({ onSaleRegistered }: { onSaleRegistered?: () => void }) {
  const [asesores, setAsesores] = useState<{ label: string; value: string; alias?: string; id: string }[]>([])
  const [loadingAsesores, setLoadingAsesores] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBuscando, setIsBuscando] = useState(false)
  const [busquedaTimeout, setBusquedaTimeout] = useState<NodeJS.Timeout | null>(null)
  const [vehicleData, setVehicleData] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Referencias para los campos del formulario
  const matriculaRef = useRef<HTMLInputElement>(null)
  const modeloRef = useRef<HTMLInputElement>(null)
  const asesorTriggerRef = useRef<HTMLButtonElement>(null)
  const formaPagoTriggerRef = useRef<HTMLButtonElement>(null)
  const tipoDocTriggerRef = useRef<HTMLButtonElement>(null)
  const precioRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)

  // Estados para controlar los popover
  const [asesorOpen, setAsesorOpen] = useState(false)
  const [formaPagoOpen, setFormaPagoOpen] = useState(false)
  const [tipoDocOpen, setTipoDocOpen] = useState(false)

  // Cliente de Supabase
  const supabase = createClientComponentClient()

  // Detectar y limpiar cookies corruptas automáticamente
  useEffect(() => {
    try {
      // Intentar detectar cookies corruptas
      const cookiesFixed = fixCorruptedCookies()
      if (cookiesFixed) {
        console.log("🔧 Cookies corruptas detectadas y limpiadas automáticamente")
        // Recargar la página para reiniciar con cookies limpias
        window.location.reload()
        return
      }
    } catch (error) {
      console.error("Error al verificar cookies:", error)
      // Si hay error, limpiar todo y recargar
      clearCorruptedSession()
    }
  }, [])

  // Función para cargar los asesores de ventas
  const cargarAsesoresDeVentas = async () => {
    setLoadingAsesores(true)
    try {
      // Usar directamente el ID 4 para el rol "Asesor ventas"
      const asesorVentasRoleId = 4

      // Ahora obtenemos los IDs de usuarios con rol "Asesor ventas"
      const { data: userRolesData, error: userRolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role_id", asesorVentasRoleId)

      if (userRolesError) {
        console.error("❌ [SalesQuickForm] Error al cargar roles de usuarios:", userRolesError)
        return
      }

      if (!userRolesData || userRolesData.length === 0) {
        console.log("⚠️ [SalesQuickForm] No se encontraron usuarios con rol de asesor de ventas")
        setAsesores([])
        setLoadingAsesores(false)
        return
      }

      // Extraemos los IDs de usuario
      const userIds = userRolesData.map((role) => role.user_id)

      // Ahora obtenemos los perfiles de estos usuarios
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, alias")
        .in("id", userIds)

      if (profilesError) {
        console.error("❌ [SalesQuickForm] Error al cargar perfiles de asesores:", profilesError)
        return
      }

      if (profilesData && profilesData.length > 0) {
        // Transformar los datos al formato requerido
        const asesoresFormateados = profilesData.map((profile) => ({
          label: profile.full_name, // Nombre completo para mostrar en el desplegable
          value: profile.id.toString(), // ID del usuario como valor para el formulario
          alias: profile.alias || profile.full_name.split(" ")[0], // Alias o primera parte del nombre
          id: profile.id.toString(), // ID del usuario para guardar en la BD
        }))

        setAsesores(asesoresFormateados)
      } else {
        console.log("⚠️ [SalesQuickForm] No se encontraron perfiles para los asesores")
        setAsesores([])
      }
    } catch (err) {
      console.error("❌ [SalesQuickForm] Error al cargar asesores:", err)
      setAsesores([])
    } finally {
      setLoadingAsesores(false)
    }
  }

  // Actualizar los valores por defecto en useForm
  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      matricula: "",
      modelo: "",
      asesor: "",
      formaPago: "",
      tipoDoc: "",
      precio: "",
    },
  })

  // Función para validar matrícula
  const validateMatricula = (matricula: string): boolean => {
    return matriculaRegex.test(matricula.toUpperCase())
  }

  // Función para buscar vehículo por matrícula en la base de datos real
  const buscarVehiculoPorMatricula = async (matricula: string) => {
    if (!validateMatricula(matricula)) {
      setErrorMessage("Formato de matrícula inválido. Use 1234ABC o AB1234C")
      return null
    }

    setIsBuscando(true)
    setVehicleData(null)
    setErrorMessage(null)

    try {
      // Primero verificamos si el vehículo ya está vendido
      const { data: existingSale, error: saleError } = await supabase
        .from("sales_vehicles")
        .select("*")
        .eq("license_plate", matricula.toUpperCase())
        .maybeSingle()

      if (saleError) {
        console.error("Error al verificar si el vehículo ya está vendido:", saleError)
        setErrorMessage("Error al verificar si el vehículo ya está vendido")
        return null
      }

      if (existingSale) {
        setErrorMessage(
          `Este vehículo ya está registrado como vendido (Asesor: ${existingSale.advisor || existingSale.advisor_name}, Fecha: ${new Date(
            existingSale.sale_date,
          ).toLocaleDateString()})`,
        )
        return null
      }

      // Buscamos el vehículo en stock
      const { data, error } = await supabase
        .from("stock")
        .select("*")
        .eq("license_plate", matricula.toUpperCase())
        .maybeSingle()

      if (error) {
        console.error("Error al buscar vehículo:", error)
        setErrorMessage("Error al buscar el vehículo en la base de datos")
        return null
      }

      if (!data) {
        setErrorMessage("No se encontró ningún vehículo con esta matrícula")
        return null
      }

      // Registramos los datos para depuración
      console.log("Datos del vehículo encontrado:", data)
      setVehicleData(data)
      return data
    } catch (error) {
      console.error("Error en la búsqueda:", error)
      setErrorMessage("Error inesperado al buscar el vehículo")
      return null
    } finally {
      setIsBuscando(false)
    }
  }

  // Función para determinar el modelo del vehículo a partir de los datos
  const obtenerModeloDeVehiculo = (vehiculo: any) => {
    // Intentamos diferentes nombres de columna que podrían contener el modelo
    if (!vehiculo) return null

    // Posibles nombres de columna para el modelo
    const posiblesColumnas = ["model", "modelo", "vehicle_model", "car_model", "nombre_modelo", "descripcion"]

    for (const columna of posiblesColumnas) {
      if (vehiculo[columna]) {
        return vehiculo[columna]
      }
    }

    // Si no encontramos una columna específica, intentamos usar una combinación de marca y modelo
    if (vehiculo.marca && vehiculo.modelo) {
      return `${vehiculo.marca} ${vehiculo.modelo}`
    }

    if (vehiculo.brand && vehiculo.model) {
      return `${vehiculo.brand} ${vehiculo.model}`
    }

    // Si todo lo demás falla, usamos la primera propiedad que parezca útil
    const keys = Object.keys(vehiculo)
    for (const key of keys) {
      // Excluimos columnas que probablemente no sean el modelo
      if (!["id", "license_plate", "created_at", "updated_at"].includes(key) && typeof vehiculo[key] === "string") {
        return vehiculo[key]
      }
    }

    return "Modelo desconocido"
  }

  // Función para manejar cambios en el campo de matrícula
  const handleMatriculaChange = async (e: React.ChangeEvent<HTMLInputElement>, onChange: (...event: any[]) => void) => {
    const matricula = e.target.value.toUpperCase()
    onChange(matricula)

    // Cancelar búsqueda anterior si existe
    if (busquedaTimeout) {
      clearTimeout(busquedaTimeout)
    }

    // Limpiar datos y errores si se borra la matrícula
    if (!matricula) {
      setVehicleData(null)
      setErrorMessage(null)
      return
    }

    // Solo buscar si la matrícula tiene el formato correcto
    if (validateMatricula(matricula)) {
      // Esperar un poco antes de buscar para evitar demasiadas consultas
      const timeout = setTimeout(async () => {
        const vehiculo = await buscarVehiculoPorMatricula(matricula)
        if (vehiculo) {
          const modeloVehiculo = obtenerModeloDeVehiculo(vehiculo)
          if (modeloVehiculo) {
            form.setValue("modelo", modeloVehiculo)
          }
        }
      }, 500)

      setBusquedaTimeout(timeout)
    } else {
      // Mostrar error si el formato no es válido
      setErrorMessage(null) // Limpiamos errores anteriores
    }
  }

  // Función para manejar la tecla Enter en el campo de matrícula
  const handleMatriculaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()

      const matricula = form.getValues("matricula")
      if (!validateMatricula(matricula)) {
        setErrorMessage("Formato de matrícula inválido. Use 1234ABC o AB1234C")
        return
      }

      modeloRef.current?.focus()
    }
  }

  // Función para formatear el precio
  const formatPrice = (price: string): number => {
    // Eliminar caracteres no numéricos excepto punto y coma
    const cleanedPrice = price.replace(/[^\d.,]/g, "")

    // Reemplazar comas por puntos y asegurarse de que solo hay un punto decimal
    const parts = cleanedPrice.split(/[.,]/)
    let formattedPrice = parts[0]

    if (parts.length > 1) {
      formattedPrice += "." + parts[1]
    }

    return Number.parseFloat(formattedPrice)
  }

  // Función para manejar el envío del formulario
  async function onSubmit(data: SalesFormValues) {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      // Verificar estado de las cookies antes de proceder
      try {
        await supabase.auth.getSession()
      } catch (sessionError) {
        console.error("Error de sesión detectado:", sessionError)
        setErrorMessage("Error de autenticación. Limpiando cookies y recargando...")
        clearCorruptedSession()
        return
      }

      if (!vehicleData) {
        setErrorMessage("No se encontró información del vehículo. Por favor, verifica la matrícula.")
        return
      }

      // Formatear el precio
      const formattedPrice = formatPrice(data.precio)

      if (isNaN(formattedPrice) || formattedPrice <= 0) {
        setErrorMessage("El precio debe ser un número válido mayor que cero")
        return
      }

      // Buscar el asesor seleccionado para obtener su información
      const asesorSeleccionado = asesores.find((asesor) => asesor.value === data.asesor)

      if (!asesorSeleccionado) {
        setErrorMessage("No se encontró información del asesor seleccionado")
        return
      }

      // Preparar los datos para insertar en la tabla sales_vehicles
      const salesData = {
        license_plate: data.matricula.toUpperCase(),
        model: data.modelo,
        vehicle_type: vehicleData?.vehicle_type || "Coche",
        stock_id: vehicleData?.id || null,
        sale_date: new Date().toISOString(),
        advisor: asesorSeleccionado.alias,
        advisor_name: asesorSeleccionado.label,
        advisor_id: asesorSeleccionado.id,
        expense_charge: vehicleData?.expense_charge || null,
        payment_method: data.formaPago,
        payment_status: "pendiente",
        price: formattedPrice,
        document_type: data.tipoDoc,
        cyp_status: "pendiente",
        photo_360_status: "pendiente",
        validated: false,
        delivery_center: vehicleData?.work_center || "Terrassa", // Heredar del vehículo en stock
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("Datos a insertar:", salesData)

      // Insertar via API Route
      const response = await fetch("/api/sales/create-quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salesData }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        console.error("Error al registrar la venta:", result.error)
        setErrorMessage(`Error al registrar la venta: ${result.error}`)
        return
      }

      console.log("Venta registrada correctamente")
      toast.success("Venta registrada correctamente")
      form.reset()
      setVehicleData(null)
      setErrorMessage(null)

      // Notificar que se ha registrado una venta
      if (onSaleRegistered) {
        onSaleRegistered()
      }

      // Devolver el foco al primer campo
      setTimeout(() => {
        if (matriculaRef.current) matriculaRef.current.focus()
      }, 100)
    } catch (error: any) {
      console.error("Error al registrar la venta:", error)

      // Si el error es relacionado con autenticación, limpiar cookies
      if (error.message?.includes("session") || error.message?.includes("auth") || error.message?.includes("cookie")) {
        setErrorMessage("Error de autenticación detectado. Limpiando cookies...")
        setTimeout(() => {
          clearCorruptedSession()
        }, 2000)
      } else {
        setErrorMessage(`Error inesperado: ${error.message || "Error desconocido"}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cargar asesores al montar el componente
  useEffect(() => {
    cargarAsesoresDeVentas()
  }, [])

  // Efecto para enfocar el primer campo al cargar
  useEffect(() => {
    if (matriculaRef.current) {
      matriculaRef.current.focus()
    }
  }, [])

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                <FormField
                  control={form.control}
                  name="matricula"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-1">
                      <FormLabel className="text-xs">Matrícula</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="1234ABC"
                            {...field}
                            value={field.value.toUpperCase()}
                            className={cn(
                              "uppercase pr-10 h-8 text-sm",
                              "placeholder:text-xs placeholder:text-muted-foreground/70",
                              "overflow-hidden text-ellipsis whitespace-nowrap",
                            )}
                            ref={matriculaRef}
                            onChange={(e) => handleMatriculaChange(e, field.onChange)}
                            onKeyDown={handleMatriculaKeyDown}
                          />
                        </FormControl>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          {isBuscando ? (
                            <BMWMSpinner size={12} />
                          ) : (
                            field.value && <Search className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="modelo"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-1">
                      <FormLabel className="text-xs">Modelo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="M3 Competition"
                          {...field}
                          ref={modeloRef}
                          className={cn(
                            "h-8 text-sm",
                            "placeholder:text-xs placeholder:text-muted-foreground/70",
                            "overflow-hidden text-ellipsis whitespace-nowrap",
                          )}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              if (asesorTriggerRef.current) {
                                asesorTriggerRef.current.focus()
                                setAsesorOpen(true)
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="asesor"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-1">
                      <FormLabel className="text-xs">Asesor</FormLabel>
                      <Popover open={asesorOpen} onOpenChange={setAsesorOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              ref={asesorTriggerRef}
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between font-normal h-8 text-sm",
                                !field.value && "text-muted-foreground",
                                "overflow-hidden text-ellipsis whitespace-nowrap",
                              )}
                              onClick={() => setAsesorOpen(true)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  setAsesorOpen(true)
                                }
                              }}
                            >
                              <span className="truncate">
                                {loadingAsesores ? (
                                  <span className="flex items-center">
                                    <BMWMSpinner size={12} className="mr-1" />
                                    Cargando...
                                  </span>
                                ) : field.value ? (
                                  asesores.find((asesor) => asesor.value === field.value)?.label || field.value
                                ) : (
                                  "Seleccionar asesor"
                                )}
                              </span>
                              <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar asesor..." />
                            <CommandList>
                              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                              <CommandGroup>
                                {loadingAsesores ? (
                                  <div className="flex items-center justify-center p-2">
                                    <BMWMSpinner size={16} className="mr-2" />
                                    <span>Cargando asesores...</span>
                                  </div>
                                ) : asesores.length === 0 ? (
                                  <div className="p-2 text-center text-sm text-muted-foreground">
                                    No se encontraron asesores de ventas
                                  </div>
                                ) : (
                                  asesores.map((asesor) => (
                                    <CommandItem
                                      key={asesor.value}
                                      value={asesor.label} // Usamos el nombre para la búsqueda
                                      onSelect={() => {
                                        form.setValue("asesor", asesor.value)
                                        setAsesorOpen(false)
                                        setTimeout(() => {
                                          if (formaPagoTriggerRef.current) {
                                            formaPagoTriggerRef.current.focus()
                                            setFormaPagoOpen(true)
                                          }
                                        }, 100)
                                      }}
                                    >
                                      {asesor.label}
                                      <Check
                                        className={cn(
                                          "ml-auto h-3 w-3",
                                          asesor.value === field.value ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                    </CommandItem>
                                  ))
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="formaPago"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-1">
                      <FormLabel className="text-xs">Forma de pago</FormLabel>
                      <Popover open={formaPagoOpen} onOpenChange={setFormaPagoOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              ref={formaPagoTriggerRef}
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between font-normal h-8 text-sm",
                                !field.value && "text-muted-foreground",
                                "overflow-hidden text-ellipsis whitespace-nowrap",
                              )}
                              onClick={() => setFormaPagoOpen(true)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  setFormaPagoOpen(true)
                                }
                              }}
                            >
                              <span className="truncate">
                                {field.value
                                  ? FORMAS_PAGO.find((forma) => forma.value === field.value)?.label
                                  : "Seleccionar forma de pago"}
                              </span>
                              <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar forma de pago..." />
                            <CommandList>
                              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                              <CommandGroup>
                                {FORMAS_PAGO.map((forma) => (
                                  <CommandItem
                                    key={forma.value}
                                    value={forma.value}
                                    onSelect={() => {
                                      form.setValue("formaPago", forma.value)
                                      setFormaPagoOpen(false)
                                      setTimeout(() => {
                                        if (tipoDocTriggerRef.current) {
                                          tipoDocTriggerRef.current.focus()
                                          setTipoDocOpen(true)
                                        }
                                      }, 100)
                                    }}
                                  >
                                    {forma.label}
                                    <Check
                                      className={cn(
                                        "ml-auto h-3 w-3",
                                        forma.value === field.value ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipoDoc"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-1">
                      <FormLabel className="text-xs">Tipo doc.</FormLabel>
                      <Popover open={tipoDocOpen} onOpenChange={setTipoDocOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              ref={tipoDocTriggerRef}
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between font-normal h-8 text-sm",
                                !field.value && "text-muted-foreground",
                                "overflow-hidden text-ellipsis whitespace-nowrap",
                              )}
                              onClick={() => setTipoDocOpen(true)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  setTipoDocOpen(true)
                                }
                              }}
                            >
                              <span className="truncate">
                                {field.value
                                  ? TIPOS_DOCUMENTO.find((tipo) => tipo.value === field.value)?.label
                                  : "Seleccionar tipo"}
                              </span>
                              <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar tipo..." />
                            <CommandList>
                              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                              <CommandGroup>
                                {TIPOS_DOCUMENTO.map((tipo) => (
                                  <CommandItem
                                    key={tipo.value}
                                    value={tipo.value}
                                    onSelect={() => {
                                      form.setValue("tipoDoc", tipo.value)
                                      setTipoDocOpen(false)
                                      setTimeout(() => {
                                        precioRef.current?.focus()
                                      }, 100)
                                    }}
                                  >
                                    {tipo.label}
                                    <Check
                                      className={cn(
                                        "ml-auto h-3 w-3",
                                        tipo.value === field.value ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="precio"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-1">
                      <FormLabel className="text-xs">Precio</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="25000"
                          {...field}
                          ref={precioRef}
                          className={cn(
                            "h-8 text-sm",
                            "placeholder:text-xs placeholder:text-muted-foreground/70",
                            "overflow-hidden text-ellipsis whitespace-nowrap",
                          )}
                          type="text"
                          inputMode="numeric"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              submitRef.current?.focus()
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-col gap-2 min-w-[140px] w-full md:w-[140px]">
                <Link href="/dashboard/ventas/upload-pdf" className="w-full">
                  <Button
                    variant="outline"
                    className="h-8 text-sm w-full flex items-center gap-2 justify-center"
                    type="button"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Subir PDF</span>
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting || !!errorMessage}
                  ref={submitRef}
                  className="h-8 text-sm w-full relative overflow-hidden transition-all duration-200 flex items-center justify-center"
                >
                  <span
                    className={cn(
                      "inline-block transition-all duration-200",
                      isSubmitting ? "opacity-0" : "opacity-100",
                    )}
                  >
                    Registrar
                  </span>
                  {isSubmitting && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <BMWMSpinner size="sm" />
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {errorMessage && (
              <Alert variant="destructive" className="py-2 mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-sm font-medium">Error</AlertTitle>
                <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
              </Alert>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default SalesQuickForm
